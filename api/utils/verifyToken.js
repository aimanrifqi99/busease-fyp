// utils/verifyToken.js
import jwt from "jsonwebtoken";
import { createError } from "../utils/error.js";

// Verify Token Middleware
export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Extract the token from the Authorization header

  if (!token) {
    console.log("No token provided");
    return next(createError(401, "You are not authenticated!"));
  }

  jwt.verify(token, process.env.JWT, (err, user) => {
    if (err) {
      console.log("Token verification failed:", err);
      return next(createError(403, "Token is not valid!"));
    }
    req.user = user; // Attach the user info to req.user
    next(); // Proceed to the next middleware
  });
};

// Verify User Middleware with Admin Bypass
export const verifyUser = (req, res, next) => {
  verifyToken(req, res, () => {
    // Allow admin to bypass user-specific checks
    if (req.user && req.user.isAdmin) {
      return next();
    }

    const userIdFromRequest = req.params.id || req.params.userId || req.body.userId;
    if (req.user && req.user.id === userIdFromRequest) {
      next();
    } else {
      console.log("User ID mismatch:", { tokenUserId: req.user.id, requestUserId: userIdFromRequest });
      return next(createError(403, "You are not authorized!"));
    }
  });
};

// Verify Admin Middleware
export const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, (err) => {
    if (err) return next(err);
    if (req.user && req.user.isAdmin) {
      next(); // User is admin, proceed to route handler
    } else {
      console.log("User is not admin:", req.user);
      return next(createError(403, "You are not authorized as an admin"));
    }
  });
};
