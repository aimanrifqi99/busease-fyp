import { useContext, useState } from "react";
import axios from "axios";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./login.css";

const API_URL = process.env.REACT_APP_API_URL;
const ADMIN_URL = process.env.REACT_APP_ADMIN_URL;

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  const { loading, error, dispatch } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    setCredentials((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleClick = async (e) => {
    e.preventDefault();
    dispatch({ type: "LOGIN_START" });
    try {
      const res = await axios.post(
        `${API_URL}/api/auth/login`, credentials);

      // Combine user details and token in one payload
      const userData = { ...res.data.details, isAdmin: res.data.isAdmin, token: res.data.token };
      dispatch({ type: "LOGIN_SUCCESS", payload: userData });
      console.log("API_URL:", API_URL);
      console.log("ADMIN_URL:", ADMIN_URL);
      if (userData.isAdmin) {
        window.location.href = process.env.REACT_APP_ADMIN_URL;
        return;
      }

      // Navigate based on where the user came from
      if (location.state?.fromRegister) {
        navigate(-2); // Go back two steps if coming from register
      } else {
        navigate(-1); // Go back one step
      }
    } catch (err) {
      dispatch({ type: "LOGIN_FAILURE", payload: err.response.data });
    }
  };

  return (
    <div className="authPage">
      <form className="authForm" onSubmit={handleClick}>
        <h2>Login</h2>
        <input
          type="text"
          name="username"
          placeholder="Username"
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
        <button className="authButton" type="submit" disabled={loading}>
          Login
        </button>
        {error && <span className="errorMessage">{error.message}</span>}

        <p className="switchText">
          Don't have an account?{" "}
          <Link to="/register" className="switchLink" state={{ fromLogin: true }}>
            Register here
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
