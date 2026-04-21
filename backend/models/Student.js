import mongoose from "mongoose";

const StudentSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
});

export default mongoose.model("Student", StudentSchema);
