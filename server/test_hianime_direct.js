import { ANIME } from "@consumet/extensions";

const hianime = new ANIME.Hianime();

async function test() {
  try {
    console.log("Searching for dragon ball z...");
    const search = await hianime.search("dragon ball z");
    console.log("Search results:", search.results.length);
    if (search.results.length > 0) {
      const first = search.results[0];
      console.log("First result:", first.title, "ID:", first.id);
      console.log("Fetching episodes for:", first.id);
      const info = await hianime.fetchAnimeInfo(first.id);
      console.log("Episodes found:", info.episodes.length);
    }
  } catch (err) {
    console.error("Test failed:", err);
  }
}

test();
