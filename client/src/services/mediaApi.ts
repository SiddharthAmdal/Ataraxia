import { api } from "../lib/http";
import type {
  ContinueWatchingItem,
  UserProgress,
  SkipTimesResult,
  WatchlistItem,
  WatchlistStatus
} from "../types/media";

export type ProgressPayload = {
  itemId: string;
  animeId: string;
  title: string;
  image?: string;
  episodeNumber?: number;
  positionTicks: number;
  runtimeTicks: number;
  played: boolean;
};

export async function getTrendingAnime() {
  const { data } = await api.get("/streaming/trending");
  return data.results || [];
}

export async function getPopularAnime() {
  const { data } = await api.get("/streaming/popular");
  return data.results || [];
}

export async function getRecentEpisodes() {
  const { data } = await api.get("/streaming/recent");
  return data.results || [];
}

export async function getUpcomingAnime() {
  const { data } = await api.get("/streaming/upcoming");
  return data.results || [];
}

export async function getShowDetail(showId: string) {
  const { data } = await api.get<any>(`/shows/${encodeURIComponent(showId)}`);
  return data;
}

export async function getPlaybackSource(episodeId: string, category = "sub") {
  const { data } = await api.get<any>(`/streaming/watch?episodeId=${encodeURIComponent(episodeId)}&category=${category}`);
  const referer = data.embedUrl || data.headers?.Referer || "";
  return {
    itemId: episodeId,
    streamUrl: data.isM3U8 ? `${api.defaults.baseURL}/playback/proxy?target=${encodeURIComponent(data.source)}&referer=${encodeURIComponent(referer)}` : undefined,
    directStreamUrl: !data.isM3U8 ? `${api.defaults.baseURL}/streaming/proxy?url=${encodeURIComponent(data.source)}&referer=${encodeURIComponent(referer)}` : undefined,
    subtitles: data.subtitles
  };
}

export async function getContinueWatching() {
  const { data } = await api.get("/continue-watching");
  return data;
}

export async function getProgress() {
  const { data } = await api.get<UserProgress[]>("/progress");
  return data;
}

export async function saveProgress(payload: ProgressPayload) {
  const { data } = await api.put<UserProgress>(
    `/progress/${payload.itemId}`,
    payload
  );
  return data;
}

export async function deleteProgress(itemId: string) {
  const { data } = await api.delete(`/progress/${itemId}`);
  return data;
}

export async function getSkipTimes(malId: number, episodeNumber: number, showName?: string, seasonNumber?: number) {
  const params = new URLSearchParams();
  if (showName) params.set("showName", showName);
  if (seasonNumber) params.set("seasonNumber", seasonNumber.toString());

  const { data } = await api.get<SkipTimesResult>(
    `/skip-times/${malId}/${episodeNumber}?${params.toString()}`
  );
  return data;
}

export async function getWatchlist() {
  const { data } = await api.get<WatchlistItem[]>("/watchlist");
  return data;
}

export async function updateWatchlist(animeId: string, payload: { status: WatchlistStatus; title: string; image?: string }) {
  const { data } = await api.put<WatchlistItem>(`/watchlist/${animeId}`, payload);
  return data;
}

export async function importFromMAL(username: string) {
  const { data } = await api.post<{ message: string; count: number }>("/watchlist/import/mal", { username });
  return data;
}

