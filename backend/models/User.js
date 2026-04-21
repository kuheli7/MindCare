import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    display_name: { type: String }, // Used in admin dashboard (e.g. "John" or "User_1234")
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "admin"], default: "student" },
    createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
UserSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    if (BCRYPT_HASH_REGEX.test(this.password)) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
UserSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", UserSchema);
export default User;
