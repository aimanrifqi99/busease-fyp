import "./reserve.css";
import { faCircleXmark } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useFetch from "../../hooks/useFetch";
import { useContext, useState } from "react";
import axios from "axios";
import { AuthContext } from '../../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_51QAYjCJpEmLb8AB19f8Fuc0yWvWVplTBjltUdeP9jdmXEFcGBleoT3xJnCtOCaZtqPyr0B8sXPYf5cNML6UwWfbI00TmOd12Ua'); // Replace with your publishable key
const API_URL = process.env.REACT_APP_API_URL;

const Reserve = ({ setOpen, scheduleId }) => {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const { user } = useContext(AuthContext);
  const { data, loading, error } = useFetch(`/schedules/${scheduleId}`);

  const handleSelect = (seatNumber) => {
    // Toggle seat selection
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter((seat) => seat !== seatNumber));
    } else {
      setSelectedSeats([...selectedSeats, seatNumber]);
    }
  };

  const handleProceedToConfirmation = () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat.');
      return;
    }
    setIsConfirming(true);
  };

  const handleConfirmBooking = async () => {
    try {
      if (!user || !user._id) {
        console.error("User not authenticated");
        return;
      }

      const stripe = await stripePromise;

      const totalPrice = data?.price * selectedSeats.length;

      // Store booking data in localStorage
      localStorage.setItem('bookingData', JSON.stringify({
        scheduleId,
        seatNumbers: selectedSeats,
        userId: user._id,
      }));

      // Proceed to create Stripe Checkout session
      const response = await axios.post(
        `${API_URL}/api/stripe/create-checkout-session`,
        {
          scheduleId,
          seatNumbers: selectedSeats,
          totalPrice,
          email: user.email,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const { sessionId } = response.data;

      // Redirect to Stripe checkout
      const result = await stripe.redirectToCheckout({
        sessionId: sessionId,
      });

      if (result.error) {
        console.error(result.error.message);
        alert('Error redirecting to Stripe Checkout');
      }
    } catch (error) {
      console.error('Error during booking:', error);
      alert('Error during booking. Please try again.');
    }
  };

  const handleBackToSelection = () => {
    setIsConfirming(false);
  };

  // Calculate total price
  const totalPrice = data?.price * selectedSeats.length;

  return (
    <div className="reserve">
      <div className="rContainer">
        <FontAwesomeIcon
          icon={faCircleXmark}
          className="rClose"
          onClick={() => setOpen(false)}
        />
        {!isConfirming ? (
          <>
            <span>Select Seats</span>
            {loading ? (
              <span>Loading...</span>
            ) : error ? (
              <span>Error loading schedules</span>
            ) : (
              <div className="seatSelection">
              {data?.seatNumbers?.map((seat, index) => {
                // Create rows for every 2 seats, and add an empty div for the aisle after 2 seats
                const isLeftSide = (index % 4) < 2; // First two seats of each row (left side)
                const isRightSide = (index % 4) >= 2; // Next two seats of each row (right side)

                return (
                  <>
                    {isLeftSide && (
                      <div
                        key={seat.number}
                        className={`seat ${seat.isBooked ? 'booked' : selectedSeats.includes(seat.number) ? 'selected' : 'available'}`}
                        onClick={() => !seat.isBooked && handleSelect(seat.number)}
                      >
                        {seat.number}
                      </div>
                    )}

                    {index % 4 === 1 && <div className="aisle" key={`aisle-${index}`}></div>}

                    {isRightSide && (
                      <div
                        key={seat.number}
                        className={`seat ${seat.isBooked ? 'booked' : selectedSeats.includes(seat.number) ? 'selected' : 'available'}`}
                        onClick={() => !seat.isBooked && handleSelect(seat.number)}
                      >
                        {seat.number}
                      </div>
                    )}
                  </>
                );
              })}
            </div>

            )}
            <button
              onClick={handleProceedToConfirmation}
              className="rButton"
              disabled={selectedSeats.length === 0}
            >
              Proceed to Book
            </button>
          </>
        ) : (
          <>
            <h2>Confirm Booking</h2>
            <p>
              <strong>Seats Selected:</strong> {selectedSeats.join(', ')}
            </p>
            <p>
              <strong>Total Price:</strong> RM{totalPrice}
            </p>
            <button onClick={handleConfirmBooking} className="rButton">
              Confirm Booking
            </button>
            <button onClick={handleBackToSelection} className="rButton">
              Back
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Reserve;
