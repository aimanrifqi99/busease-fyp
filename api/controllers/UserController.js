import UserModel from "../models/UserModel.js"
import BookingModel from "../models/BookingModel.js"
import ScheduleModel from "../models/ScheduleModel.js"

export const updateUser = async (req, res, next) => {
    try {
      const updatedUser = await UserModel.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true } 
      );
  
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Exclude sensitive fields like password
      const { password, isAdmin, ...otherDetails } = updatedUser._doc;
  
      // Respond with the filtered user object
      res.status(200).json(otherDetails);
    } catch (err) {
      next(err); 
    }
  };
  

export const deleteUser = async (req, res, next) => {
    try {
        const userId = req.params.id;

        // Find and delete all bookings associated with this user
        const bookings = await BookingModel.find({ user: userId }).populate('schedule');
        
        for (const booking of bookings) {
            // Set the seats back to available in each associated schedule
            booking.seatNumbers.forEach(seatNumber => {
                const seat = booking.schedule.seatNumbers.find(s => s.number === seatNumber);
                if (seat) seat.isBooked = false;
            });
            await booking.schedule.save();
        }

        // Delete all bookings for this user
        await BookingModel.deleteMany({ user: userId });

        // Delete the user
        await UserModel.findByIdAndDelete(userId);

        res.status(200).json({ message: "User and associated bookings have been deleted." });
    } catch (err) {
        console.error("Error deleting user and associated bookings:", err);
        next(err);
    }
};

export const getUser = async (req,res,next)=>{
    try {
        const user = await UserModel.findById(req.params.id);
        res.status(200).json(user)
    } catch (err) {
        next(err);
    }
}

export const getUsers = async (req,res,next)=>{
    try {
        const user = await UserModel.find();
        res.status(200).json(user)
    } catch (err) {
        next(err);
    }
}