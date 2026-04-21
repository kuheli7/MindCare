import mongoose from "mongoose";

const OptionSetSchema = new mongoose.Schema({
  set_name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    default: ""
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("OptionSet", OptionSetSchema);
