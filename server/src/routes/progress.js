import { Router } from "express";
import {
  readProgressStore,
  upsertProgress,
  deleteProgress
} from "../services/progressStore.js";

export const progressRouter = Router();

progressRouter.get("/progress", async (_request, response, next) => {
  try {
    response.json(await readProgressStore());
  } catch (error) {
    next(error);
  }
});

progressRouter.get("/continue-watching", async (_request, response, next) => {
  try {
    const progress = await readProgressStore();
    // Return the 12 most recent ones
    response.json(progress.slice(0, 12));
  } catch (error) {
    next(error);
  }
});

progressRouter.put("/progress/:itemId", async (request, response, next) => {
  try {
    const positionTicks = Number(request.body.positionTicks || 0);
    const runtimeTicks = Number(request.body.runtimeTicks || 0);

    const saved = await upsertProgress({
      itemId: request.params.itemId,
      animeId: request.body.animeId,
      title: request.body.title,
      image: request.body.image,
      episodeNumber: request.body.episodeNumber,
      positionTicks,
      runtimeTicks,
      played: request.body.played === 'true' || request.body.played === true
    });

    response.json(saved);
  } catch (error) {
    next(error);
  }
});

progressRouter.delete("/progress/:itemId", async (request, response, next) => {
  try {
    const success = await deleteProgress(request.params.itemId);
    response.json({ success });
  } catch (error) {
    next(error);
  }
});
