// AuthContext.js
import { createContext, useEffect, useReducer } from 'react';

const INITIAL_STATE = {
  user: JSON.parse(localStorage.getItem('user')) || null,  // Fetch user from localStorage
  loading: false,
  error: null, 
};

export const AuthContext = createContext(INITIAL_STATE);

const AuthReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        user: null,
        loading: true,
        error: null, 
      };
    case 'LOGIN_SUCCESS':
      localStorage.setItem('user', JSON.stringify(action.payload));
      return {
        user: action.payload,
        loading: false,
        error: null, 
      };
    case 'LOGIN_FAILURE':
      return {
        user: null,
        loading: false,
        error: action.payload, 
      };
    case 'LOGOUT':
      localStorage.removeItem('user');
      localStorage.removeItem('access_token'); 
      return {
        user: null,
        loading: false,
        error: null, 
      };
    default:
      return state;
  }
};

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(AuthReducer, INITIAL_STATE);

  useEffect(() => {
    if (state.user) {
      localStorage.setItem('user', JSON.stringify(state.user));
    }
  }, [state.user]);

  useEffect(() => {
    if (!state.user) return;

    const INACTIVITY_TIME_LIMIT = 1 * 10 * 1000;
    let logoutTimer;

    const resetInactivityTimeout = () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      logoutTimer = setTimeout(() => {
        dispatch({ type: 'LOGOUT' });
        alert('You have been logged out due to inactivity.');
      }, INACTIVITY_TIME_LIMIT);
    };

    // Listen for user activity
    window.addEventListener('mousemove', resetInactivityTimeout);
    window.addEventListener('keypress', resetInactivityTimeout);
    window.addEventListener('click', resetInactivityTimeout);
    window.addEventListener('scroll', resetInactivityTimeout);

    // Set initial timeout
    resetInactivityTimeout();

    return () => {
      // Cleanup event listeners and timeout
      window.removeEventListener('mousemove', resetInactivityTimeout);
      window.removeEventListener('keypress', resetInactivityTimeout);
      window.removeEventListener('click', resetInactivityTimeout);
      window.removeEventListener('scroll', resetInactivityTimeout);
      clearTimeout(logoutTimer);
    };
  }, [state.user, dispatch]);

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        loading: state.loading,
        error: state.error,
        dispatch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
