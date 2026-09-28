import { META } from "@consumet/extensions";
async function test() {
  const anilist = new META.Anilist();
  const info = await anilist.fetchAnimeInfo("113415").catch(e => console.log('Err:', e.message));
  if (info) {
    console.log(info.title, info.totalEpisodes, info.currentEpisode);
  }
}
test();
