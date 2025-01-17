// src/pages/booking/BookingDetail.jsx
import React, { useEffect, useState } from 'react';
import { getBooking, updateBooking } from '../../api/bookingApi';
import { useParams, useNavigate } from 'react-router-dom';
import './BookingDetail.css';

const BookingDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [formData, setFormData] = useState({
        user: '',
        schedule: '',
        seatNumbers: [],
        totalPrice: '',
        bookingDate: '',
        status: 'ongoing'
    });

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const { data } = await getBooking(id);
                setFormData({
                    user: data.user ? data.user._id : '', 
                    username: data.user ? data.user.username : '',
                    schedule: data.schedule ? data.schedule._id : '',
                    seatNumbers: data.seatNumbers || [],
                    totalPrice: data.totalPrice || '',
                    bookingDate: data.bookingDate ? new Date(data.bookingDate).toISOString().split('T')[0] : '',
                    status: data.status || 'ongoing'
                });
            } catch (err) {
                setError('Failed to fetch booking details');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchBooking();
    }, [id]);
    

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage('');
    
        const updatedData = {
            ...formData,
            totalPrice: parseFloat(formData.totalPrice),
            seatNumbers: formData.seatNumbers.map(Number) // Ensure seatNumbers are numbers
        };
    
        try {
            await updateBooking(id, updatedData);
            setSuccessMessage('Booking updated successfully');
            setTimeout(() => setSuccessMessage(''), 3000); // Clear message after 3 seconds
        } catch (err) {
            setError('Failed to update booking');
            console.error(err);
        }        
    };    

    const handleCancel = () => {
        navigate(-1); // Navigate back to the previous page
    };

    if (loading) return <div className="bookingDetail"><p>Loading booking details...</p></div>;
    if (error) return <div className="bookingDetail"><p className="errorMessage">{error}</p></div>;

    return (
        <div className="bookingDetail">
            <h2>Booking Details</h2>
            <form onSubmit={handleSubmit}>

                {/* User Information */}
                <label htmlFor="user">
                    <strong>User:</strong>
                    <input
                        type="text"
                        id="user"
                        name="user"
                        value={formData.user}
                        onChange={handleChange}
                        disabled // Assuming user cannot be changed
                    />
                </label>
                <label htmlFor="user">
                    <strong>Username:</strong>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        disabled // Assuming user cannot be changed
                    />
                </label>

                {/* Schedule Information */}
                <label htmlFor="schedule">
                    <strong>Schedule:</strong>
                    <input
                        type="text"
                        id="schedule"
                        name="schedule"
                        value={formData.schedule}
                        onChange={handleChange}
                        disabled // Assuming schedule cannot be changed
                    />
                </label>

                {/* Seat Numbers */}
                <label htmlFor="seatNumbers">
                    <strong>Seat Numbers:</strong>
                    <input
                        type="text"
                        id="seatNumbers"
                        name="seatNumbers"
                        value={formData.seatNumbers.join(', ')}
                        onChange={(e) => setFormData({
                            ...formData,
                            seatNumbers: e.target.value.split(',').map(num => num.trim())
                        })}
                        required
                        placeholder="e.g., 1, 2, 3"
                    />
                </label>

                {/* Total Price */}
                <label htmlFor="totalPrice">
                    <strong>Total Price:</strong>
                    <input
                        type="number"
                        id="totalPrice"
                        name="totalPrice"
                        value={formData.totalPrice}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                    />
                </label>

                {/* Booking Date */}
                <label htmlFor="bookingDate">
                    <strong>Booking Date:</strong>
                    <input
                        type="date"
                        id="bookingDate"
                        name="bookingDate"
                        value={formData.bookingDate}
                        onChange={handleChange}
                        required
                        disabled // Assuming booking date cannot be changed
                    />
                </label>

                {/* Status */}
                <label htmlFor="status">
                    <strong>Status:</strong>
                    <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        required
                    >
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </label>

                {error && <div className="errorMessage">{error}</div>}
                {successMessage && <div className="successMessage">{successMessage}</div>}
                

                <div className="buttonGroup">
                    <button type="submit">Update Booking</button>
                    <button type="button" onClick={handleCancel} className="cancelButton">Back</button>
                </div>
            </form>
        </div>
    );
};

export default BookingDetail;
