// models/GuestUser.js
import mongoose from "mongoose";

const GuestSchema = new mongoose.Schema({
  username: String // user_49382
});

export default mongoose.model("GuestUser", GuestSchema);
