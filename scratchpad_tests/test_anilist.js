import { META } from "@consumet/extensions";
async function test() {
  const anilist = new META.Anilist();
  try {
    const res = await anilist.fetchAnimeInfo("113415"); // JJK
    console.log('JJK totalEpisodes:', res.totalEpisodes);
    console.log('JJK nextAiring:', res.nextAiringEpisode);
    console.log('JJK eps length:', res.episodes ? res.episodes.length : 0);
    if (res.episodes && res.episodes.length > 0) {
      console.log('JJK first ep:', res.episodes[0]);
    }
  } catch(e) { console.log('Err:', e.message); }
}
test();
