import React, { useEffect, useState } from 'react';
import { getUser, updateUser } from '../../api/userApi';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UserDetail.css';
import DriveFolderUploadOutlinedIcon from '@mui/icons-material/DriveFolderUploadOutlined';

const UserDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        isAdmin: false,
        img: ''
    });
    const [file, setFile] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data } = await getUser(id);
                setFormData({
                    username: data.username,
                    email: data.email,
                    phone: data.phone || '',
                    isAdmin: data.isAdmin,
                    img: data.img || ''
                });
            } catch (err) {
                setError('Failed to fetch user details');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
    
        let imgUrl = formData.img;
        let phoneNumber = Number(formData.phone); // Convert to Number
    
        if (isNaN(phoneNumber)) {
            setError('Phone number must be a valid number');
            return;
        }
    
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
                return;
            }
        }
    
        try {
            await updateUser(id, { ...formData, phone: phoneNumber, img: imgUrl });
            setSuccessMessage('User information updated successfully');
            setTimeout(() => setSuccessMessage(''), 3000); // Clear message after 3 seconds
        } catch (err) {
            setError('Failed to update user information');
            console.error(err);
        }
    };    

    const handleCancel = () => {
        navigate(-1);
    };

    if (loading) return <div>Loading user details...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="userDetail">
            <h2>User Details</h2>
            <form onSubmit={handleSubmit}>
                <div className="imageUploadSection">
                    <label htmlFor="file" className="imageUploadLabel">
                        <img
                            src={
                                file
                                    ? URL.createObjectURL(file)
                                    : formData.img || 'https://static.thenounproject.com/png/638636-200.png'
                            }
                            alt="Profile Preview"
                            className="imagePreview"
                        />
                        <DriveFolderUploadOutlinedIcon className="uploadIcon" />
                    </label>
                    <input
                        type="file"
                        id="file"
                        onChange={(e) => setFile(e.target.files[0])}
                        style={{ display: 'none' }}
                    />
                </div>
                <label>
                    <strong>Username:</strong>
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                </label>
                <label>
                    <strong>Email:</strong>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </label>
                <label>
                    <strong>Phone Number:</strong>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                    />
                </label>
                <label>
                    <strong>Is Admin:</strong>
                    <input
                        type="checkbox"
                        name="isAdmin"
                        checked={formData.isAdmin}
                        onChange={handleChange}
                    />
                </label>

                {error && <div className="errorMessage">{error}</div>}
                {successMessage && <div className="successMessage">{successMessage}</div>}

                <div className="buttonGroup">
                    <button type="submit">Update User</button>
                    <button type="button" onClick={handleCancel} className="cancelButton">Back</button>
                </div>
            </form>
        </div>
    );
};

export default UserDetail;