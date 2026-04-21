import mongoose from "mongoose";

const DomainSchema = new mongoose.Schema({
  assessment_type_id: { type: mongoose.Schema.Types.ObjectId, ref: "AssessmentType" },
  domain_name: { type: String, required: true },
  color: { type: String, default: "#3498db" },
  description: String
});

const Domain = mongoose.model("Domain", DomainSchema);
export default Domain;
