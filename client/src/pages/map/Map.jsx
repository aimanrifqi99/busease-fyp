// src/components/map/Map.jsx

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Loader } from '@googlemaps/js-api-loader';
import Navbar from '../../components/navbar/Navbar';

const Map = () => {
  const { id } = useParams();
  const [schedule, setSchedule] = useState(null);
  const [error, setError] = useState(null);

  const mapRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const userMarkerRef = useRef(null);

  // Fetch schedule data
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/schedules/distance-matrix/${id}`
        );
        if (!response.ok) {
          throw new Error(`Error fetching schedule: ${response.statusText}`);
        }
        const data = await response.json();
        setSchedule(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    };
    fetchSchedule();
  }, [id]);

  // Initialize / update the map
  useEffect(() => {
    if (!schedule) return;

    const loader = new Loader({
      apiKey: process.env.REACT_APP_GOOGLE_MAP,
      version: 'weekly',
      libraries: ['places'],
    });

    loader
      .load()
      .then(() => {
        let map = mapRef.current;
        if (!map) {
          map = new window.google.maps.Map(document.getElementById('map'), {
            center: { lat: 0, lng: 0 },
            zoom: 7,
            streetViewControl: false,
          });
          mapRef.current = map;
        }

        if (!directionsRendererRef.current) {
          directionsRendererRef.current = new window.google.maps.DirectionsRenderer();
          directionsRendererRef.current.setMap(map);
        }

        const waypoints = schedule.stops.map((stop) => ({
          location: stop.stopName,
          stopover: true,
        }));

        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
          {
            origin: schedule.origin,
            destination: schedule.destination,
            waypoints: waypoints,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
              directionsRendererRef.current.setDirections(result);
              if (result.routes[0].bounds) {
                map.fitBounds(result.routes[0].bounds);
              }
            } else {
              console.error('Directions request failed due to ' + status);
              setError('Unable to display directions: ' + status);
            }
          }
        );
      })
      .catch((e) => {
        console.error('Error loading Google Maps API', e);
        setError('Error loading Google Maps API');
      });
  }, [schedule]);

  // Handler for "My location"
  const handleMyLocation = () => {
    if (!mapRef.current) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          if (!userMarkerRef.current) {
            userMarkerRef.current = new window.google.maps.Marker({
              position: pos,
              map: mapRef.current,
            });
          } else {
            userMarkerRef.current.setPosition(pos);
          }
          mapRef.current.setCenter(pos);
          mapRef.current.setZoom(14);
        },
        () => {
          setError('Unable to retrieve your location. Permission denied or error occurred.');
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div>
      <Navbar />
      {error && <p className="error-message">{error}</p>}
      <div
        id="map"
        style={{
          width: '100vw',
          height: 'calc(100vh - 60px)',
          marginTop: '60px',
        }}
      ></div>

      {/* Only render the schedule info and button if we have the data */}
      {schedule && (
        <div
          style={{
            position: 'absolute',
            top: '70px',
            right: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '10px',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            width: '250px',
            zIndex: 1000,
            overflowY: 'auto',
          }}
        >
          {/* Display schedule details */}
          <p>
            <strong>Origin:</strong> {schedule.origin}
          </p>
          <p>
            <strong>Destination:</strong> {schedule.destination}
          </p>
          <p>
            <strong>Departure Time:</strong> {schedule.departureTime}
          </p>
          <p>
            <strong>Arrival Time:</strong> {schedule.arrivalTime}
          </p>
          <p>
            <strong>Duration:</strong> {schedule.duration}
          </p>
          {schedule.stops && schedule.stops.length > 0 && (
            <div>
              <p>
                <strong>Stops:</strong>
              </p>
              <ul style={{ paddingLeft: '15px' }}>
                {schedule.stops.map((stop, index) => (
                  <li key={index}>
                    {stop.stopName} at {stop.arrivalTime}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* My location button below the schedule details */}
          <button
            onClick={handleMyLocation}
            style={{
              display: 'block',
              width: '40%',
              marginTop: '10px',
              backgroundColor: '#007bff',
              color: '#fff',
              padding: '10px 10px',
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
      )}
    </div>
  );
};

export default Map;