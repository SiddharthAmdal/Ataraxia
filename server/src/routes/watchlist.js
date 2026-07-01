import { Router } from "express";
import {
  readWatchlistStore,
  updateWatchlist,
  writeWatchlistStore
} from "../services/watchlistStore.js";
import { fetchUserWatchlist } from "../services/jikanClient.js";
import { mapMalIdsToAnilistIds } from "../services/anilistClient.js";

export const watchlistRouter = Router();

watchlistRouter.get("/watchlist", async (_request, response, next) => {
  try {
    response.json(await readWatchlistStore());
  } catch (error) {
    next(error);
  }
});

watchlistRouter.put("/watchlist/:animeId", async (request, response, next) => {
  try {
    const { status, title, image } = request.body;

    const saved = await updateWatchlist({
      animeId: request.params.animeId,
      status,
      title,
      image
    });

    response.json(saved);
  } catch (error) {
    next(error);
  }
});

watchlistRouter.post("/watchlist/import/mal", async (request, response, next) => {
  try {
    const { username } = request.body;
    if (!username) return response.status(400).json({ message: "MAL username required" });

    const malList = await fetchUserWatchlist(username);
    
    // Map MAL IDs to Anilist IDs
    const malIds = malList.map(item => item.animeId);
    const idMap = await mapMalIdsToAnilistIds(malIds);
    
    const mappedList = malList.map(item => ({
        ...item,
        animeId: idMap[item.animeId] || item.animeId // Fallback to MAL ID if no mapping found
    }));

    const currentList = await readWatchlistStore();
    
    const merged = [...currentList];
    for (const item of mappedList) {
        if (item.status === "removed") continue;
        const index = merged.findIndex(i => i.animeId === item.animeId);
        if (index >= 0) {
            merged[index] = { ...merged[index], ...item };
        } else {
            merged.push(item);
        }
    }

    await writeWatchlistStore(merged);
    response.json({ message: `Successfully imported and mapped ${mappedList.length} items from MAL`, count: mappedList.length });
  } catch (error) {
    next(error);
  }
});

watchlistRouter.post("/watchlist/fix-ids", async (request, response, next) => {
    try {
        const currentList = await readWatchlistStore();
        // Identify numeric IDs that might be MAL IDs
        const potentialMalIds = currentList
            .filter(item => /^\d+$/.test(item.animeId))
            .map(item => item.animeId);
        
        if (potentialMalIds.length === 0) {
            return response.json({ message: "No numeric IDs to fix." });
        }

        const idMap = await mapMalIdsToAnilistIds(potentialMalIds);
        let fixCount = 0;
        
        const fixedList = currentList.map(item => {
            const newId = idMap[item.animeId];
            if (newId && newId !== item.animeId) {
                fixCount++;
                return { ...item, animeId: newId };
            }
            return item;
        });

        if (fixCount > 0) {
            await writeWatchlistStore(fixedList);
        }

        response.json({ message: `Successfully fixed ${fixCount} items in the watchlist.`, count: fixCount });
    } catch (error) {
        next(error);
    }
});
