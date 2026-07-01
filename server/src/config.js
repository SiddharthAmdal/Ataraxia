import "dotenv/config";

export const config = {
  port: Number(process.env.PORT || 4000),
  serverPublicUrl: process.env.SERVER_PUBLIC_URL || "http://localhost:4000",
  jikanBaseUrl:
    process.env.JIKAN_BASE_URL?.replace(/\/+$/, "") ||
    "https://api.jikan.moe/v4"
};
