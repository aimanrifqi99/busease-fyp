// assistantController.js

import { GoogleGenerativeAI } from '@google/generative-ai';
import User from '../models/UserModel.js';
import Booking from '../models/BookingModel.js';
import Schedule from '../models/ScheduleModel.js';
import * as chrono from 'chrono-node';

// Helper functions

// Function to capitalize the first letter of each word
const capitalize = (str) => {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

// Function to format dates in a readable format
const formatDate = (date) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(date).toLocaleDateString(undefined, options);
};

// Function to extract the relevant entities (bus name, cities, date) from the question
const extractDetails = (text, cities) => {
  let busName = null;
  const foundCities = [];

  // 1) Partial-match approach for cities
  //    If the user typed "kuala lumpur", it matches any city whose
  //    base name (before parentheses) includes "kuala lumpur".
  const lowerText = text.toLowerCase();
  cities.forEach(city => {
    // Example city: "kuala lumpur (tbs)"
    // Get everything before "(" or the entire city if no parentheses
    const baseName = city.split('(')[0].trim().toLowerCase(); 
    // If user text contains the base name, we consider it a match
    if (lowerText.includes(baseName)) {
      foundCities.push(city.toLowerCase()); 
      // store the full city name (with parentheses) in lowercase
    }
  });

  // Remove duplicates, limit to 2
  const uniqueCities = [...new Set(foundCities)].slice(0, 2);

  // 2) Extract the date using chrono-node
  const parsedDate = chrono.parseDate(text);
  let date = parsedDate && !isNaN(parsedDate) ? parsedDate : null;

  // 3) Extract a potential bus name (after "bus" keyword if mentioned)
  const busNameMatch = text.match(
    /bus\s+([\w\s]+?)(?=\s+(from|to|on|at|departing|leaving|heading)|$)/i
  );
  if (busNameMatch && busNameMatch[1]) {
    busName = busNameMatch[1].trim();
  }

  return { foundCities: uniqueCities, date, busName };
};

// Function to handle the assistant logic
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

    // Normalize the question for easier processing
    const lowerCaseQuestion = question.toLowerCase();

    // Define a list of known cities for extraction
    const cities = [
      'seberang perai', 'bukit mertajam', 'balik pulau', 'batu ferringhi', 'gelugor', 'george town (Penang Sentral)',
      'tanjung bungah', 'teluk kumbar', 'bayan lepas', 'bayan baru', 'air itam', 
      'permatang pauh', 'permatang tinggi', 'nibong tebal', 'seberang jaya', 'bukit tambun', 
      'simpang empat', 'prai', 'tasek gelugor', 'jelutong', 'machang bubok',
    
      'kangar (Terminal Bas Kangar)', 'arau', 'kuala perlis', 'santan', 'padang besar', 'sungai batu pahat',
      'kaki bukit', 'beseri', 'kampung wai', 'kangar utara',
    
      'sungai petani', 'kulim', 'jitra', 'changlun', 'gurun', 'baling', 'pendang', 'yan',
      'pokok sena', 'langkawi', 'kuala kedah', 'guar chempedak',
      'alor setar (Terminal Shahab Perdana)', 'bukit kayu hitam', 'padang terap', 'kuala nerang', 'bedong', 
      'sik', 'tanjung dawai', 'kota sarang semut', 'bandar baru', 'kubang pasu', 
      'serdang', 'kampung titi batu', 'kampung kuala muda', 'tokai',
    
      'taiping', 'teluk intan', 'sitiawan', 'manjung', 'parit buntar', 'batu gajah',
      'tanjung malim', 'bagan serai', 'kampar', 'tapah', 'chenderiang', 'pusing', 'parit', 
      'pangkor', 'slim river', 'lenggong', 'kerian', 'beruas', 'changkat jering',
      'ipoh (Terminal Amanjaya)', 'lumut', 'pantai remis', 'bidor', 'malim nawar', 'tanjung rambutan', 
      'kampung gajah', 'sungai siput', 'trong', 'tambun', 'menglembu', 'gopeng', 'kuala kangsar', 
      'selama', 'ayer tawar', 'ayer hitam', 'pasir salak',
    
      'petaling jaya', 'subang jaya', 'ampang', 'rawang', 'kuala selangor', 'kajang',
      'bandar baru bangi', 'puchong', 'klang', 'gombak', 'banting', 'sabak bernam', 'putrajaya',
      'jenjarom', 'sepang', 'ampang jaya', 'damansara', 'cheras', 'hulu selangor', 'Kuala Lumpur (Tbs)', 
      'shah alam (Terminal 17)', 'seri kembangan', 'cyberjaya', 'sunway', 'damansara utama', 'setia alam', 
      'bandar kinrara', 'bandar tasik selatan', 'usj', 'bukit jelutong', 'denai alam', 
      'bandar puteri', 'tropicana', 'sungai buloh', 'balakong', 'batang kali', 'sungai pelek', 
      'bandar sunway', 'bukit tinggi', 'serendah', 'bukit beruntung', 'bandar baru selayang', 
      'puncak alam', 'taman melawati', 'seri serdang', 'taman tun dr ismail', 'bukit subang',
    
      'port dickson', 'nilai', 'rasah', 'bahau', 'kuala pilah', 'mantin', 'lukut',
      'rantau', 'seremban (Terminal One)', 'tampin', 'gemas', 'senawang', 'simpang durian', 
      'labu', 'linggi', 'paroi', 'pedas', 'remao', 'juasseh',
      'kota', 'sungai gadut', 'rombai', 'mantau', 'batang benar',
    
      'ayer keroh', 'bukit katil', 'masjid tanah', 'klebang', 'merlimau', 'sungai udang',
      'melaka tengah', 'alor gajah', 'jasin', 'kampung morten', 'padang tembak',
      'bemban', 'ayer molek', 'durian tunggal', 'cheng', 'tanjung kling', 'machap baru',
      'sungai rambai', 'selandar',
    
      'temerloh', 'bentong', 'raub', 'jerantut', 'genting highlands', 'chenor', 'kuala lipis',
      'rompin', 'jengka', 'muadzam shah', 'pekan', 'mentakab', 'maran', 'gambang', 'kuala krau',
      'beras jaya', 'keratong', 'dong', 'lanchang', 'triang', 'felda tanah rancangan',
      'cherating', 'benta', 'padang tengku', 'kuantan (Kuantan Sentral)',
    
      'dungun', 'kemaman', 'marang', 'besut', 'setiu', 'hulu terengganu', 'chukai', 
      'kuala berang', 'ajil', 'jerteh', 'kijal', 'manir', 'wakaf tapai', 'kuala terengganu (Terminal Bas Mbkt)',
      'kuala nerus', 'merang', 'kampung raja', 'seberang takir', 'penarik', 'bukit besi',
      'paka', 'rantau abang', 'kuala ibai', 'gong badak', 'batangan', 'teluk kalong', 
      
      'Kota Bharu (Terminal Bas Kota Bharu)', 'pasir mas', 'tumpat', 'machang', 'tanah merah', 'jelawat', 'pengkalan chepa',
      'wakaf bharu', 'bachok', 'kok lanas', 'ketereh', 'melor', 'pangkalan kubor', 'gual ipoh',
      'kuala krai', 'salor', 'kandis', 'kampung tok bali', 'jelawat', 'manek urai', 'pasir hor',
      'rantau panjang', 'pasir puteh', 'dabong', 'guchil', 'gunong', 'kemubu', 
      'ketereh', 'pangkal kalong', 'pulai chondong', 'temangan', 'tendong', 'bukit bator',
      'bukit marak', 'kok bator',
    
      'batu pahat', 'muar', 'kulaijaya', 'iskandar puteri', 'skudai', 'senai', 'tangkak',
      'ayer hitam', 'kluang', 'pontian', 'kota tinggi', 'mersing', 'yong peng', 'labis',
      'segamat', 'simpang renggam', 'kangkar pulai', 'parit raja', 'gelang patah',
      'benut', 'bukit gambir', 'chaah', 'endau', 'kangkar senangar', 'parit jawa',
      'parit sulong', 'pengerang', 'penggaram', 'sri gading', 'tanjung langsat',
      'tanjung sedili', 'felda nitar', 'sungai rengit', 'lukut', 'semborong', 'kota tinggi',
      'masai', 'kangkar tebrau', 'senibong', 'johor bahru (Jb Sentral)',
    ];
    

    // Helper function to partially match user input against city list
    const findCityMatch = (inputCity, cityList) => {
      const userCity = inputCity.trim().toLowerCase();
      return cityList.find((city) => {
        return city.toLowerCase().includes(userCity);
      });
    };

    // Extract details from the question
    const { foundCities, date, busName } = extractDetails(lowerCaseQuestion, cities);

    // Initialize conversation state if not provided
    let state = conversationState || {};

    // Handle cancellation confirmation
    if (state.confirmCancel) {
      if (lowerCaseQuestion.includes('yes')) {
        // User confirmed, ask for Booking ID
        responseText = "Please provide the Booking ID of the booking you wish to cancel<br>Reply \"no\" if you do not want cancel the bookings<br><br>Your Bookings:<br><br>";
        
        // Fetch user's ongoing bookings
        const userBookings = await Booking.find({ user: userId, status: 'ongoing' }).populate('schedule');
        if (!userBookings.length) {
          responseText = "You have no active bookings to cancel.";
          state.confirmCancel = false; // Reset state
          return res.json({ response: responseText, conversationState: state });
        }

        userBookings.forEach((booking) => {
          responseText += `Booking ID: ${booking._id}<br>`;
          responseText += `Bus Name: ${booking.schedule.name}<br>`;
          responseText += `Departure Date: ${formatDate(booking.schedule.departureDate)}<br><br>`;
        });

        // Update conversation state to await booking ID
        state.awaitingBookingId = true;
        state.confirmCancel = false;  // Reset confirmation state
        return res.json({ response: responseText, conversationState: state });
      }

      if (lowerCaseQuestion.includes('no')) {
        // User aborted the cancellation
        responseText = "Let me know if you need help with anything else!";
        state.confirmCancel = false; // Reset state
        return res.json({ response: responseText, conversationState: state });
      }

      // If user input is neither 'yes' nor 'no'
      responseText = "Please reply \"yes\" to confirm the cancellation or \"no\" to abort.";
      return res.json({ response: responseText, conversationState: state });
    }

    // Handle cancellation flow (after asking for Booking ID)
    if (state.awaitingBookingId) {

      if (lowerCaseQuestion.includes('no')) {
        responseText = "Let me know if you need help with anything else!";
        state.awaitingBookingId = false;
        return res.json({ response: responseText, conversationState: state });
      
      }else{
        
        const bookingId = question.trim();

        // Verify that the booking belongs to the user
        const bookingToCancel = await Booking.findOne({ _id: bookingId, user: userId, status: 'ongoing' }).populate('schedule');
        if (!bookingToCancel) {
          responseText = "Invalid Booking ID or you have no such booking. Please provide a valid Booking ID.";
          return res.json({ response: responseText, conversationState: state });
        }

        // Cancel the booking
        bookingToCancel.status = 'cancelled';
        await bookingToCancel.save();

        // Update seat availability
        const schedule = await Schedule.findById(bookingToCancel.schedule._id);
        bookingToCancel.seatNumbers.forEach((seatNumber) => {
          const seat = schedule.seatNumbers.find((seat) => seat.number === seatNumber);
          if (seat) seat.isBooked = false;
        });
        await schedule.save();

        responseText = `Your booking with ID ${bookingId} for ${schedule.name} on ${formatDate(
          schedule.departureDate
        )} has been cancelled.`;

        // Reset conversation state
        state.awaitingBookingId = false;

        return res.json({ response: responseText, conversationState: state });
      }
    }

    // Handle booking cancellation request and ask for confirmation
    if (
      /\b(cancel|void|stop|end|refund)\s+(my|a)?\s*(booking|bookings|ticket|tickets|reservation|reservations|bus|buses|bas)\b/.test(lowerCaseQuestion) &&
      (!state.awaitingBookingId && !lowerCaseQuestion.includes('seat') && !lowerCaseQuestion.includes('seats')) &&
      !/\b(how|should|contact|call)\b/.test(lowerCaseQuestion) 
    ) {
      if (!userId) {
        responseText = "Please log in to cancel your booking.";
        return res.json({ response: responseText });
      }
    
      // Ask for confirmation
      responseText = "Do you really want to cancel your booking? Please reply \"yes\" to confirm or \"no\" to abort.";
    
      // Update conversation state to confirm cancellation
      state.confirmCancel = true;
    
      return res.json({ response: responseText, conversationState: state });
    }

    // Check for booking inquiries (requires user ID)
    if (
      /\bmy\s+(booking|bookings|ticket|tickets|reservation|reservations|bus|buses)\b/.test(lowerCaseQuestion) &&
      !/\b(cancel|lost|refund|modify|sell|give)\b/.test(lowerCaseQuestion)
    ){
      if (!userId) {
        responseText = "Please log in to access your booking information.";
        return res.json({ response: responseText });
      }

      // Fetch user's bookings
      const userBookings = await Booking.find({ user: userId }).populate('schedule');
      if (!userBookings.length) {
        responseText = "You have no bookings.";
        return res.json({ response: responseText });
      }

      // Format booking details
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

    // Handle Bus Availability Queries
    if (
      ((lowerCaseQuestion.includes('bus') ||
        lowerCaseQuestion.includes('schedule') ||
        lowerCaseQuestion.includes('ticket')) &&
      foundCities.length >= 1) || foundCities.length >= 1
    ) {
      let origin = null;
      let destination = null;
    
      if (foundCities.length >= 2) {
        // Use regex to find 'from <city>' and 'to <city>' patterns
        // Use non-greedy regex patterns with lookahead to prevent over-capturing
        const fromMatch = lowerCaseQuestion.match(/from\s+([a-z\s]+?)(?=\s+(to|on|at|departing|leaving|heading)|$)/i);
        const toMatch = lowerCaseQuestion.match(/to\s+([a-z\s]+?)(?=\s+(from|on|at|departing|leaving|heading)|$)/i);

        if (fromMatch && toMatch) {
          // If both 'from' and 'to' are present, assign accordingly
          origin = fromMatch[1].trim();
          destination = toMatch[1].trim();
        } else if (fromMatch) {
          // Only 'from' is present
          origin = fromMatch[1].trim();
          destination = foundCities.find(city => city !== origin) || null; // Use the other city as destination
        } else if (toMatch) {
          // Only 'to' is present
          destination = toMatch[1].trim();
          origin = foundCities.find(city => city !== destination) || null; // Use the other city as origin
        } else {
          // No 'from' or 'to' present; assume the first city is origin and the second is destination
          [origin, destination] = foundCities.slice(0, 2);
        }

        // Handle cases where more than two cities are mentioned
        if (foundCities.length > 2) {
          responseText = "I detected multiple cities in your request. Please specify the origin and destination clearly using 'from' and 'to'.";
          return res.json({ response: responseText, conversationState: state });
        }
      } else if (foundCities.length === 1) {
        // Only one city is found, need to ask for the missing one
        if (lowerCaseQuestion.includes('from')) {
          origin = foundCities[0];
          responseText = "Please specify and check the destination city.";
          return res.json({ response: responseText, conversationState: state });
        } else if (lowerCaseQuestion.includes('to')) {
          destination = foundCities[0];
          responseText = "Please specify and check the origin city.";
          return res.json({ response: responseText, conversationState: state });
        } else {
          // No clear 'from' or 'to', ask user to specify both
          responseText = "Please specify both the origin and destination cities.";
          return res.json({ response: responseText, conversationState: state });
        }
      }
    
      // Validate that both origin and destination are identified
      if (!origin || !destination) {
        responseText = "Please specify both the origin and destination cities.";
        return res.json({ response: responseText, conversationState: state });
      }
    
      // Convert origin and destination to lowercase for consistency
      origin = origin.toLowerCase();
      destination = destination.toLowerCase();

      console.log('User origin: ', origin);

      // Try partial match from your city list
      const matchedOrigin = findCityMatch(origin, cities);
      const matchedDestination = findCityMatch(destination, cities);

      if (!matchedOrigin || !matchedDestination) {
        responseText = "One or both of the specified cities are not recognized. Please check the city names and try again.";
        return res.json({ response: responseText, conversationState: state });
      }
          
      // If matched, overwrite origin/destination with the found full city name
      origin = matchedOrigin;    
      destination = matchedDestination;

      // Proceed with building your query
      // Build query based on extracted details
      let query = {
        origin: capitalize(origin),
        destination: capitalize(destination),
        departureDate: { $gte: new Date() }, // Only future dates
      };

      if (date) {
        // If a date is provided, search for schedules on that date
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));
        query.departureDate = { $gte: startOfDay, $lte: endOfDay };
      }

      // Query the database for schedules
      const schedules = await Schedule.find(query).select('name departureDate seatNumbers price');

      console.log("origin used in query:", origin);
      console.log("destination used in query:", destination);
      console.log("query:", query);
      console.log("query:", foundCities);

      if (!schedules.length) {
       // Remove parentheses and their content before capitalizing
      const formattedOrigin = capitalize(origin.replace(/\s*\(.*?\)\s*/g, ''));
      const formattedDestination = capitalize(destination.replace(/\s*\(.*?\)\s*/g, ''));

      responseText = `Sorry, there are no buses available from ${formattedOrigin} to ${formattedDestination}${
        date ? ' on ' + formatDate(date) : ''}.`;
      } else {
        // Format the schedules
        responseText = `Available buses from ${capitalize(origin)} to ${capitalize(destination)}${
          date ? ' on ' + formatDate(date) : ''
        }:<br><br>`;

        schedules.forEach((schedule) => {
          const availableSeats = schedule.seatNumbers.filter((seat) => !seat.isBooked).length;
          responseText += `Bus Name: ${schedule.name}<br>`;
          responseText += `Departure Date: ${formatDate(schedule.departureDate)}<br>`;
          responseText += `Available Seats: ${availableSeats}<br>`;
          responseText += `Price: RM ${schedule.price.toFixed(2)}<br><br>`;
        });

        responseText += `Please let me know if you'd like to book a ticket or need more information.`;
      }
      return res.json({ response: responseText });
    }


    try {
    
      // For all other inputs, use Gemini AI to generate a response within the assistant's job scope
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
      
      - Booking Tickets:
        Users can search for and book bus tickets between major cities in Malaysia (only).
        **You as a chatbot cannot book ticket for customers**
        
      - Checking Schedules:
        We provide users with up-to-date bus schedules, including departure and arrival times for different routes.
       
      - Cancellation Policy:
        Cancellation can be done by clicking "Cancel booking" in "View Bookings".
        Inform users that cancellation can be done by using the AI chatbot by typing "cancel booking".
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
      - There are separate algorithm to detect a place so If you find any place in malaysia ask them to put the better location because it is not available.
      - if user ask for a step or anything please only give simple answer.

      User's Question: "${question}"

      Provide relevant, concise, and focused information to the user, ensuring that your response is aligned with Bus Ease's services and policies.
    `;
    
      // Generate the response using the AI assistant
      const result = await model.generateContent(finalPrompt);
    
      // Check if candidates exist and examine the structure of the first candidate
      const candidates = result?.response?.candidates;
      if (candidates && candidates.length > 0) {
        
        // Extracting the response from parts array inside candidates[0].content
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