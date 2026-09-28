import { Progress } from "../models/Progress.js";

export async function readProgressStore() {
  const items = await Progress.find().sort({ updatedAt: -1 }).lean();
  return items;
}

export async function upsertProgress(progress) {
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
}

export async function deleteProgress(itemId) {
  await Progress.findOneAndDelete({ itemId });
  return true;
}