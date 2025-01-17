import React, { useState } from 'react';
import axios from 'axios';
import { createSchedule } from '../../api/scheduleApi';
import DriveFolderUploadOutlinedIcon from "@mui/icons-material/DriveFolderUploadOutlined";
import './AddScheduleForm.css';

const AddScheduleForm = ({ onClose, onAdd }) => {
    const [formData, setFormData] = useState({
        name: "",
        origin: "",
        destination: "",
        price: "",
        departureDate: "",
        departureTime: "",
        arrivalTime: "",
        desc: "",
        totalSeats: "",
        amenities: "",
        seatNumbers: [],
        stops: [],
    });
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);
    const [newStop, setNewStop] = useState({ stopName: "", arrivalTime: "" }); // State for a new stop entry

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            if (name === "totalSeats") {
                const seatCount = parseInt(value) || 0;
                const seatNumbers = Array.from({ length: seatCount }, (_, index) => ({
                    number: index + 1,
                    isBooked: false,
                }));
                return { ...prev, totalSeats: value, seatNumbers };
            }
            return { ...prev, [name]: value };
        });
    };

    const handleStopChange = (e) => {
        const { name, value } = e.target;
        setNewStop((prev) => ({ ...prev, [name]: value }));
    };

    const addStop = () => {
        if (newStop.stopName && newStop.arrivalTime) {
            setFormData((prev) => ({
                ...prev,
                stops: [...prev.stops, newStop],
            }));
            setNewStop({ stopName: "", arrivalTime: "" }); // Reset new stop fields
        }
    };

    const removeStop = (index) => {
        setFormData((prev) => ({
            ...prev,
            stops: prev.stops.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        let imgUrl = "";
        if (file) {
            const data = new FormData();
            data.append("file", file);
            data.append("upload_preset", "upload");

            try {
                const uploadRes = await axios.post(
                    "https://api.cloudinary.com/v1_1/dhvb035xa/image/upload",
                    data
                );
                imgUrl = uploadRes.data.url;
            } catch (err) {
                setError("Failed to upload image");
                return;
            }
        }

        const scheduleData = {
            ...formData,
            price: parseFloat(formData.price),
            totalSeats: parseInt(formData.totalSeats),
            photos: imgUrl ? [imgUrl] : [],
            amenities: formData.amenities.split(',').map(item => item.trim()),
        };

        try {
            const { data } = await createSchedule(scheduleData);
            onAdd(data);
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong");
        }
    };

    return (
        <div className="addScheduleForm">
            <h2>Add Schedule</h2>
            <form onSubmit={handleSubmit}>
                <div className="formGroup">
                    <label>Name:</label>
                    <input type="text" name="name" onChange={handleChange} required />
                </div>
                <div className="formGroup">
                    <label>Origin:</label>
                    <input type="text" name="origin" onChange={handleChange} required />
                </div>
                <div className="formGroup">
                    <label>Destination:</label>
                    <input type="text" name="destination" onChange={handleChange} required />
                </div>
                <div className="formGroup">
                    <label>Price:</label>
                    <input type="number" name="price" onChange={handleChange} required />
                </div>
                <div className="formGroup">
                    <label>Departure Date:</label>
                    <input type="date" name="departureDate" onChange={handleChange} required />
                </div>
                <div className="formGroup">
                    <label>Departure Time:</label>
                    <input type="time" name="departureTime" onChange={handleChange} required />
                </div>
                <div className="formGroup">
                    <label>Arrival Time:</label>
                    <input type="time" name="arrivalTime" onChange={handleChange} required />
                </div>
                <div className="formGroup">
                    <label>Description:</label>
                    <textarea name="desc" onChange={handleChange} required />
                </div>
                <div className="formGroup">
                    <label>Total Seats:</label>
                    <input type="number" name="totalSeats" onChange={handleChange} required />
                </div>
                <div className="formGroup">
                    <label>Stops:</label>
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
                        <button type="button" onClick={addStop}>
                            Add Stop
                        </button>
                    </div>
                    <ul className="stopList">
                        {formData.stops.map((stop, index) => (
                            <li key={index}>
                                {stop.stopName} - {stop.arrivalTime}
                                <button type="button" onClick={() => removeStop(index)}>
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="formGroup">
                    <label>Amenities (comma-separated):</label>
                    <input type="text" name="amenities" onChange={handleChange} />
                </div>
                <div className="formGroup">
                    <label>Photos:</label>
                    <div className="imageUploadSection">
                        <label htmlFor="file" className="imageUploadLabel">
                            <img
                                src={
                                    file
                                        ? URL.createObjectURL(file)
                                        : "https://icons.veryicon.com/png/o/miscellaneous/common-fill-icon/gallery-33.png"
                                }
                                alt="Preview"
                                className="imagePreview"
                            />
                            <DriveFolderUploadOutlinedIcon className="uploadIcon" />
                        </label>
                        <input
                            type="file"
                            id="file"
                            onChange={(e) => setFile(e.target.files[0])}
                            style={{ display: "none" }}
                        />
                    </div>
                </div>
                {error && <span className="errorMessage">{error}</span>}
                <div className="formActions">
                    <button type="submit">Add Schedule</button>
                    <button type="button" onClick={onClose}>Close</button>
                </div>
            </form>
        </div>
    );
};

export default AddScheduleForm;
