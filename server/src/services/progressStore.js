import { Progress } from "../models/Progress.js";

export async function readProgressStore() {
  try {
    const items = await Progress.find().sort({ updatedAt: -1 }).lean();
    return items;
  } catch (error) {
    console.error("Error reading progress from DB", error);
    return [];
  }
}

export async function upsertProgress(progress) {
  try {
    const nextItem = {
      ...progress,
      updatedAt: new Date().toISOString()
    };
    
    await Progress.findOneAndUpdate(
      { itemId: progress.itemId },
      { $set: nextItem },
      { upsert: true, new: true }
    );
    
    return nextItem;
  } catch (error) {
    console.error("Error upserting progress to DB", error);
    return null;
  }
}

export async function deleteProgress(itemId) {
  try {
    await Progress.findOneAndDelete({ itemId });
    return true;
  } catch (error) {
    console.error("Error deleting progress from DB", error);
    return false;
  }
}