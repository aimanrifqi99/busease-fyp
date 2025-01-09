// ScheduleDetail.js
import React, { useEffect, useState } from 'react';
import { getSchedule, updateSchedule } from '../../api/scheduleApi';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DriveFolderUploadOutlinedIcon from '@mui/icons-material/DriveFolderUploadOutlined';
import './ScheduleDetail.css';

const ScheduleDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate(); // Hook for navigation
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        origin: '',
        destination: '',
        price: '',
        departureDate: '',
        departureTime: '',
        arrivalTime: '',
        desc: '',
        totalSeats: '',
        amenities: '',
        stops: [],
        photos: ''
    });
    const [file, setFile] = useState(null);
    const [newStop, setNewStop] = useState({ stopName: '', arrivalTime: '' });

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const { data } = await getSchedule(id);
                setFormData({
                    name: data.name || '',
                    origin: data.origin || '',
                    destination: data.destination || '',
                    price: data.price || '',
                    departureDate: data.departureDate ? new Date(data.departureDate).toISOString().split('T')[0] : '',
                    departureTime: data.departureTime || '',
                    arrivalTime: data.arrivalTime || '',
                    desc: data.desc || '',
                    totalSeats: data.totalSeats || '',
                    amenities: data.amenities ? data.amenities.join(', ') : '',
                    stops: data.stops || [],
                    photos: data.photos ? data.photos[0] : ''
                });
            } catch (err) {
                setError('Failed to fetch schedule details');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSchedule();
    }, [id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        if (name === 'totalSeats') {
            const seatCount = parseInt(value, 10) || 0;
            const seatNumbers = Array.from({ length: seatCount }, (_, index) => ({
                number: index + 1,
                isBooked: false
            }));
            setFormData((prev) => ({
                ...prev,
                seatNumbers
            }));
        }
    };

    const handleStopChange = (e) => {
        const { name, value } = e.target;
        setNewStop((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const addStop = () => {
        if (newStop.stopName.trim() && newStop.arrivalTime.trim()) {
            setFormData((prev) => ({
                ...prev,
                stops: [...prev.stops, newStop]
            }));
            setNewStop({ stopName: '', arrivalTime: '' });
        }
    };

    const removeStop = (index) => {
        setFormData((prev) => ({
            ...prev,
            stops: prev.stops.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage('');

        let imgUrl = formData.photos || '';
        if (file) {
            const data = new FormData();
            data.append('file', file);
            data.append('upload_preset', 'upload'); // Cloudinary preset

            try {
                const uploadRes = await axios.post(
                    'https://api.cloudinary.com/v1_1/dhvb035xa/image/upload',
                    data
                );
                imgUrl = uploadRes.data.url;
            } catch (err) {
                setError('Failed to upload image');
                console.error(err);
                return;
            }
        }

        const updatedData = {
            ...formData,
            price: parseFloat(formData.price),
            totalSeats: parseInt(formData.totalSeats, 10),
            photos: imgUrl ? [imgUrl] : [],
            amenities: formData.amenities.split(',').map(item => item.trim())
        };

        try {
            await updateSchedule(id, updatedData);
            setSuccessMessage('Schedule updated successfully');
            setTimeout(() => setSuccessMessage(''), 3000); // Clear message after 3 seconds
        } catch (err) {
            setError('Failed to update schedule');
            console.error(err);
        }
    };

    const handleCancel = () => {
        navigate(-1); // Navigate back to the previous page
    };

    if (loading) return <div className="scheduleDetail"><p>Loading schedule details...</p></div>;
    if (error) return <div className="scheduleDetail"><p className="errorMessage">{error}</p></div>;

    return (
        <div className="scheduleDetail">
            <h2>Schedule Details</h2>
            <form onSubmit={handleSubmit}>
                <div className="imageUploadSection">
                    <label htmlFor="file" className="imageUploadLabel">
                        <img
                            src={
                                file
                                    ? URL.createObjectURL(file)
                                    : (formData.photos || 'https://static.thenounproject.com/png/638636-200.png')
                            }
                            alt="Schedule Preview"
                            className="imagePreview"
                        />
                        <DriveFolderUploadOutlinedIcon className="uploadIcon" />
                    </label>
                    <input
                        type="file"
                        id="file"
                        onChange={(e) => setFile(e.target.files[0])}
                        style={{ display: 'none' }}
                        accept="image/*"
                    />
                </div>

                <label htmlFor="name">
                    <strong>Name:</strong>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </label>

                <label htmlFor="origin">
                    <strong>Origin:</strong>
                    <input
                        type="text"
                        id="origin"
                        name="origin"
                        value={formData.origin}
                        onChange={handleChange}
                        required
                    />
                </label>

                <label htmlFor="destination">
                    <strong>Destination:</strong>
                    <input
                        type="text"
                        id="destination"
                        name="destination"
                        value={formData.destination}
                        onChange={handleChange}
                        required
                    />
                </label>

                <label htmlFor="price">
                    <strong>Price:</strong>
                    <input
                        type="number"
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                    />
                </label>

                <label htmlFor="departureDate">
                    <strong>Departure Date:</strong>
                    <input
                        type="date"
                        id="departureDate"
                        name="departureDate"
                        value={formData.departureDate}
                        onChange={handleChange}
                        required
                    />
                </label>

                <label htmlFor="departureTime">
                    <strong>Departure Time:</strong>
                    <input
                        type="time"
                        id="departureTime"
                        name="departureTime"
                        value={formData.departureTime}
                        onChange={handleChange}
                        required
                    />
                </label>

                <label htmlFor="arrivalTime">
                    <strong>Arrival Time:</strong>
                    <input
                        type="time"
                        id="arrivalTime"
                        name="arrivalTime"
                        value={formData.arrivalTime}
                        onChange={handleChange}
                        required
                    />
                </label>

                <label htmlFor="desc">
                    <strong>Description:</strong>
                    <textarea
                        id="desc"
                        name="desc"
                        value={formData.desc}
                        onChange={handleChange}
                        required
                        rows="4"
                    ></textarea>
                </label>

                <label htmlFor="totalSeats">
                    <strong>Total Seats:</strong>
                    <input
                        type="number"
                        id="totalSeats"
                        name="totalSeats"
                        value={formData.totalSeats}
                        onChange={handleChange}
                        required
                        min="0"
                    />
                </label>

                <label htmlFor="amenities">
                    <strong>Amenities (comma-separated):</strong>
                    <input
                        type="text"
                        id="amenities"
                        name="amenities"
                        value={formData.amenities}
                        onChange={handleChange}
                        placeholder="e.g., WiFi, Snacks, Air Conditioning"
                    />
                </label>

                <div className="stopsSection">
                    <strong>Stops:</strong>
                    <div className="stopInputs">
                        <input
                            type="text"
                            name="stopName"
                            value={newStop.stopName}
                            onChange={handleStopChange}
                            placeholder="Stop Name"
                        />
                        <input
                            type="time"
                            name="arrivalTime"
                            value={newStop.arrivalTime}
                            onChange={handleStopChange}
                            placeholder="Arrival Time"
                        />
                        <button type="button" onClick={addStop} className="addStopButton">Add Stop</button>
                    </div>
                    {formData.stops.length > 0 && (
                        <ul className="stopList">
                            {formData.stops.map((stop, index) => (
                                <li key={index}>
                                    {stop.stopName} - {stop.arrivalTime}
                                    <button type="button" onClick={() => removeStop(index)} className="removeStopButton">Remove</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {error && <div className="errorMessage">{error}</div>}
                {successMessage && <div className="successMessage">{successMessage}</div>}

                <div className="buttonGroup">
                    <button type="submit">Update Schedule</button>
                    <button type="button" onClick={handleCancel} className="cancelButton">Back</button>
                </div>
            </form>
        </div>
    );

};

export default ScheduleDetail;
