import mongoose from "mongoose";

export const streamFile = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).send("Missing id");
    const _id = new mongoose.Types.ObjectId(id);

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "uploads" });
    const filesCol = mongoose.connection.db.collection("uploads.files");
    const file = await filesCol.findOne({ _id });
    if (!file) return res.status(404).send("File not found");

    res.setHeader("Content-Type", file.contentType || "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    bucket.openDownloadStream(_id).on("error", () => res.sendStatus(404)).pipe(res);
  } catch (err) {
    console.error("streamFile error:", err);
    res.status(500).send("Server error");
  }
};