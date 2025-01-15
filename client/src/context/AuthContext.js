import { createContext, useEffect, useReducer } from "react";

const INITIAL_STATE = {
  user: JSON.parse(localStorage.getItem("user")) || null,
  loading: false,
  error: null,
};

export const AuthContext = createContext(INITIAL_STATE);

const AuthReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN_START":
      return {
        user: null,
        loading: true,
        error: null,
      };
    case "LOGIN_SUCCESS":
      localStorage.setItem("user", JSON.stringify(action.payload));
      return {
        user: action.payload,
        loading: false,
        error: null,
      };
    case "LOGIN_FAILURE":
      return {
        user: null,
        loading: false,
        error: action.payload,
      };
    case "LOGOUT":
      localStorage.removeItem("user");
      localStorage.removeItem("lastSessionTime");
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
    if (!state.user) return;

    // Check if the tab was closed for more than 10 minutes
    const checkSessionExpiration = () => {
      const lastSessionTime = localStorage.getItem("lastSessionTime");
      if (lastSessionTime) {
        const elapsedTime = Date.now() - parseInt(lastSessionTime, 10);
        if (elapsedTime > 10 * 60 * 1000) {
          dispatch({ type: "LOGOUT" });
        }
      }
    };

    checkSessionExpiration();

    // Set up event listener for tab closing
    const handleTabClose = () => {
      localStorage.setItem("lastSessionTime", Date.now().toString());
    };

    window.addEventListener("beforeunload", handleTabClose);

    return () => {
      window.removeEventListener("beforeunload", handleTabClose);
    };
  }, [state.user, dispatch]);

  useEffect(() => {
    if (state.user) {
      localStorage.setItem("user", JSON.stringify(state.user));
    }
  }, [state.user]);

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
