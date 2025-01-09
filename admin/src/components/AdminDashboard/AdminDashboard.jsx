import React, { useState } from 'react';
import UserManagement from '../UserManagement/UserManagement.jsx';
import ScheduleManagement from '../ScheduleManagement/ScheduleManagement.jsx';
import BookingManagement from '../BookingManagement/BookingManagement.jsx';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('user');

    return (
        <div className="admin-dashboard">
            <h2 className="dashboard-title">Admin Dashboard</h2>
            <div className="tabs">
                <button 
                    className={`tab ${activeTab === 'user' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('user')}
                >
                    User Management
                </button>
                <button 
                    className={`tab ${activeTab === 'schedule' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('schedule')}
                >
                    Schedule Management
                </button>
                <button 
                    className={`tab ${activeTab === 'booking' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('booking')}
                >
                    Booking Management
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'user' && <UserManagement />}
                {activeTab === 'schedule' && <ScheduleManagement />}
                {activeTab === 'booking' && <BookingManagement />}
            </div>
        </div>
    );
};

export default AdminDashboard;
