import { ANIME } from "@consumet/extensions";

const provider = new ANIME.AnimeSaturn();

async function test() {
  try {
    const search = await provider.search("dragon ball z");
    if (search.results.length > 0) {
      const first = search.results[0];
      const info = await provider.fetchAnimeInfo(first.id);
      console.log("First episode ID:", info.episodes[0].id);
      console.log("Fetching sources for:", info.episodes[0].id);
      const sources = await provider.fetchEpisodeSources(info.episodes[0].id);
      console.log("Sources found:", sources.sources.length);
    }
  } catch (err) {
    console.error("Test failed:", err);
  }
}

test();
