import mongoose from "mongoose";

const OptionSchema = new mongoose.Schema({
  option_set_id: { type: mongoose.Schema.Types.ObjectId, ref: "OptionSet", required: false },
  question_id: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: false },
  option_text: { type: String, required: true },
  points: { type: Number, required: true },
  order: { type: Number, default: 0 }
});

const Option = mongoose.model("Option", OptionSchema);
export default Option;