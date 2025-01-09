// src/pages/list/List.jsx
import React, { useContext, useEffect, useState, useCallback } from "react";
import { formatISO } from "date-fns";
import Navbar from "../../components/navbar/Navbar";
import SearchItem from "../../components/searchItem/SearchItem";
import DatePicker from "react-datepicker";
import { SearchContext } from "../../context/SearchContext";
import Autosuggest from 'react-autosuggest';
import "react-datepicker/dist/react-datepicker.css";
import "./list.css";

const cities = [
  'Kuala Lumpur (Tbs)', 'George Town (Penang Sentral)', 'Ipoh (Terminal Amanjaya)', 'Johor Bahru (Jb Sentral)',
  'Shah Alam (Terminal 17)', 'Seremban (Terminal One)', 'Alor Setar (Terminal Shahab Perdana)', 'Kuala Terengganu (Terminal Bas Mbkt)',
  'Kota Bharu (Terminal Bas Kota Bharu)', 'Kuantan (Kuantan Sentral)', 'Kangar (Terminal Bas Kangar)', 'Malacca City (Melaka Sentral)'
];

const availableAmenities = ['WiFi', 'Air Conditioning', 'Restroom', 'Reclining Seats', 'USB Charging Ports'];

const List = () => {
  const { origin, destination, date, dispatch } = useContext(SearchContext);

  const [localOrigin, setLocalOrigin] = useState(origin || "");
  const [localDestination, setLocalDestination] = useState(destination || "");
  const [localDate, setLocalDate] = useState(date ? new Date(date) : new Date());
  const [submitted, setSubmitted] = useState(false);
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [sortByPrice, setSortByPrice] = useState(false);
  const [sortByDuration, setSortByDuration] = useState(false); // New state for sorting by duration
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  // Memoized function to fetch schedules
  const fetchSchedules = useCallback(async (searchOrigin, searchDestination, searchDate) => {
    setLoading(true);
    setError(null);
    try {
      const formattedDate = formatISO(new Date(searchDate), { representation: 'date' });

      const query = {
        origin: searchOrigin,
        destination: searchDestination,
        departureDate: formattedDate
      };

      if (selectedAmenities.length > 0) {
        query.amenities = selectedAmenities.join(',');
      }

      const queryString = new URLSearchParams(query).toString();

      const response = await fetch(`/schedules/?${queryString}`);

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedAmenities]);

  // Handle search button click
  const handleSearch = () => {
    if (!localOrigin || !localDestination || !localDate) {
      alert('Please fill in the origin, destination, and date.');
      return;
    }

    const searchData = {
      origin: localOrigin,
      destination: localDestination,
      date: localDate.toISOString(),
    };

    dispatch({ type: "NEW_SEARCH", payload: searchData });

    fetchSchedules(localOrigin, localDestination, localDate);
    setSubmitted(true);
  };

  useEffect(() => {
    if (origin && destination && date) {
      setLocalOrigin(origin);
      setLocalDestination(destination);
      setLocalDate(new Date(date));
      fetchSchedules(origin, destination, date);
      setSubmitted(false);
    }
  }, [origin, destination, date, fetchSchedules]);

  // Convert "Xh Ym" duration string to total minutes
  const durationToMinutes = (duration) => {
    if (!duration) return Infinity; // If duration is undefined or empty, treat it as the longest duration
  
    const [hoursPart, minutesPart] = duration.split(' ');
    
    // Extract hours and minutes by removing non-numeric characters
    const hours = parseInt(hoursPart.replace(/\D/g, ''), 10) || 0;
    const minutes = parseInt(minutesPart.replace(/\D/g, ''), 10) || 0;
    
    return hours * 60 + minutes;
  };

  // Function to sort data by price or duration
  const sortedData = () => {
    if (!data) return [];
    if (sortByPrice) {
      return [...data].sort((a, b) => a.price - b.price);
    }
    if (sortByDuration) {
      return [...data].sort((a, b) => durationToMinutes(a.duration) - durationToMinutes(b.duration));
    }
    return data;
  };

  const getSuggestions = value => {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;
    return inputLength === 0 ? [] : cities.filter(city =>
      city.toLowerCase().startsWith(inputValue)
    );
  };

  const onSuggestionsFetchRequested = ({ value }, isOrigin = true) => {
    const suggestions = getSuggestions(value);
    if (isOrigin) {
      setOriginSuggestions(suggestions);
    } else {
      setDestinationSuggestions(suggestions);
    }
  };

  const onSuggestionsClearRequested = (isOrigin = true) => {
    if (isOrigin) {
      setOriginSuggestions([]);
    } else {
      setDestinationSuggestions([]);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="listContainer">
        <div className="listWrapper">
          <div className="listSearch">
            <h1 className="lsTitle">Search</h1>
            <div className="lsItem">
              <label>Origin</label>
              <Autosuggest
                suggestions={originSuggestions}
                onSuggestionsFetchRequested={({ value }) => onSuggestionsFetchRequested({ value }, true)}
                onSuggestionsClearRequested={() => onSuggestionsClearRequested(true)}
                getSuggestionValue={suggestion => suggestion}
                renderSuggestion={suggestion => <div>{suggestion}</div>}
                inputProps={{
                  placeholder: "Enter origin",
                  value: localOrigin,
                  onChange: (e, { newValue }) => setLocalOrigin(newValue),
                  className: "input linkautosuggestInput"
                }}
                theme={{
                  container: 'linkautosuggestContainer',
                  suggestionsContainer: 'linkautosuggestSuggestionsContainer',
                  suggestionsContainerOpen: 'linkautosuggestSuggestionsContainerOpen',
                  suggestionsList: 'linkautosuggestSuggestionsList',
                  suggestion: 'linkautosuggestSuggestion',
                  suggestionHighlighted: 'linkautosuggestSuggestionHighlighted'
                }}
              />
            </div>
            <div className="lsItem">
              <label>Destination</label>
              <Autosuggest
                suggestions={destinationSuggestions}
                onSuggestionsFetchRequested={({ value }) => onSuggestionsFetchRequested({ value }, false)}
                onSuggestionsClearRequested={() => onSuggestionsClearRequested(false)}
                getSuggestionValue={suggestion => suggestion}
                renderSuggestion={suggestion => <div>{suggestion}</div>}
                inputProps={{
                  placeholder: "Enter destination",
                  value: localDestination,
                  onChange: (e, { newValue }) => setLocalDestination(newValue),
                  className: "input linkautosuggestInput"
                }}
                theme={{
                  container: 'linkautosuggestContainer',
                  suggestionsContainer: 'linkautosuggestSuggestionsContainer',
                  suggestionsContainerOpen: 'linkautosuggestSuggestionsContainerOpen',
                  suggestionsList: 'linkautosuggestSuggestionsList',
                  suggestion: 'linkautosuggestSuggestion',
                  suggestionHighlighted: 'linkautosuggestSuggestionHighlighted'
                }}
              />
            </div>
            <div className="lsItem">
              <label>Departure Date</label>
              <DatePicker
                selected={localDate}
                onChange={(date) => setLocalDate(date)}
                dateFormat="MM/dd/yyyy"
                className="datePickerInput"
                popperClassName="datePickerPopper"
                portalId="root-portal"
              />
            </div>
            <div className="lsItem">
              <label>Amenities</label>
              <div className="amenitiesCheckboxes">
                {availableAmenities.map((amenity) => (
                  <label key={amenity}>
                    <input
                      type="checkbox"
                      value={amenity}
                      checked={selectedAmenities.includes(amenity)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAmenities([...selectedAmenities, amenity]);
                        } else {
                          setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
                        }
                      }}
                    />
                    {amenity}
                  </label>
                ))}
              </div>
            </div>
            {/* Sort by price or shortest duration */}
            <div className="lsItem">
              <label className="checkboxLabel">
                <input
                  type="checkbox"
                  checked={sortByPrice}
                  onChange={(e) => {
                    setSortByPrice(e.target.checked);
                    setSortByDuration(false); // Reset duration sorting
                  }}
                  className="checkboxInput"
                />
                Sort by cheapest price
              </label>
            </div>
            <div className="lsItem">
              <label className="checkboxLabel">
                <input
                  type="checkbox"
                  checked={sortByDuration}
                  onChange={(e) => {
                    setSortByDuration(e.target.checked);
                    setSortByPrice(false); // Reset price sorting
                  }}
                  className="checkboxInput"
                />
                Sort by shortest duration
              </label>
            </div>
            <button onClick={handleSearch} className="searchButton">Search</button>
          </div>
          <div className="listResult">
            {submitted && (!localOrigin || !localDestination || !localDate) ? (
              <div className="errorMessage">Error: Missing search parameters.</div>
            ) : loading ? (
              <div className="loadingMessage">Loading...</div>
            ) : error ? (
              <div className="errorMessage">Error loading schedules: {error}</div>
            ) : (
              sortedData()?.length > 0 ? (
                sortedData().map((item) => <SearchItem item={item} key={item._id} />)
              ) : (
                <div className="noResultsMessage">No available buses.</div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default List;