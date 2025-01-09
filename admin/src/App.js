// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import Login from './components/Login/Login';
import ProtectedRoute from './routes/ProtectedRoute';
import UserDetail from './components/UserDetail/UserDetail';
import ScheduleDetail from './components/ScheduleDetail/ScheduleDetail';
import BookingDetail from './components/BookingDetail/BookingDetail';

const App = () => (
    <Router>
        <AuthProvider>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />  
                <Route path="/login" element={<Login />} />
                <Route path="/user/:id" element={<UserDetail />} />
                <Route path="/schedule/:id" element={<ScheduleDetail />} />
                <Route path="/booking/:id" element={<BookingDetail />} />
                <Route 
                    path="/admin" 
                    element={
                        <ProtectedRoute>
                            <AdminDashboard />
                        </ProtectedRoute>
                    } 
                />
            </Routes>
        </AuthProvider>
    </Router>
);

export default App;
