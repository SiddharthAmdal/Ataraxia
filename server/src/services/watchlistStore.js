import { Watchlist } from "../models/Watchlist.js";

export async function readWatchlistStore() {
  try {
    const items = await Watchlist.find().sort({ updatedAt: -1 }).lean();
    return items;
  } catch (error) {
    console.error("Error reading watchlist from DB", error);
    return [];
  }
}

export async function writeWatchlistStore(items) {
  try {
    // Clear and insert all
    await Watchlist.deleteMany({});
    if (items.length > 0) {
      await Watchlist.insertMany(items);
    }
  } catch (error) {
    console.error("Error writing watchlist to DB", error);
  }
}

export async function updateWatchlist(item) {
  try {
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
  } catch (error) {
    console.error("Error updating watchlist in DB", error);
    return null;
  }
}
