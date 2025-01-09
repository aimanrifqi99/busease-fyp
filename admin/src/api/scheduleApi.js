// scheduleApi.js
import axios from 'axios';

const scheduleApiClient = axios.create({
    baseURL: 'http://localhost:5000/api/schedules',
    withCredentials: true, // Keeps cookies, but JWT from localStorage must still be added
});

// Add a request interceptor to include the Authorization header with the JWT
scheduleApiClient.interceptors.request.use(
    (config) => {
        const token = JSON.parse(localStorage.getItem('user'))?.token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const getSchedules = () => scheduleApiClient.get('/');
export const getSchedule = (id) => scheduleApiClient.get(`/${id}`);
export const createSchedule = (data) => scheduleApiClient.post('/', data);
export const updateSchedule = (id, data) => scheduleApiClient.put(`/${id}`, data);
export const deleteSchedule = (id) => scheduleApiClient.delete(`/${id}`);

export default scheduleApiClient;
