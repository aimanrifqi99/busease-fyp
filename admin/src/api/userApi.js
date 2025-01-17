// apiClient.js
import axios from 'axios';

const apiClient = axios.create({
    baseURL: `${API_URL}/api/bookings/api/users`,
    withCredentials: true, 
});

// Add a request interceptor to include the Authorization header with the JWT
apiClient.interceptors.request.use(
    (config) => {
        const token = JSON.parse(localStorage.getItem('user'))?.token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const getUsers = () => apiClient.get('/');
export const getUser = (id) => apiClient.get(`/${id}`);
export const updateUser = (id, data) => apiClient.put(`/${id}`, data);
export const deleteUser = (id) => apiClient.delete(`/${id}`);

export default apiClient;
