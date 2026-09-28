import mongoose from "mongoose";

const watchlistSchema = new mongoose.Schema({
  animeId: { type: String, required: true, unique: true },
  status: { type: String, required: true },
  title: { type: String, required: true },
  image: { type: String }
}, {
  timestamps: true
});

export const Watchlist = mongoose.model("Watchlist", watchlistSchema);
