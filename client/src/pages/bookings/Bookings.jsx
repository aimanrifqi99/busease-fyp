import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/navbar/Navbar";
import { AuthContext } from "../../context/AuthContext";
import "./bookings.css";

const API_URL = process.env.REACT_APP_API_URL;

const UserBookings = () => {
  const [bookings, setBookings] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = user?.token;
  
        if (!token) {
          console.error("No token found in user context");
          return;
        }
  
        const res = await axios.get(
        `${API_URL}/api/bookings/${user._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setBookings(res.data);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    };
  
    fetchBookings();
  }, [user?._id, user?.token]);  

  const handleCancelBooking = async (bookingId) => {
    const confirmCancel = window.confirm("Are you sure you want to cancel this booking?");
    if (!confirmCancel) return;

    try {
      const token = user?.token;

      const res = await axios.post(
        `${API_URL}/api/bookings/cancel-booking`,
        { bookingId, userId: user._id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(res.data.message);

      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking._id === bookingId ? { ...booking, status: "cancelled" } : booking
        )
      );
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert(error.response?.data?.message || "Error cancelling booking");
    }
  };

  return (
    <div>
      <Navbar />
      <div className="userBookings">
        <h2>Your Bookings</h2>
        {bookings.length === 0 ? (
          <p className="noBookings">No bookings found.</p>
        ) : (
          bookings.map((booking) => {
            const { departureDate, departureTime } = booking.schedule;
            const seatNumbers = booking.seatNumbers.length > 0 ? booking.seatNumbers.join(", ") : "N/A";
            return (
              <div
                className={`bookingItem ${
                  booking.status === "cancelled" ? "cancelled" :
                  booking.status === "completed" ? "completed" : "ongoing"
                }`}
                key={booking._id}
              >
                <div className="bookingTop">
                  <div
                    className={`bookingStatus ${
                      booking.status === "cancelled" ? "status-cancelled" :
                      booking.status === "completed" ? "status-completed" : "status-ongoing"
                    }`}
                  >
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </div>
                </div>
            
                <div className="bookingDetails">
                  <h2 className="bookingTitle">Booking for {booking.schedule.name}</h2>
                  <h3 className="bookingRoute">
                    {booking.schedule.origin} <span className="arrow">→</span> {booking.schedule.destination}
                  </h3>
            
                  <p className="bookingDetail">
                    <strong>Booking ID:</strong> {booking._id}
                  </p>
                  <p className="bookingDetail">
                    <strong>Seats:</strong> {seatNumbers}
                  </p>
                  <p className="bookingDetail">
                    <strong>Total Price:</strong> RM{booking.totalPrice}
                  </p>
                  <p className="bookingDetail">
                    <strong>Departure Date:</strong> {new Date(departureDate).toLocaleDateString()}
                  </p>
                  <p className="bookingDetail">
                    <strong>Departure Time:</strong> {departureTime}
                  </p>
            
                  <div className="bookingDate">
                    <strong>Booking Date:</strong>{" "}
                    {new Date(booking.bookingDate).toLocaleDateString()}{" "}
                    {new Date(booking.bookingDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
            
                {booking.status === "ongoing" && (
                  <div className="mapContainer">
                    <div className="viewRouteLabel">View Route</div>
                    <Link to={`/map/${booking.schedule._id}`} className="mapButton" aria-label="View Map" />
                  </div>
                )}
            
                {booking.status === "ongoing" && (
                  <button className="cancelButton" onClick={() => handleCancelBooking(booking._id)}>
                    Cancel Booking
                  </button>
                )}
              </div>
            );            
          })
        )}
      </div>
    </div>
  );
};

export default UserBookings;
