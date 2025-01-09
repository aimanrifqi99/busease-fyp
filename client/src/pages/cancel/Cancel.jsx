import React from 'react';
import { useNavigate } from 'react-router-dom';
import './cancel.css'; 

const Cancel = () => {
  const navigate = useNavigate();

  const handleRetry = () => {
    // Navigate back to the schedules or booking page so the user can try again
    navigate('/schedules');
  };

  return (
    <div className="cancel-container">
      <h1>Payment Cancelled</h1>
      <p>Your payment was not completed. If you wish to try again, click the button below.</p>
      <button onClick={handleRetry}>Retry Booking</button>
      <button onClick={() => navigate('/')}>Back to Home</button>
    </div>
  );
};

export default Cancel;
