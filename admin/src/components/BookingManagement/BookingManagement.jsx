// src/pages/booking/BookingManagement.jsx
import React, { useEffect, useState } from 'react';
import { getAllBookings, cancelBooking, deleteBooking } from '../../api/bookingApi';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './BookingManagement.css';

const BookingManagement = () => {
    const navigate = useNavigate(); // Initialize useNavigate hook
    const [bookings, setBookings] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        getAllBookings()
            .then(({ data }) => setBookings(data))
            .catch(err => {
                console.error("Error fetching bookings:", err);
                setError('Failed to fetch bookings.');
            });
    }, []);

    const handleCancel = (bookingId) => {
        cancelBooking(bookingId)
            .then(({ data }) => {
                setBookings(bookings.map(booking =>
                    booking._id === bookingId ? { ...booking, status: 'cancelled' } : booking
                ));
                alert(data.message);
            })
            .catch(error => {
                console.error("Error cancelling booking:", error);
                alert("Error cancelling booking. Please try again.");
            });
    };

    const handleDelete = (bookingId) => {
        if (window.confirm("Are you sure you want to delete this booking?")) {
            deleteBooking(bookingId)
                .then(() => {
                    setBookings(bookings.filter(booking => booking._id !== bookingId));
                    alert("Booking deleted successfully.");
                })
                .catch(error => {
                    console.error("Error deleting booking:", error);
                    alert("Error deleting booking. Please try again.");
                });
        }
    };

    const handleView = (bookingId) => {
        navigate(`/booking/${bookingId}`); // Navigate to BookingDetail page
    };

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="bookingManagement">
            <h2>Booking Management</h2>
            <table className="managementTable">
                <thead>
                    <tr>
                        <th>Booking ID</th>
                        <th>Status</th>
                        <th>Schedule</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {bookings.map(booking => (
                        <tr key={booking._id}>
                            <td>{booking._id}</td>
                            <td>{booking.status}</td>
                            <td>
                                {booking.schedule ? (
                                    `${booking.schedule.name} (${booking.schedule.origin} - ${booking.schedule.destination})`
                                ) : (
                                    'Schedule data not available'
                                )}
                            </td>
                            <td>
                                <button onClick={() => handleView(booking._id)} className="viewButton">
                                    View
                                </button>
                                <button
                                    disabled={booking.status === 'cancelled' || booking.status === 'completed'}
                                    onClick={() => handleCancel(booking._id)}
                                    className="cancelButton"
                                >
                                    Cancel
                                </button>
                                <button onClick={() => handleDelete(booking._id)} className="deleteButton">
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default BookingManagement;
