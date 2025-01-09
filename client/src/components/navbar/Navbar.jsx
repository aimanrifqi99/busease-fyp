import { useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import "./navbar.css";

const defaultProfilePic = "https://static.thenounproject.com/png/638636-200.png";

const Navbar = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  const handleRegisterClick = () => {
    navigate("/register");
  };

  // Check if the current path is "/myBookings", "/profile" or contains "/map"
  const isBookingOrMapPage = location.pathname === "/myBookings" || location.pathname === "/profile" || location.pathname.includes("/map");

  return (
    <div className="navbar">
      <div className="navContainer">
        {/* Show the Back arrow on "/myBookings" and any "/map" page */}
        {isBookingOrMapPage && (
          <FontAwesomeIcon
            icon={faArrowLeft}
            className="backArrow"
            onClick={handleBackClick}
          />
        )}

        {/* Conditionally hide "Bus Ease" logo on "/myBookings" and any "/map" page */}
        {!isBookingOrMapPage && (
          <Link to="/" className="logo" style={{ color: "inherit", textDecoration: "none" }}>
            <span>Bus Ease</span>
          </Link>
        )}

        {user ? (
          <div className="navItems">
            {/* Show the "View Bookings" button only on pages other than "/myBookings" and "/map" */}
            {!isBookingOrMapPage && (
              <Link to="/myBookings" className="navLink">
                <button className="navButton">View Bookings</button>
              </Link>
            )}

            {/* Username and Profile Picture */}
            <span className="navUsername">{user.username}</span>
            <img
              src={user.img || defaultProfilePic}
              alt="Profile"
              className="navProfilePic"
              onClick={handleProfileClick}
            />
          </div>
        ) : (
          <div className="authButtons">
            <button className="navButton" onClick={handleLoginClick}>Login</button>
            <button className="navButton" onClick={handleRegisterClick}>Register</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
