import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String
    },
    imageUrl: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // เชื่อมกับ user
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
});

const Image = mongoose.model("Image", imageSchema);
export default Image;
