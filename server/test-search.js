import { ANIME } from "@consumet/extensions";

async function test() {
  const hianime = new ANIME.AnimeSaturn();
  try {
    const res = await hianime.fetchEpisodeSources("Dragon-Ball-Super-a-ep-1");
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
