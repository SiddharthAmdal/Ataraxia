import "dotenv/config";

export const config = {
  port: Number(process.env.PORT || 4000),
  serverPublicUrl: process.env.SERVER_PUBLIC_URL || "http://localhost:4000",
  jikanBaseUrl:
    process.env.JIKAN_BASE_URL?.replace(/\/+$/, "") ||
    "https://api.jikan.moe/v4",
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hianime",
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:5173").split(",").map(s => s.trim()),
  jwtSecret: process.env.JWT_SECRET || "default_unsafe_secret"
};
