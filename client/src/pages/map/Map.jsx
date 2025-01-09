//src/components/map/Map.jsx

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Loader } from '@googlemaps/js-api-loader'; //Used to dynamically load the Google Maps JavaScript API
import Navbar from '../../components/navbar/Navbar';

const Map = () => {
  const { id } = useParams(); //Extract the schedule ID from the URL parameters
  const [schedule, setSchedule] = useState(null); //State to store schedule data
  const [error, setError] = useState(null); //State to store errors

  //These refs store the Google Map and the custom marker for the user's location
  const mapRef = useRef(null); 
  const directionsRendererRef = useRef(null);
  const userMarkerRef = useRef(null);

  //Fetch schedule data from the backend
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/schedules/distance-matrix/${id}`); //Backend API call
        if (!response.ok) {
          throw new Error(`Error fetching schedule: ${response.statusText}`);
        }
        const data = await response.json(); //Parse the response JSON
        setSchedule(data); //Update schedule state
      } catch (err) {
        console.error(err);
        setError(err.message); //Handle errors
      }
    };
    fetchSchedule(); //Call the fetch function when the component mounts
  }, [id]);

  //Initialize or update the map
  useEffect(() => {
    if (!schedule) return; //Do nothing if schedule data is not yet available

    //Load the Google Maps JavaScript API
    const loader = new Loader({
      apiKey: process.env.REACT_APP_GOOGLE_MAP, //Google Maps API Key
      version: "weekly",
      libraries: ["places"], //Load additional libraries like "places"
    });

    loader.load().then(() => {
      //Initialize the map using Google Maps JavaScript API
      let map = mapRef.current;
      if (!map) {
        map = new window.google.maps.Map(document.getElementById('map'), { //Google Maps JavaScript API
          center: { lat: 0, lng: 0 }, //Default center
          zoom: 7, //Initial zoom level
          streetViewControl: false, //Disable Street View controls
        });
        mapRef.current = map; //Save the map instance in ref
      }

      //Initialize the DirectionsRenderer (Google Maps Directions API)
      if (!directionsRendererRef.current) {
        directionsRendererRef.current = new window.google.maps.DirectionsRenderer();
        directionsRendererRef.current.setMap(map); //Attach renderer to the map
      }

      //Set up waypoints for the route (Google Maps Directions API)
      const waypoints = schedule.stops.map((stop) => ({
        location: stop.stopName, //Stop name as location
        stopover: true, //Specify it as a stopover
      }));

      //Calculate and render the route using DirectionsService (Google Maps Directions API)
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: schedule.origin, //Start location
          destination: schedule.destination, //End location
          waypoints: waypoints, //Add waypoints
          travelMode: window.google.maps.TravelMode.DRIVING, //Travel mode: Driving
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            directionsRendererRef.current.setDirections(result); //Display the route
            if (result.routes[0].bounds) {
              map.fitBounds(result.routes[0].bounds); //Adjust map to fit the route
            }
          } else {
            console.error('Directions request failed due to ' + status); //Handle Directions API errors
            setError('Unable to display directions: ' + status); //Update error state
          }
        }
      );
    }).catch(e => {
      console.error('Error loading Google Maps API', e); //Handle API loading errors
      setError('Error loading Google Maps API'); //Update error state
    });
  }, [schedule]); //Re-run this effect whenever schedule changes

  //Handler for clicking the "My location" button
  const handleMyLocation = () => {
    //Ensure the map is already initialized
    if (!mapRef.current) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          //If we don't already have a user marker, create one; otherwise, update position
          if (!userMarkerRef.current) {
            userMarkerRef.current = new window.google.maps.Marker({
              position: pos,
              map: mapRef.current,
            });
          } else {
            userMarkerRef.current.setPosition(pos);
          }
          //Center and zoom in on the user’s location
          mapRef.current.setCenter(pos);
          mapRef.current.setZoom(14);
        },
        () => {
          setError("Unable to retrieve your location. Permission denied or error occurred.");
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div>
      <Navbar /> {/*Display the navigation bar*/}
      {error && <p className="error-message">{error}</p>} {/*Display error messages*/}
      <div
        id="map"
        style={{
          width: '100vw', //Full viewport width
          height: 'calc(100vh - 60px)', //Height minus navbar height
          marginTop: '60px', //Space for navbar
        }}
      >
        {/*Map content*/}
      </div>

      {/*Display schedule details (if available)*/}
      {schedule && (
        <div
          style={{
            position: 'absolute', //Overlay the schedule details on the map
            top: '70px', //Below the navbar
            right: '10px', //Positioned at the right
            backgroundColor: 'rgba(255, 255, 255, 0.9)', //Semi-transparent background
            padding: '10px',
            borderRadius: '8px', //Rounded corners
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', //Box shadow for depth
            maxWidth: '250px',
            zIndex: 1000, //Ensure it appears above the map
            overflowY: 'auto', //Scroll if content overflows
          }}
        >
          {/*Display schedule details*/}
          <p><strong>Origin:</strong> {schedule.origin}</p>
          <p><strong>Destination:</strong> {schedule.destination}</p>
          <p><strong>Departure Time:</strong> {schedule.departureTime}</p>
          <p><strong>Arrival Time:</strong> {schedule.arrivalTime}</p>
          <p><strong>Duration:</strong> {schedule.duration}</p>
          {schedule.stops && schedule.stops.length > 0 && (
            <div>
              <p><strong>Stops:</strong></p>
              <ul style={{ paddingLeft: '15px' }}>
                {schedule.stops.map((stop, index) => (
                  <li key={index}>{stop.stopName} at {stop.arrivalTime}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/*Single "My location" button below the schedule details*/}
      <button
        onClick={handleMyLocation}
        style={{
          position: 'absolute',
          bottom: '620px',
          right: '300px',
          zIndex: 1000,
          backgroundColor: '#007bff', //A simple blue color
          color: '#fff', //White text
          padding: '10px 15px',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '14px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        }}
      >
        My location
      </button>
    </div>
  );
};

export default Map;
