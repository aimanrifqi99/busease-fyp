// assistantController.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import Booking from '../models/BookingModel.js';
import Schedule from '../models/ScheduleModel.js';
import * as chrono from 'chrono-node';
import mongoose from 'mongoose';

// 1) Capitalize each word's first letter
const capitalize = (str) => {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

// 2) Format date in a readable format
const formatDate = (date) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(date).toLocaleDateString(undefined, options);
};

// 3) Utility to find partial-match city in city list
const findCityMatch = (inputCity, cityList) => {
  const userCity = inputCity.trim().toLowerCase();

return cityList.find((city) => {
  const c = ` ${city.toLowerCase()} `;
  const u = ` ${userCity} `;
  return c.includes(u);
});
};

// 4) Extract relevant entities (bus name, cities, date) from text
export const extractDetails = (text, cities) => {
  let busName = null;
  const lowerText = text.toLowerCase();

  // Capture date
  const parsedDate = chrono.parseDate(text);
  const date = (parsedDate && !isNaN(parsedDate)) ? parsedDate : null;

  // Capture bus name (if any)
  const busNameMatch = text.match(
    /bus\s+([\w\s]+?)(?=\s+(from|to|on|at|departing|leaving|heading)|$)/i
  );
  if (busNameMatch && busNameMatch[1]) {
    busName = busNameMatch[1].trim();
  }

  // Detect city occurrences by indexOf
  const matchedCities = [];
  cities.forEach((city) => {
    const baseName = city.split('(')[0].trim().toLowerCase(); // e.g., "kuala lumpur"
    const index = lowerText.indexOf(baseName);
    if (index !== -1) {
      matchedCities.push({ city: city.toLowerCase(), index });
    }
  });

  // Sort by ascending index to preserve the order typed by the user
  matchedCities.sort((a, b) => a.index - b.index);

  // Convert to an array of city names (unique, in typed order)
  const foundCities = [];
  for (const item of matchedCities) {
    if (!foundCities.includes(item.city)) {
      foundCities.push(item.city);
    }
  }

  // Only keep up to 2
  const uniqueCities = foundCities.slice(0, 2);

  return { foundCities: uniqueCities, date, busName };
};

export const assistantHandler = async (req, res) => {
  try {
    const { question, userId, conversationState } = req.body;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        candidateCount: 1,
        maxOutputTokens: 400,
        temperature: 0.2,
      },
    });

    let responseText = "";
    const lowerCaseQuestion = question.toLowerCase();
    let state = conversationState || {};

    // Known cities list
    const cities = [
      'seberang perai ()', 'bukit mertajam ()', 'balik pulau ()', 'batu ferringhi ()', 'gelugor ()', 'george town (Penang Sentral)', 
      'tanjung bungah ()', 'teluk kumbar ()', 'bayan lepas ()', 'bayan baru ()', 'air itam ()', 'permatang pauh ()', 
      'permatang tinggi ()', 'nibong tebal ()', 'seberang jaya ()', 'bukit tambun ()', 'simpang empat ()', 'prai ()', 
      'tasek gelugor ()', 'jelutong ()', 'machang bubok ()',

      'kangar (Terminal Bas Kangar)', 'arau ()', 'kuala perlis ()', 'santan ()', 'padang besar ()', 'sungai batu pahat ()', 
      'kaki bukit ()', 'beseri ()', 'kampung wai ()', 'kangar utara ()',

      'sungai petani ()', 'kulim ()', 'jitra ()', 'changlun ()', 'gurun ()', 'baling ()', 'pendang ()', 'yan ()', 'pokok sena ()', 
      'langkawi ()', 'kuala kedah ()', 'guar chempedak ()', 'alor setar (Terminal Shahab Perdana)', 'bukit kayu hitam ()', 
      'padang terap ()', 'kuala nerang ()', 'bedong ()', 'sik ()', 'tanjung dawai ()', 'bandar baru ()', 
      'kubang pasu ()', 'serdang ()', 'kampung titi batu ()', 'kampung kuala muda ()', 'tokai ()',

      'taiping ()', 'teluk intan ()', 'sitiawan ()', 'manjung ()', 'parit buntar ()', 'batu gajah ()', 'tanjung malim ()', 
      'bagan serai ()', 'kampar ()', 'tapah ()', 'chenderiang ()', 'pusing ()', 'parit ()', 'pangkor ()', 'slim river ()', 
      'lenggong ()', 'kerian ()', 'beruas ()', 'changkat jering ()', 'ipoh (Terminal Amanjaya)', 'lumut ()', 'pantai remis ()', 
      'bidor ()', 'malim nawar ()', 'tanjung rambutan ()', 'kampung gajah ()', 'sungai siput ()', 'trong ()', 'tambun ()', 
      'menglembu ()', 'gopeng ()', 'kuala kangsar ()', 'selama ()', 'ayer tawar ()', 'ayer hitam ()', 'pasir salak ()',

      'petaling jaya ()', 'subang jaya ()', 'ampang ()', 'rawang ()', 'kuala selangor ()', 'kajang ()', 'bandar baru bangi ()', 
      'puchong ()', 'klang ()', 'gombak ()', 'banting ()', 'sabak bernam ()', 'putrajaya ()', 'jenjarom ()', 'sepang ()', 
      'ampang jaya ()', 'damansara ()', 'cheras ()', 'hulu selangor ()', 'Kuala Lumpur (Tbs)', 'shah alam (Terminal 17)', 
      'seri kembangan ()', 'cyberjaya ()', 'sunway ()', 'damansara utama ()', 'setia alam ()', 'bandar kinrara ()', 
      'bandar tasik selatan ()', 'usj ()', 'bukit jelutong ()', 'denai alam ()', 'bandar puteri ()', 'tropicana ()', 
      'sungai buloh ()', 'balakong ()', 'batang kali ()', 'sungai pelek ()', 'bandar sunway ()', 'bukit tinggi ()', 
      'serendah ()', 'bukit beruntung ()', 'bandar baru selayang ()', 'puncak alam ()', 'taman melawati ()', 
      'seri serdang ()', 'taman tun dr ismail ()', 'bukit subang ()',

      'port dickson ()', 'nilai ()', 'rasah ()', 'bahau ()', 'kuala pilah ()', 'mantin ()', 'lukut ()', 'rantau ()', 
      'seremban (Terminal One)', 'tampin ()', 'gemas ()', 'senawang ()', 'simpang durian ()', 'labu ()', 'linggi ()', 
      'paroi ()', 'pedas ()', 'remao ()', 'juasseh ()', 'sungai gadut ()', 'rombai ()', 'mantau ()', 
      'batang benar ()',

      'ayer keroh ()', 'bukit katil ()', 'masjid tanah ()', 'klebang ()', 'merlimau ()', 'sungai udang ()', 
      'melaka tengah ()', 'alor gajah ()', 'jasin ()', 'kampung morten ()', 'padang tembak ()', 'bemban ()', 
      'ayer molek ()', 'durian tunggal ()', 'cheng ()', 'tanjung kling ()', 'machap baru ()', 'sungai rambai ()', 
      'selandar ()',

      'temerloh ()', 'bentong ()', 'raub ()', 'jerantut ()', 'genting highlands ()', 'chenor ()', 'kuala lipis ()', 
      'rompin ()', 'jengka ()', 'muadzam shah ()', 'pekan ()', 'mentakab ()', 'maran ()', 'gambang ()', 'kuala krau ()', 
      'beras jaya ()', 'keratong ()', 'dong ()', 'lanchang ()', 'triang ()', 'felda tanah rancangan ()', 'cherating ()', 
      'benta ()', 'padang tengku ()', 'kuantan (Kuantan Sentral)',

      'dungun ()', 'kemaman ()', 'marang ()', 'besut ()', 'setiu ()', 'hulu terengganu ()', 'chukai ()', 
      'kuala berang ()', 'ajil ()', 'jerteh ()', 'kijal ()', 'manir ()', 'wakaf tapai ()', 
      'kuala terengganu (Terminal Bas Mbkt)', 'kuala nerus ()', 'merang ()', 'kampung raja ()', 
      'seberang takir ()', 'penarik ()', 'bukit besi ()', 'paka ()', 'rantau abang ()', 'kuala ibai ()', 
      'gong badak ()', 'batangan ()', 'teluk kalong ()',

      'Kota Bharu (Terminal Bas Kota Bharu)', 'pasir mas ()', 'tumpat ()', 'machang ()', 'tanah merah ()', 
      'jelawat ()', 'pengkalan chepa ()', 'wakaf bharu ()', 'bachok ()', 'kok lanas ()', 'ketereh ()', 'melor ()', 
      'pangkalan kubor ()', 'gual ipoh ()', 'kuala krai ()', 'salor ()', 'kandis ()', 'kampung tok bali ()', 
      'jelawat ()', 'manek urai ()', 'pasir hor ()', 'rantau panjang ()', 'pasir puteh ()', 'dabong ()', 
      'guchil ()', 'gunong ()', 'kemubu ()', 'ketereh ()', 'pangkal kalong ()', 'pulai chondong ()', 
      'temangan ()', 'tendong ()', 'bukit bator ()', 'bukit marak ()', 'kok bator ()',

      'batu pahat ()', 'muar ()', 'kulaijaya ()', 'iskandar puteri ()', 'skudai ()', 'senai ()', 
      'tangkak ()', 'ayer hitam ()', 'kluang ()', 'pontian ()', 'kota tinggi ()', 'mersing ()', 
      'yong peng ()', 'labis ()', 'segamat ()', 'simpang renggam ()', 'kangkar pulai ()', 
      'parit raja ()', 'gelang patah ()', 'benut ()', 'bukit gambir ()', 'chaah ()', 'endau ()', 
      'kangkar senangar ()', 'parit jawa ()', 'parit sulong ()', 'pengerang ()', 'penggaram ()', 
      'sri gading ()', 'tanjung langsat ()', 'tanjung sedili ()', 'felda nitar ()', 
      'sungai rengit ()', 'lukut ()', 'semborong ()', 'kota tinggi ()', 'masai ()', 
      'kangkar tebrau ()', 'senibong ()', 'johor bahru (Jb Sentral)'

    ];

    // Extract details
    const { foundCities, date, busName } = extractDetails(question, cities);

    // Handle cancellation confirmation
    if (state.confirmCancel) {
      if (lowerCaseQuestion.includes('yes')) {
        responseText = "Please provide the Booking ID of the booking you wish to cancel<br>Reply \"no\" if you do not want cancel the bookings<br><br>Your Bookings:<br><br>";
        const userBookings = await Booking.find({ user: userId, status: 'ongoing' }).populate('schedule');

        if (!userBookings.length) {
          responseText = "You have no active bookings to cancel.";
          state.confirmCancel = false;
          return res.json({ response: responseText, conversationState: state });
        }

        userBookings.forEach((booking) => {
          responseText += `Booking ID: ${booking._id}<br>`;
          responseText += `Bus Name: ${booking.schedule.name}<br>`;
          responseText += `Departure Date: ${formatDate(booking.schedule.departureDate)}<br><br>`;
        });

        state.awaitingBookingId = true;
        state.confirmCancel = false;
        return res.json({ response: responseText, conversationState: state });
      }

      if (lowerCaseQuestion.includes('no')) {
        responseText = "Let me know if you need help with anything else!";
        state.confirmCancel = false;
        return res.json({ response: responseText, conversationState: state });
      }

      responseText = "Please reply \"yes\" to confirm the cancellation or \"no\" to abort.";
      return res.json({ response: responseText, conversationState: state });
    }

    // Handle booking cancellation after asking for Booking ID
    if (state.awaitingBookingId) {
      if (lowerCaseQuestion.includes('no')) {
        responseText = "Let me know if you need help with anything else!";
        state.awaitingBookingId = false;
        return res.json({ response: responseText, conversationState: state });
      }
    
      // Check if user provided a non-empty input
      if (!question.trim()) {
        responseText = "You did not provide a Booking ID. Please enter a valid Booking ID, or reply \"no\" to stop the cancellation process.";
        return res.json({ response: responseText, conversationState: state });
      }
    
      const bookingId = question.trim();
    
      // ---- NEW CHECK FOR VALID MONGODB OBJECTID ----
      if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        responseText = "Please provide a valid Booking ID to cancel. If you don't want to cancel anymore, please reply \"no\".";
        return res.json({ response: responseText, conversationState: state });
      }
    
      try {
        const bookingToCancel = await Booking.findOne({ 
          _id: bookingId,
          user: userId,
          status: 'ongoing' 
        }).populate('schedule');
    
        if (!bookingToCancel) {
          responseText = "Invalid Booking ID or you have no such booking. Please provide a valid Booking ID.";
          return res.json({ response: responseText, conversationState: state });
        }
    
        // Proceed with cancellation
        bookingToCancel.status = 'cancelled';
        await bookingToCancel.save();
    
        const schedule = await Schedule.findById(bookingToCancel.schedule._id);
        bookingToCancel.seatNumbers.forEach((seatNumber) => {
          const seat = schedule.seatNumbers.find((s) => s.number === seatNumber);
          if (seat) seat.isBooked = false;
        });
        await schedule.save();
    
        responseText = `Your booking with ID ${bookingId} for ${schedule.name} on ${formatDate(schedule.departureDate)} has been cancelled.`;
        state.awaitingBookingId = false;
        return res.json({ response: responseText, conversationState: state });
    
      } catch (err) {
        // If for some reason we still get an error, handle gracefully:
        console.error("Error cancelling booking:", err.message);
        responseText = "Something went wrong while cancelling your booking. Please try again.";
        return res.json({ response: responseText, conversationState: state });
      }
    }

    // Initiate booking cancellation
    if (
      /\b(cancel|void|stop|end|refund|revoke|delete|erase|remove|terminate|abort|discard|withdraw|drop|cease)\s+(my|a|the|this|that|these|those|any|all|current|existing|past|upcoming|latest|previous)?\s*(booking|bookings|ticket|tickets|reservation|reservations|bus|buses|bas|trip|trips|journey|journeys|schedule|schedules)\b/.test(lowerCaseQuestion)&&
      !state.awaitingBookingId &&
      !/\b(how|should|contact|call|seat|seats|anytime|time|when)\b/.test(lowerCaseQuestion)
    )
     {
      if (!userId) {
        responseText = "Please log in to cancel your booking.";
        return res.json({ response: responseText });
      }
      responseText = "Do you really want to cancel your booking? Please reply \"yes\" to confirm or \"no\" to abort.";
      state.confirmCancel = true;
      return res.json({ response: responseText, conversationState: state });
    }

    // Check for booking inquiries
    if (
      /\bmy\s+(booking|bookings|ticket|tickets|reservation|reservations|bus|buses)\b/.test(lowerCaseQuestion) &&
      !/\b(cancel|void|stop|end|edit|refund|revoke|delete|modify|remove|terminate)\b/.test(lowerCaseQuestion)
    ) {
      if (!userId) {
        responseText = "Please log in to access your booking information.";
        return res.json({ response: responseText });
      }

      const userBookings = await Booking.find({ user: userId }).populate('schedule');
      if (!userBookings.length) {
        responseText = "You have no bookings.";
        return res.json({ response: responseText });
      }

      responseText = "Here are your bookings:<br><br>";
      userBookings.forEach((booking) => {
        responseText += `Booking ID: ${booking._id}<br>`;
        responseText += `Bus Name: ${booking.schedule.name}<br>`;
        responseText += `Origin: ${capitalize(booking.schedule.origin)}<br>`;
        responseText += `Destination: ${capitalize(booking.schedule.destination)}<br>`;
        responseText += `Departure Date: ${formatDate(booking.schedule.departureDate)}<br>`;
        responseText += `Seat Numbers: ${booking.seatNumbers.join(', ')}<br>`;
        responseText += `Status: ${capitalize(booking.status)}<br><br>`;
      });
      return res.json({ response: responseText });
    }
    

    // Handle bus availability queries
    const isBusQuery =
      lowerCaseQuestion.includes('bus') ||
      lowerCaseQuestion.includes('schedule') ||
      lowerCaseQuestion.includes('ticket');

    if ((isBusQuery && foundCities.length >= 1) || foundCities.length >= 1) {
      // If we recognized more than 2 cities, ask user to clarify
      if (foundCities.length > 2) {
        responseText = "I detected multiple cities in your request. Please rewrite or specify exactly two cities using 'from' and 'to'.";
        return res.json({ response: responseText, conversationState: state });
      }

      let origin = null;
      let destination = null;

      // Check for 'from' and 'to'
      const fromMatch = lowerCaseQuestion.match(/from\s+([a-z\s]+?)(?=\s+(to|on|at|departing|leaving|heading)|[?.!]|$)/i);
      const toMatch = lowerCaseQuestion.match(/to\s+([a-z\s]+?)(?=\s+(from|on|at|departing|leaving|heading)|[?.!]|$)/i);

      if (fromMatch && toMatch) {
        // 1) "from X to Y"
        origin = fromMatch[1].trim().toLowerCase();
        destination = toMatch[1].trim().toLowerCase();
      } else if (fromMatch) {
        // 2) Only "from"
        origin = fromMatch[1].trim().toLowerCase();
        // If we found 2 cities, the other one is destination
        if (foundCities.length === 2) {
          destination = foundCities.find(c => c !== origin) || null;
        }
      } else if (toMatch) {
        // 3) Only "to"
        destination = toMatch[1].trim().toLowerCase();
        // If we found 2 cities, the other is origin
        if (foundCities.length === 2) {
          origin = foundCities.find(c => c !== destination) || null;
        }
      } else if (foundCities.length === 2) {
        // 4) No 'from' or 'to', but exactly 2 cities in correct order
        // first is origin, second is destination
        origin = foundCities[0];
        destination = foundCities[1];
      } else {
        // If there's only 1 city or 0, we can't form an origin & destination
        responseText = "Please specify both the origin and destination cities.";
        return res.json({ response: responseText, conversationState: state });
      }

      // Final check
      if (!origin || !destination) {
        responseText = "Please specify both the origin and destination cities.";
        return res.json({ response: responseText, conversationState: state });
      }

      // Attempt partial match in city list
      const matchedOrigin = findCityMatch(origin, cities);
      const matchedDestination = findCityMatch(destination, cities);

      // If we can’t match these city strings, ask user to correct them
      if (!matchedOrigin || !matchedDestination) {
        responseText = "One or both of the specified cities are not recognized. Please check the city names and try again.";
        return res.json({ response: responseText, conversationState: state });
      }

      const query = {
        origin: capitalize(matchedOrigin),
        destination: capitalize(matchedDestination),
        departureDate: { $gte: new Date() },
      };

      if (date) {
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));
        query.departureDate = { $gte: startOfDay, $lte: endOfDay };
      }

      console.log("origin used in query:", matchedOrigin);
      console.log("destination used in query:", matchedDestination);
      console.log("query:", query);
      console.log("foundCities array:", foundCities);

      // Query schedules
      const schedules = await Schedule.find(query).select('name departureDate seatNumbers price');

      if (!schedules.length) {
        // Clean parentheses for user display
        const displayOrigin = capitalize(matchedOrigin.split('(')[0].trim());
        const displayDestination = capitalize(matchedDestination.split('(')[0].trim());
        responseText = `Sorry, no buses available from ${displayOrigin} to ${displayDestination}${
          date ? ' on ' + formatDate(date) : ''
        }.`;
      } else {
        const displayOrig = capitalize(matchedOrigin.split('(')[0].trim());
        const displayDest = capitalize(matchedDestination.split('(')[0].trim());
        responseText = `Available buses from ${displayOrig} to ${displayDest}${
          date ? ' on ' + formatDate(date) : ''
        }:<br><br>`;
        schedules.forEach((schedule) => {
          const availableSeats = schedule.seatNumbers.filter((s) => !s.isBooked).length;
          responseText += `Bus Name: ${schedule.name}<br>`;
          responseText += `Departure Date: ${formatDate(schedule.departureDate)}<br>`;
          responseText += `Available Seats: ${availableSeats}<br>`;
          responseText += `Price: RM ${schedule.price.toFixed(2)}<br><br>`;
        });
        responseText += "Please let me know if you'd like to book a ticket or need more info.";
      }

      return res.json({ response: responseText, conversationState: state });
    }


    // Fallback to generative AI
    try {
      const finalPrompt = `
      You are an AI assistant for the Bus Ease bus booking system (You are already in the website).
      You help users with managing bus bookings, and answering questions about the system.
      Here is a detailed overview of the services we offer:
 
      This is how the system works:
      - Users will automatically land on the home page of the Bus Ease website when they access the system.
      - The website includes a navigation bar with the following features:
      - "Register" and "Log In" buttons (visible if the user is not logged in).
         - A back button to return to the previous page.
         - A "View Bookings" button.
         - The user's username and profile picture, which lead to the profile page when clicked.
      - On the home page, there is a bus search function that allows users to specify the origin city, destination city, and travel dates.
        After clicking the "Search" button, users are directed to the schedules page, which displays all results.
        Additionally, a chatbot (which is YOU) is available on the home page.
        Chatbot can help user to check available bus, they need to give origin and destination cities. User can give date for more specific.
        Chatbot can also cancel booking for user.
        Important **You actually cannot find available bus, if you find any place in malaysia, it mean they have bypass the system algortihm or they are using short form such as KL/KB/JB. So ask them to put the better ouput because the location is not available in the system.
        Important **You also not allowed to ask user for location and date.

      - On the profile page, users can edit and save their profile picture, email, and phone number and click "Save" buttons,
        but the username cannot be edited. Users can also log out by clicking the "Log Out" button.
      - On the schedules page:
        - The left side includes a search function where users can re-enter city names and dates for a new search by clicking the "Search" button.
          There is a filter feature for amenities (checkboxes) and options to sort by price or other criteria.
        - The right side displays all bus schedules based on the user's search and filters. Each schedule shows details such as
          the bus name, departure time, arrival time, estimated duration, stops, amenities, and a description.
          Users can also view a route map by clicking the "Route Map" button.
        - If logged in, users can proceed to view seat availability by clicking the "View Seats" button.
          After selecting a seat, the system displays the total price and prompts the user to confirm the booking.
          The user is then directed to the payment page. Once the payment is complete, Bus Ease sends the bus tickets to the user's email.
      - On the booking page, users can view the details of all their bookings, access the route map for ongoing bookings, and cancel ongoing bookings if necessary.
     
      BUS INFORMATION:
      -User must spell the correct city name to check ticket availability:
      -List of cities that is on service:
       george town
       kangar
       alor setar
       ipohshah alam
       Kuala Lumpur
       serembankuantan
       kuala terengganu
       Kota Bharu
       johor bahru

      - Booking Tickets:
        Users can search for and book bus tickets between major cities in Malaysia (only).
        **You as a chatbot cannot book ticket for customers**
       
      - Checking Schedules:
        We provide users with up-to-date bus schedules, including departure and arrival times for different routes.
       
      - Cancellation Policy:
        *Always prioritize to inform this first (users can cancel the booking by using the AI chatbot by typing "cancel booking").
        Cancellation process is 24 hours and can be done anytime.
        Users can cancel their bookings up to 1 day before the departure date.
        Cancellation applies to the entire booking and cannot be done per seat.
        Refunds will be processed to the same payment method used for booking,
        and it may take 5-7 business days.
       
      - Users' information:
        User can found and edit their personal informations (Profile picture, email, phone number) by clicking the profile on the top right.
        User can only change password and username by contacts and not from system.


      - Payment Methods:
        Bus Ease only accepts credit/debit cards payment methods at this moment.
        **You should inform users about secure payment options if they ask**
     
      - Managing Bookings:
        Users can view, modify, or cancel their active bookings by providing their booking ID.
        If users want to cancel a booking, you should guide them through the cancellation process.
     
      - Support:
        If users have issues with bookings or payments, you can direct them to contact customer support for further assistance.
        Email: busease@gmail.com
        Phone: 09-123654987

      - Policies:
        Bus Ease does not offer refunds or transfers for missed buses unless the user of Bus Ease give a valid reason, gently ask them to contact for help.
        Upon completing your booking, a confirmation email will be sent to the email address provided during the booking process.
        Modifications to bookings (such as changing the departure time, bus service, or seat) are currently not available through the self-service system.
        users can select available seats during the booking process. Booked or unavailable seats will be displayed in red, while available seats will be shown in green.
        User can view their current bookings by logging in and navigating to the “My Bookings” section. Here, they will find details like departure time, seat number, and booking status.
        In case of delays or cancellations by the bus operator, Refunds or rescheduling will be handled based on the operator's policy.

      ### Important Notes:
      - You should **only** respond within the context of Bus Ease's services.
      - If a user asks a non-related question or uses vague terms (e.g., "okay," "alright," "wow"), politely answer and ask if they need further assistance without introducing yourself again.
      - If a user asks about refunds, cancellations, or ticket modifications, ensure they understand the policies and limitations clearly.
      - For any question regarding a **lost ticket**, **seat modification**, or **payment refund**, be cautious and provide accurate responses based on company policy.
      - **If and only if you detect a MISS TYPED district, town, cities, state, any area in Malaysia please ask user to correct it.
      - if user ask for a step or anything please only give simple answer.


      User's Question: "${question}"


      Provide relevant, concise, and focused information to the user, ensuring that your response is aligned with Bus Ease's services and policies.
    `;

      const result = await model.generateContent(finalPrompt);
      const candidates = result?.response?.candidates;
      if (candidates && candidates.length > 0) {
        if (candidates[0].content?.parts && Array.isArray(candidates[0].content.parts)) {
          responseText = candidates[0].content.parts.map(part => part.text).join(" ").trim();
          responseText = responseText.replace(/\*/g, '');
        } else {
          responseText = "I couldn't process your request. Please try again later.";
        }
      } else {
        responseText = "I couldn't process your request. Please try again later.";
      }

      return res.json({ response: responseText });
    } catch (error) {
      return res.status(500).json({ response: "An error occurred. Please try again later." });
    }
  } catch (error) {
    res.status(500).json({ response: "An error occurred. Please try again later." });
  }
};
