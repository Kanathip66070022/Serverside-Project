const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // ใช้เก็บชื่อ collection เช่น "postId"
  sequenceValue: { type: Number, default: 0 },
});

module.exports = mongoose.model("Counter", counterSchema);