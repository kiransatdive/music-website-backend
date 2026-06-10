import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import adminAuthRoutes from "./routes/adminAuthRoutes.ts";
import artistAuthRoutes from "./routes/artistAuthRoutes.ts";
import releaseRoutes from "./routes/releaseRoutes.ts";
import adminReleaseRoutes from "./routes/adminReleaseRoutes.ts";
import adminArtistRoutes from "./routes/adminArtistRoutes.ts";
import notificationRoutes from "./routes/notificationRoutes.ts";
import siteContentRoutes from "./routes/siteContentRoutes.ts";
import pricingPlanRoutes from "./routes/pricingPlanRoutes.ts";
import adminWhitelistRoutes from "./routes/adminWhitelistRoutes.ts";
import artistWhitelistRoutes from "./routes/artistWhitelistRoutes.ts";
import adminYoutubeCriteriaRoutes from "./routes/adminYoutubeCriteriaRoutes.ts";
import youtubeCriteriaRoutes from "./routes/youtubeCriteriaRoutes.ts";
import adminPlatformRoutes from "./routes/adminPlatformRoutes.ts";
import platformRoutes from "./routes/platformRoutes.ts";
import adminRoyaltyRoutes from "./routes/adminRoyaltyRoutes.ts";
import adminDashboardRoutes from "./routes/adminDashboardRoutes.ts";
import adminNotificationRoutes from "./routes/adminNotificationRoutes.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL ?? "*",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:3000",
      "http://localhost:5000",
      "http://localhost:3003",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

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
app.use("/api", adminPlatformRoutes);
app.use("/api", platformRoutes);
app.use("/api", adminRoyaltyRoutes);
app.use("/api", adminDashboardRoutes);
app.use("/api", adminNotificationRoutes);

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
