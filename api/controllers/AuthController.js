import User from "../models/UserModel.js";
import bcrypt from "bcryptjs";
import { createError } from "../utils/error.js";
import jwt from "jsonwebtoken";

export const register = async (req, res, next) => {
  try {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);

    const newUser = new User({
      ...req.body,  
      password: hash,  
    });

    await newUser.save();
    res.status(200).send("User has been created.");  
  } catch (err) {
    next(err);  
  }
};


export const login = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user) return next(createError(404, "User not found!"));  // If user not found, error out

    // Compare provided password with stored hashed password
    const isPasswordCorrect = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!isPasswordCorrect)
      return next(createError(400, "Wrong password or username!"));  // If password doesn't match, error out

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT  // Ensure JWT secret is in your environment variables
    );

    // Destructure to exclude password and isAdmin before sending response
    const { password, isAdmin, ...otherDetails } = user._doc;

    // Send the token and user details in the response
    res.status(200).json({
      details: { ...otherDetails },
      isAdmin,
      token  // Include the token in the response
    });

  } catch (err) {
    next(err);  // Error handling for unexpected errors
  }
};