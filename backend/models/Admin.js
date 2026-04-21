import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Counter from "./Counter.js";

const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;


const AdminSchema = new mongoose.Schema({
  admin_id: { type: String, unique: true },
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});

// ===============================
// AUTO INCREMENT ADMIN ID
// ===============================
AdminSchema.pre("save", async function () {
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { name: "admin_id" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    this.admin_id =
      "ADM" + String(counter.seq).padStart(3, "0");
  }

  if (this.isModified("password")) {
    if (BCRYPT_HASH_REGEX.test(this.password)) {
      return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// Method to compare password
AdminSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Admin = mongoose.model("Admin", AdminSchema);

export default Admin;
