import { Watchlist } from "../models/Watchlist.js";

export async function readWatchlistStore() {
  const items = await Watchlist.find().sort({ updatedAt: -1 }).lean();
  return items;
}

export async function writeWatchlistStore(items) {
  if (!items || items.length === 0) return;
  const operations = items.map(item => ({
    updateOne: {
      filter: { animeId: item.animeId },
      update: { $set: item },
      upsert: true
    }
  }));
  await Watchlist.bulkWrite(operations);
}

export async function updateWatchlist(item) {
  if (item.status === "removed") {
    await Watchlist.findOneAndDelete({ animeId: item.animeId });
    return null;
  }

  const nextItem = {
    ...item,
    updatedAt: new Date().toISOString()
  };
  
  await Watchlist.findOneAndUpdate(
    { animeId: item.animeId },
    { $set: nextItem },
    { upsert: true, new: true }
  );
  
  return nextItem;
}
