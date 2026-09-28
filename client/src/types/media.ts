export type Library = {
  id: string;
  name: string;
  itemCount: number;
};

export type UserProgress = {
  itemId: string;
  animeId: string;
  title: string;
  image?: string;
  episodeNumber?: number;
  positionTicks: number;
  runtimeTicks: number;
  updatedAt: string;
  played: boolean;
};

export type ContinueWatchingItem = UserProgress;

export type MediaShow = {
  id: string;
  name: string;
  overview: string;
  productionYear?: number;
  communityRating?: number;
  genres: string[];
  imageUrl?: string;
  backdropUrl?: string;
  logoUrl?: string;
  seasonCount?: number;
  episodeCount?: number;
  libraryId?: string;
};

export type Episode = {
  id: string;
  name: string;
  overview: string;
  indexNumber?: number;
  parentIndexNumber?: number;
  runtimeTicks: number;
  imageUrl?: string;
  mediaSourceId?: string;
  subtitles?: SubtitleTrack[];
};

export type SubtitleTrack = {
  index: number;
  language: string;
  label: string;
  isDefault: boolean;
  codec: string;
  url?: string;
};

export type AnimeRelation = {
  id: string;
  relationType: string;
  title: string;
  image: string;
  type: string;
};

export type AnimeMetadata = {
  malId?: number;
  title: string;
  synopsis: string;
  score?: number;
  genres: string[];
  trailerUrl?: string;
  imageUrl?: string;
  relations: AnimeRelation[];
};

export type SkipInterval = {
  startTime: number;
  endTime: number;
};

export type SkipTimesResult = {
  found: boolean;
  results: Array<{
    skipType: "op" | "ed";
    interval: SkipInterval;
  }>;
};

export type ShowDetail = {
  show: MediaShow;
  episodes: Episode[];
  metadata: AnimeMetadata | null;
  relations: AnimeRelation[];
};

export type PlaybackSource = {
  itemId: string;
  mediaSourceId?: string;
  streamUrl?: string;
  directStreamUrl?: string;
  embedUrl?: string;
  subtitles?: { url: string; lang: string }[];
};

export type WatchlistStatus = "completed" | "watching" | "planned" | "on_hold" | "dropped" | "removed";

export type WatchlistItem = {
  animeId: string;
  status: WatchlistStatus;
  title: string;
  image?: string;
  updatedAt: string;
};
