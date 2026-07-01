import mongoose from "mongoose";

const progressSchema = new mongoose.Schema({
  itemId: { type: String, required: true, unique: true },
  animeId: { type: String, required: true },
  title: { type: String, required: true },
  image: { type: String },
  episodeNumber: { type: Number },
  positionTicks: { type: Number, default: 0 },
  runtimeTicks: { type: Number, default: 0 },
  played: { type: Boolean, default: false },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});

export const Progress = mongoose.model("Progress", progressSchema);