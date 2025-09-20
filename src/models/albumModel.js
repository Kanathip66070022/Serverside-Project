import mongoose from "mongoose";

const albumSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        default: ""
    },
    images: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Image",
        required: true
    }],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", required: true
    },
    status: {
        type: String,
        enum: ["public", "private"],
        default: "public"
    }
}, { timestamps: true });

const Album = mongoose.model("Album", albumSchema);

export default Album;
