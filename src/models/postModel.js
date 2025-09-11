const mongoose = require("mongoose");
const Counter = require("./counterModel");

const postSchema = new mongoose.Schema({
  postId: { type: Number, unique: true }, // auto increment PK
  username: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // FK
  //userId: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, default: "" },
  likes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["public", "private"], default: "public" },
  tags: [{ type: String }]
});

// Auto-increment postId
postSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "postId" },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true }
    );
    this.postId = counter.sequenceValue;
  }
  next();
});

module.exports = mongoose.model("Post", postSchema);