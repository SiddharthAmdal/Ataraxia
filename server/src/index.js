import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import path from "node:path";
import { config } from "./config.js";
import { mediaRouter } from "./routes/media.js";
import { progressRouter } from "./routes/progress.js";
import { streamingRouter } from "./routes/streaming.js";
import { watchlistRouter } from "./routes/watchlist.js";
import { authRouter } from "./routes/auth.js";
import { authenticate } from "./middlewares/authMiddleware.js";

const app = express();
const instanceId = Date.now().toString();

mongoose.connect(config.mongoUri)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

app.use(
  cors({
    origin: config.corsOrigins
  })
);
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[Server] ${req.method} ${req.url}`);
  next();
});

// Public endpoints
app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    instanceId
  });
});

app.use("/api", authRouter);

// Serve assets safely from project root (if they exist)
app.use("/assets", express.static(path.join(process.cwd(), "public")));

// Protected endpoints
app.use("/api", authenticate, mediaRouter);
app.use("/api", authenticate, progressRouter);
app.use("/api", authenticate, streamingRouter);
app.use("/api", authenticate, watchlistRouter);

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({
    message: error instanceof Error ? error.message : "Unexpected server error."
  });
});

app.listen(config.port, "::", () => {
  console.log(
    `Private anime platform server listening on http://[::]:${config.port}`
  );
});
