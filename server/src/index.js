import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { config } from "./config.js";
import { mediaRouter } from "./routes/media.js";
import { progressRouter } from "./routes/progress.js";
import { streamingRouter } from "./routes/streaming.js";
import { watchlistRouter } from "./routes/watchlist.js";

const app = express();
const instanceId = Date.now().toString();

mongoose.connect("mongodb://127.0.0.1:27017/hianime")
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

app.use(
  cors({
    origin: "*"
  })
);
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[Server] ${req.method} ${req.url}`);
  next();
});

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    instanceId
  });
});

app.use("/api", mediaRouter);
app.use("/api", progressRouter);
app.use("/api", streamingRouter);
app.use("/api", watchlistRouter);
app.use("/assets", express.static("/Users/Siddharth/.gemini/antigravity/brain/eddc4beb-75ef-4c1f-b93d-33485f1bf3d2"));

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
