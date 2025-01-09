import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoute from "./routes/auth.js";
import usersRoute from "./routes/users.js";
import schedulesRoute from "./routes/schedules.js";
import bookingRoute from "./routes/bookings.js";
import stripeRoutes from "./routes/stripe.js";
import assistantRoutes from "./routes/assistantRoutes.js";

import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
dotenv.config();
const port = process.env.PORT || 5000;

// Connect to MongoDB
const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1); // Exit the process if the connection fails
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected!");
});

// Middlewares
app.use(cors({
  origin: [
    "http://localhost:3000", 
    "http://localhost:4000", 
    "https://busease-fyp-client.onrender.com" // Add your deployed frontend URL
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Specify allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

// Routes
app.use("/api/auth", authRoute);
app.use("/api/users", usersRoute);
app.use("/api/schedules", schedulesRoute);
app.use("/api/bookings", bookingRoute);
app.use("/api/stripe", stripeRoutes);
app.use('/api', assistantRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err); // If headers are already sent, delegate to default error handler
  }

  const errorStatus = err.status || 500;
  const errorMessage = err.message || "Something went wrong";
  res.status(errorStatus).json({
    success: false,
    status: errorStatus,
    message: errorMessage,
    stack: process.env.NODE_ENV === "production" ? null : err.stack, // Hide stack trace in production
  });
});

// Start the server
app.listen(port, () => {
  connect();
  console.log("Server running on port 5000");
});