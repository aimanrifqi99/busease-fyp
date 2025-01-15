import { useState, useContext } from "react";
import axios from "axios";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./register.css";
import DriveFolderUploadOutlinedIcon from "@mui/icons-material/DriveFolderUploadOutlined";

const API_URL = process.env.REACT_APP_API_URL;

const Register = () => {
  const [credentials, setCredentials] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const { dispatch } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    setCredentials((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    let imgUrl = "";
    if (file) {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "upload"); // Cloudinary preset

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

    const registerData = { ...credentials, img: imgUrl };

    try {
      // Register the user
      await axios.post(`${API_URL}/api/auth/register`, registerData);

      // Automatically log in after registering
      const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
        username: credentials.username,
        password: credentials.password,
      });
      const userData = {
        ...loginRes.data.details,
        token: loginRes.data.token,
      };
      dispatch({ type: "LOGIN_SUCCESS", payload: userData });

      // Navigate based on where the user came from
      if (location.state?.fromLogin) {
        navigate(-2); // Go back two steps if coming from login
      } else {
        navigate(-1); // Go back one step
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="authPage">
      <form className="authForm" onSubmit={handleSubmit}>
        <h2>Register</h2>
        <div className="imageUploadSection">
          <label htmlFor="file" className="imageUploadLabel">
            <img
              src={
                file
                  ? URL.createObjectURL(file)
                  : "https://static.thenounproject.com/png/638636-200.png"
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
            style={{ display: "none" }}
          />
        </div>
        <input
          type="text"
          name="username"
          placeholder="Username"
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          required
        />
        <button className="authButton" type="submit">
          Register
        </button>
        {error && <span className="errorMessage">{error}</span>}

        <p className="switchText">
          Already have an account?{" "}
          <Link to="/login" className="switchLink" state={{ fromRegister: true }}>
            Log in here
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
