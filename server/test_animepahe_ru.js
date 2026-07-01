import { ANIME } from "@consumet/extensions";
import axios from "axios";

const provider = new ANIME.AnimePahe();
provider.baseUrl = "https://animepahe.ru";

async function test() {
  try {
    console.log("Testing animepahe.ru...");
    const response = await axios.get(provider.baseUrl, { timeout: 10000 });
    console.log("Status:", response.status);
    
    console.log("Searching for dragon ball z...");
    const search = await provider.search("dragon ball z");
    console.log("Results:", search.results.length);
    if (search.results.length > 0) {
      console.log("First result:", search.results[0].title);
      const info = await provider.fetchAnimeInfo(search.results[0].id);
      console.log("Episodes:", info.episodes.length);
      if (info.episodes.length > 0) {
          const sources = await provider.fetchEpisodeSources(info.episodes[0].id);
          console.log("Subtitles found:", sources.subtitles?.length || 0);
      }
    }
  } catch (err) {
    console.error("Test failed:", err.message);
  }
}

test();
