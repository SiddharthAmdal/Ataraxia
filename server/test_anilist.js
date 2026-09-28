import { META, ANIME } from "@consumet/extensions";
// Let's try Anilist without a provider
const anilist = new META.Anilist();
anilist.fetchAnimeInfo("21").then(info => console.log(info.episodes?.length)).catch(console.error);
