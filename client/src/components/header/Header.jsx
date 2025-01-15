import React, { useContext, useState } from "react";
import { faCalendarDays, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./header.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";
import { SearchContext } from "../../context/SearchContext";
import Autosuggest from "react-autosuggest";

const cities = [
  "Kuala Lumpur (Tbs)",
  "George Town (Penang Sentral)",
  "Ipoh (Terminal Amanjaya)",
  "Johor Bahru (Jb Sentral)",
  "Shah Alam (Terminal 17)",
  "Seremban (Terminal One)",
  "Alor Setar (Terminal Shahab Perdana)",
  "Kuala Terengganu (Terminal Bas Mbkt)",
  "Kota Bharu (Terminal Bas Kota Bharu)",
  "Kuantan (Kuantan Sentral)",
  "Kangar (Terminal Bas Kangar)",
  "Malacca City (Melaka Sentral)",
];

const Header = ({ type }) => {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState(new Date());
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);

  const navigate = useNavigate();
  const { dispatch } = useContext(SearchContext);

  const getSuggestions = (value) => {
    const inputValue = value.trim().toLowerCase();
    return inputValue.length === 0
      ? []
      : cities.filter((city) => city.toLowerCase().startsWith(inputValue));
  };

  const handleSearch = () => {
    if (!origin || !destination || !date) {
      alert("Please fill in the origin, destination, and date.");
      return;
    }
    dispatch({
      type: "NEW_SEARCH",
      payload: { origin, destination, date: date.toISOString() },
    });
    navigate("/schedules");
  };

  return (
    <div className="header">
      <div className={type === "list" ? "headerContainer listMode" : "headerContainer"}>
        <div className="headerSearch">
          {/* Origin Field */}
          <div className="headerSearchItem">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="headerIcon" />
            <Autosuggest
              suggestions={originSuggestions}
              onSuggestionsFetchRequested={({ value }) =>
                setOriginSuggestions(getSuggestions(value))
              }
              onSuggestionsClearRequested={() => setOriginSuggestions([])}
              getSuggestionValue={(s) => s}
              renderSuggestion={(s) => <div>{s}</div>}
              inputProps={{
                placeholder: "Origin",
                value: origin,
                onChange: (e, { newValue }) => setOrigin(newValue),
                className: "headerSearchInput autosuggestInput",
              }}
              theme={{
                container: "headerAutosuggestContainer",
                suggestionsContainer: "headerAutosuggestSuggestionsContainer",
                suggestionsList: "headerAutosuggestSuggestionsList",
                suggestion: "headerAutosuggestSuggestion",
                suggestionHighlighted: "linkautosuggestSuggestionHighlighted",
              }}
            />
          </div>

          {/* Destination Field */}
          <div className="headerSearchItem">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="headerIcon" />
            <Autosuggest
              suggestions={destinationSuggestions}
              onSuggestionsFetchRequested={({ value }) =>
                setDestinationSuggestions(getSuggestions(value))
              }
              onSuggestionsClearRequested={() => setDestinationSuggestions([])}
              getSuggestionValue={(s) => s}
              renderSuggestion={(s) => <div>{s}</div>}
              inputProps={{
                placeholder: "Destination",
                value: destination,
                onChange: (e, { newValue }) => setDestination(newValue),
                className: "headerSearchInput autosuggestInput",
              }}
              theme={{
                container: "headerAutosuggestContainer",
                suggestionsContainer: "headerAutosuggestSuggestionsContainer",
                suggestionsList: "headerAutosuggestSuggestionsList",
                suggestion: "headerAutosuggestSuggestion",
                suggestionHighlighted: "linkautosuggestSuggestionHighlighted",
              }}
            />
          </div>

          {/* Date Field */}
          <div className="headerSearchItem">
            <FontAwesomeIcon icon={faCalendarDays} className="headerIcon" />
            <label className="datePickerLabel" htmlFor="busDatePicker">
              Bus Date
            </label>
            <DatePicker
              id="busDatePicker"
              selected={date}
              onChange={(newDate) => setDate(newDate)}
              dateFormat="dd/MM/yyyy"
              className="headerSearchInput"
              popperClassName="datePickerPopper"
            />
          </div>

          {/* Search Button */}
          <div className="headerSearchItem">
            <button className="headerBtn" onClick={handleSearch}>
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
