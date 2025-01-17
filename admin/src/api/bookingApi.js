// bookingApi.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const bookingApiClient = axios.create({
    baseURL: `${API_URL}/api/bookings`,
    withCredentials: true, // Keeps cookies, but JWT from localStorage must still be added
});

// Add a request interceptor to include the Authorization header with the JWT
bookingApiClient.interceptors.request.use(
    (config) => {
        const token = JSON.parse(localStorage.getItem('user'))?.token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Fetch all bookings (admin)
export const getAllBookings = () => bookingApiClient.get('/');

// Fetch bookings for a specific user
export const getUserBookings = (userId) => bookingApiClient.get(`/${userId}`);

// Fetch a single booking by ID
export const getBooking = (bookingId) => bookingApiClient.get(`/booking/${bookingId}`);

// Cancel a booking
export const cancelBooking = (bookingId) => bookingApiClient.post('/cancel-booking', { bookingId });

// Update a booking
export const updateBooking = (bookingId, updateData) => bookingApiClient.put(`/${bookingId}`, updateData);

// Delete a booking
export const deleteBooking = (bookingId) => bookingApiClient.delete(`/${bookingId}`);

export default bookingApiClient;
