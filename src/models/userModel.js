import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePic: { type: String },
  albums: [{ type: mongoose.Schema.Types.ObjectId, ref: "Album" }],
  role: { type: String, default: "user" }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;