import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './success.css';

const API_URL = process.env.REACT_APP_API_URL;

const Success = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const bookingProcessedRef = useRef(false);

  useEffect(() => {
    const bookingData = JSON.parse(localStorage.getItem('bookingData'));

    if (bookingData && !bookingProcessedRef.current) {
      bookingProcessedRef.current = true;
      const { scheduleId, seatNumbers, userId } = bookingData;

      const finalizeBooking = async () => {
        try {
          // Retrieve the token from localStorage
          const token = JSON.parse(localStorage.getItem('user'))?.token;

          const response = await axios.post(
            `${API_URL}/api/schedules/book-seats`,
            { scheduleId, seatNumbers, userId },
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            }
          );

          localStorage.removeItem('bookingData');

          if (response.data.success) {
            setLoading(false);
            alert('Booking successful! Your ticket has been sent to your email.');
            navigate(-4);
          } else {
            setError('Booking could not be completed.');
          }
        } catch (err) {
          console.error('Error finalizing booking:', err);
          setError('Error finalizing the booking. Please try again.');
        }
      };

      finalizeBooking();
    } else {
      setError('Booking data not found.');
    }
  }, [navigate]);

  if (loading) {
    return (
      <div className="success-container">
        <div className="loading-message">Processing your booking... Please wait, your ticket is on its way to your email.</div>
      </div>
    );
  }

  return (
    <div className="success-container">
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default Success;
