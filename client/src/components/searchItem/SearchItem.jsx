// src/components/searchItem/SearchItem.jsx
import { useNavigate } from "react-router-dom";
import "./searchItem.css";
import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import Reserve from "../reserve/Reserve";

const SearchItem = ({ item }) => {
  const [openModal, setOpenModal] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Calculate available seats
  const availableSeats = item.seatNumbers
    ? item.seatNumbers.filter((seat) => !seat.isBooked).length
    : 0;

  const handleClick = () => {
    if (user) {
      setOpenModal(true);
    } else {
      navigate("/login");
    }
  };

  const handleClickMap = () => {
    navigate(`/map/${item._id}`);
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="searchItem">
      {/* Left side: image and seats container */}
      <div className="siLeftContainer">
        <div className="siImageContainer">
          <img
            src={
              item.photos && item.photos.length > 0
                ? item.photos[0]
                : "https://via.placeholder.com/300x200"
            }
            alt={item.name}
            className="siImg"
          />
        </div>
        <div className="siAvailableSeats">
          <p>
            <strong>Available Seats:</strong>{" "}
            <span className="siAvailableSeatsNumber">{availableSeats}</span>
          </p>
        </div>
      </div>

      {/* Main Description and Details */}
      <div className="siDesc">
        <h1 className="siTitle">{item.name}</h1>

        {/* Route Details */}
        <h3 className="siSectionTitle">Route Details</h3>
        <div className="siRouteDetails">
          <p>
            <strong>Departure Time:</strong>{" "}
            <span className="importantText">{item.departureTime}</span>
          </p>
          <p>
            <strong>Arrival Time:</strong>{" "}
            <span className="importantText">{item.arrivalTime}</span>
          </p>
        </div>

        <p className="siFeatures">
          <strong>Duration:</strong> {item.duration}
        </p>

        {/* Stops Section */}
        <div className="siStops">
          <p>
            <strong>Stops:</strong>
          </p>
          {item.stops.length > 0 ? (
            <ul className="noPaddingList">
              {item.stops.map((stop, index) => (
                <li key={index} className="siFeatures">
                  {stop.stopName} at {stop.arrivalTime}
                </li>
              ))}
            </ul>
          ) : (
            <p className="siFeatures">No intermediate stops</p>
          )}
        </div>

        {/* Expandable Section for Amenities & Description */}
        {expanded && (
          <div className="siExtraDetails">
            {/* Amenities Section */}
            <div className="siAmenitiesSection">
              <p>
                <strong>Amenities:</strong>
              </p>
              {item.amenities.length > 0 ? (
                <ul className="noPaddingList">
                  {item.amenities.map((amenity, index) => (
                    <li key={index} className="siFeatures">
                      {amenity}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="siFeatures">No amenities available</p>
              )}
            </div>

            {/* Description Section */}
            <h3 className="siSectionTitle">Description</h3>
            <p className="siDescription tightSpacing">{item.desc}</p>
          </div>
        )}

        {/* Button to toggle additional information */}
        <button onClick={toggleExpanded} className="siExpandButton">
          {expanded ? "Show Less" : "Show More"}
        </button>
      </div>

      {/* Right-Side Container for Pricing and Route Map */}
      <div className="siDetails">
        <div className="siDetailTexts">
          <span className="siPrice">RM{item.price}</span>
          <span className="siTaxOp">Includes taxes and fees</span>
          <button onClick={handleClick} className="siCheckButton">
            View Seats
          </button>
          <div className="siMapContainer">
            <div className="siViewRouteLabel">View Route</div>
            <button
              onClick={handleClickMap}
              className="siMapButton"
              aria-label="View Map"
            />
          </div>
        </div>
      </div>

      {/* Modal for seat reservation */}
      {openModal && <Reserve setOpen={setOpenModal} scheduleId={item._id} />}
    </div>
  );
};

export default SearchItem;
