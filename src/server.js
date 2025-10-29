import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";
import { migrateDiskImagesToGridFS } from "./utils/migrateImagesToGridFS.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

// Connect DB & Start Server
connectDB()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
    });

    migrateDiskImagesToGridFS().catch((err) => console.error("migrate error", err));
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
  });

