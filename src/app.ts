import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import artistAuthRoutes from "./routes/artistAuthRoutes.js";
import releaseRoutes from "./routes/releaseRoutes.js";
import adminReleaseRoutes from "./routes/adminReleaseRoutes.js";
import adminArtistRoutes from "./routes/adminArtistRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import siteContentRoutes from "./routes/siteContentRoutes.js";
import pricingPlanRoutes from "./routes/pricingPlanRoutes.js";
import adminWhitelistRoutes from "./routes/adminWhitelistRoutes.js";
import artistWhitelistRoutes from "./routes/artistWhitelistRoutes.js";
import adminYoutubeCriteriaRoutes from "./routes/adminYoutubeCriteriaRoutes.js";
import youtubeCriteriaRoutes from "./routes/youtubeCriteriaRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL ?? "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    environment: process.env.NODE_ENV ?? "development",
    timestamp: new Date().toISOString(),
  });
});

//api collections-
app.use("/api", artistAuthRoutes);
app.use("/api", adminAuthRoutes);
app.use("/api", releaseRoutes);
app.use("/api", adminReleaseRoutes);
app.use("/api", adminArtistRoutes);
app.use("/api", notificationRoutes);
app.use("/api", siteContentRoutes);
app.use("/api", pricingPlanRoutes);
app.use("/api", adminWhitelistRoutes);
app.use("/api", artistWhitelistRoutes);
app.use("/api", adminYoutubeCriteriaRoutes);
app.use("/api", youtubeCriteriaRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,

    _next: express.NextFunction,
  ) => {
    console.error("❌ Unhandled error:", err.message);
    res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message,
    });
  },
);

export default app;
