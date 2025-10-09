import mongoose from "mongoose";

const tagSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true,
        trim: true
    }
}, { timestamps: true });

// ตัวช่วยคืนจำนวน tag ทั้งหมด
tagSchema.statics.countTags = function () {
    return this.countDocuments();
};

const Tag = mongoose.model("Tag", tagSchema);
export default Tag;
