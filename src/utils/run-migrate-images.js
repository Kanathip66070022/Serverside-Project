import mongoose from "mongoose";
import { migrateDiskImagesToGridFS } from "./migrateImagesToGridFS.js";

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/cloud-postit";
  await mongoose.connect(uri);
  await migrateDiskImagesToGridFS();
  await mongoose.connection.close();
}
main().catch(e => { console.error(e); process.exit(1); });
