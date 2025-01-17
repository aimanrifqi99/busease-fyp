// src/pages/schedule/ScheduleManagement.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { getSchedules, deleteSchedule } from '../../api/scheduleApi';
import AddScheduleForm from '../AddScheduleForm/AddScheduleForm';
import './ScheduleManagement.css';

const ScheduleManagement = () => {
    const [schedules, setSchedules] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const navigate = useNavigate(); // Initialize useNavigate

    useEffect(() => {
        getSchedules().then(({ data }) => setSchedules(data));
    }, []);

    const handleAdd = () => {
        setShowAddForm(true);
    };

    const handleDelete = (id) => {
        deleteSchedule(id).then(() => setSchedules(schedules.filter(schedule => schedule._id !== id)));
    };

    const handleView = (id) => {
        navigate(`/schedule/${id}`);
    };

    return (
        <div className="scheduleManagement">
            <div className="header">
                <button className="addButton" onClick={handleAdd}>Add Schedule</button>
            </div>
            {showAddForm && (
                <AddScheduleForm
                    onClose={() => setShowAddForm(false)}
                    onAdd={(newSchedule) => setSchedules([...schedules, newSchedule])}
                />
            )}
            <table className="managementTable">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Origin</th>
                        <th>Destination</th>
                        <th>Departure Date</th>
                        <th>Departure Time</th>
                        <th>Arrival Time</th>
                        <th>Price</th>
                        <th>Total Seats</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {schedules.map(schedule => (
                        <tr key={schedule._id}>
                            <td>{schedule.name}</td>
                            <td>{schedule.origin}</td>
                            <td>{schedule.destination}</td>
                            <td>{new Date(schedule.departureDate).toLocaleDateString()}</td>
                            <td>{schedule.departureTime}</td>
                            <td>{schedule.arrivalTime}</td>
                            <td>RM{schedule.price}</td>
                            <td>{schedule.totalSeats}</td>
                            <td>
                                <button onClick={() => handleView(schedule._id)}>View</button>
                                <button onClick={() => handleDelete(schedule._id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ScheduleManagement;
