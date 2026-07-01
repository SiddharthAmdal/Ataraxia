import mongoose from "mongoose";

const watchlistSchema = new mongoose.Schema({
  animeId: { type: String, required: true, unique: true },
  status: { type: String, required: true },
  title: { type: String, required: true },
  image: { type: String },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});

export const Watchlist = mongoose.model("Watchlist", watchlistSchema);
