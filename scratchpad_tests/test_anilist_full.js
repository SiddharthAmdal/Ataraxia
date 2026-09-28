import { META } from "@consumet/extensions";
const anilist = new META.Anilist();
anilist.fetchAnimeInfo("21").then(info => console.log("totalEpisodes:", info.totalEpisodes, "status:", info.status, "currentEpisode:", info.currentEpisode || info.nextAiringEpisode?.episode)).catch(console.error);
