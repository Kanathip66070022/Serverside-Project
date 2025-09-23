import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import path from "path";
import methodOverride from "method-override";

import swaggerSpec from "./config/swagger.js";

import authMiddleware from "./middlewares/authMiddleware.js";

import pageRoutes from "./routes/pageRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import albumRoutes from "./routes/albumRoutes.js";

const app = express();

app.set("view engine", "ejs");
app.set("views", "./views");

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method")); // ถ้าใช้ _method
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Middleware
app.use(authMiddleware);

// set current path for views
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

// Routes
app.use("/", pageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/albums", albumRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("Cloud Post-IT API is running 🚀");
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default app;
