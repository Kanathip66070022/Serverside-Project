import Tag from "../models/tagModel.js";

export const listTags = async (req, res) => {
  try {
    const tags = await Tag.find().sort({ title: 1 }).lean();
    return res.json({ ok: true, tags });
  } catch (err) {
    console.error("listTags error:", err);
    return res.status(500).json({ error: "Failed to list tags" });
  }
};

export const getTagCount = async (req, res) => {
  try {
    const count = await Tag.countTags();
    return res.json({ ok: true, count });
  } catch (err) {
    console.error("getTagCount error:", err);
    return res.status(500).json({ error: "Failed to get tag count" });
  }
};

export const createTag = async (req, res) => {
  try {
    const title = (req.body.title || "").trim();
    if (!title) return res.status(400).json({ error: "Missing title" });

    const tag = await Tag.findOneAndUpdate(
      { title },
      { title },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.redirect("/tags");
  } catch (err) {
    console.error("createTag error:", err);
    return res.status(500).json({ error: "Create failed" });
  }
};

export const deleteTag = async (req, res) => {
  try {
    const id = req.params.id;
    const tag = await Tag.findByIdAndDelete(id);
    if (!tag) return res.status(404).json({ error: "Tag not found" });
    return res.json({ ok: true });
  } catch (err) {
    console.error("deleteTag error:", err);
    return res.status(500).json({ error: "Delete failed" });
  }
};
