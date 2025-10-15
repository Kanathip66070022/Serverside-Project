import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";
import { migrateDiskImagesToGridFS } from "./utils/migrateImagesToGridFS.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect DB & Start Server
connectDB()
  .then(() => {
    // Start the server only after a successful database connection
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });

    // Migrate disk images to GridFS
    migrateDiskImagesToGridFS().catch((err) => console.error("migrate error", err));
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1); // Exit the process with failure
  });
