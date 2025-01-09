// src/context/SearchContext.jsx
import React, { createContext, useReducer, useEffect } from "react";

// Initial state for the search context
const INITIAL_STATE = {
  origin: "",
  destination: "",
  date: null, // Use null for a single date
};

// Create the context
export const SearchContext = createContext(INITIAL_STATE);

// Reducer to manage search state
const SearchReducer = (state, action) => {
  switch (action.type) {
    case "NEW_SEARCH":
      return {
        origin: action.payload.origin,
        destination: action.payload.destination,
        date: action.payload.date,
      };
    case "RESET_SEARCH":
      return INITIAL_STATE;
    default:
      return state;
  }
};

// Context provider to wrap the application
export const SearchContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(SearchReducer, INITIAL_STATE, (initial) => {
    // Initialize state from localStorage if available
    const persisted = localStorage.getItem("searchData");
    return persisted ? JSON.parse(persisted) : initial;
  });

  // Persist search data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("searchData", JSON.stringify(state));
  }, [state]);

  return (
    <SearchContext.Provider
      value={{
        origin: state.origin,
        destination: state.destination,
        date: state.date,
        dispatch,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
