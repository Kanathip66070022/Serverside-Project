const Post = require("../models/postModel");

// ✅ Create Post
exports.createPost = async (req, res) => {
  try {
    const { username, title, content, status, tags } = req.body;

    const post = await Post.create({
      username,
      title,
      content,
      status,
      tags
    });

    res.status(201).json({ message: "Post created successfully", post });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Get All Posts
exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate("username", "email");
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get Post by postId
exports.getPostByPostId = async (req, res) => {
  try {
    const post = await Post.findOne({ postId: req.params.postId }).populate("username", "email");
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update Post
exports.updatePostByPostId = async (req, res) => {
  try {
    const post = await Post.findOneAndUpdate(
      { postId: req.params.postId },
      req.body,
      { new: true }
    );
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json({ message: "Post updated", post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete Post
exports.deletePostByPostId = async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({ postId: req.params.postId });
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};