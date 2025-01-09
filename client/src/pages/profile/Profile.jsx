// src/pages/profile/Profile.jsx
import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./profile.css";
import Navbar from "../../components/navbar/Navbar";
import DriveFolderUploadOutlinedIcon from "@mui/icons-material/DriveFolderUploadOutlined";

const defaultProfilePic = "https://static.thenounproject.com/png/638636-200.png";
const API_URL = process.env.REACT_APP_API_URL;

const Profile = () => {
  const { user, dispatch } = useContext(AuthContext);
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");

  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (confirmLogout) {
      dispatch({ type: "LOGOUT" });
      navigate("/");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage("");

    // **Add Confirmation Prompt**
    const confirmSave = window.confirm("Are you sure you want to save the changes?");
    if (!confirmSave) {
      return; // Exit the function if the user cancels
    }

    let imgUrl = user.img;
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

    try {
      const updateRes = await axios.put(
      `${API_URL}/api/users/${user._id}`,
        { img: imgUrl, email, phone },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      const updatedUser = updateRes.data;

      if (!updatedUser.token) {
        updatedUser.token = user.token;
      }

      dispatch({ type: "LOGIN_SUCCESS", payload: updatedUser });
      setSuccessMessage("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      setError("Failed to update user profile");
    }
  };

  if (!user) {
    return (
      <div>
        <Navbar />
        <div className="profilePage">
          <div className="profileCard">
            <h1 className="profileTitle">Profile</h1>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="profilePage">
        <div className="profileCard">
          <h1 className="profileTitle">Profile</h1>

          {successMessage && <p className="successMessage">{successMessage}</p>}
          {error && <p className="errorMessage">{error}</p>}

          <div className="imageUploadSection">
            <label htmlFor="file" className="imageUploadLabel">
              <img
                src={
                  file
                    ? URL.createObjectURL(file)
                    : user.img
                    ? user.img
                    : defaultProfilePic
                }
                alt="Profile Preview"
                className="profilePic imagePreview"
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

          <form className="profileForm" onSubmit={handleSave}>
            <div className="formGroup">
              <label htmlFor="email" className="formLabel">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="formGroup">
              <label htmlFor="phone" className="formLabel">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <button className="saveButton" type="submit">
              Save Changes
            </button>
          </form>

          <div className="profileInfo">
            <div className="infoItem">
              <span className="infoLabel">Username:</span>
              <span className="infoValue">{user.username || "N/A"}</span>
            </div>
            <div className="infoItem">
              <span className="infoLabel">Joined:</span>
              <span className="infoValue">
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
          </div>

          <button className="logoutButton" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;