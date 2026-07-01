import { ANIME } from "@consumet/extensions";
import axios from "axios";

const provider = new ANIME.AnimePahe();
provider.baseUrl = "https://animepahe.com";

// Patch the internal client to use better headers
provider.client.defaults.headers.common['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';

async function test() {
  try {
    console.log("Searching for dragon ball z on animepahe.com...");
    const search = await provider.search("dragon ball z");
    console.log("Results:", search.results.length);
    if (search.results.length > 0) {
      const first = search.results[0];
      console.log("First result:", first.title, "ID:", first.id);
      
      console.log("Fetching info for:", first.id);
      const info = await provider.fetchAnimeInfo(first.id);
      console.log("Episodes:", info.episodes.length);
      
      if (info.episodes.length > 0) {
          const ep = info.episodes[0];
          console.log("Fetching sources for episode:", ep.number);
          const sources = await provider.fetchEpisodeSources(ep.id);
          console.log("Sources found:", sources.sources.length);
          console.log("Subtitles found:", sources.subtitles?.length || 0);
          console.log("Subtitles:", sources.subtitles?.map(s => s.lang));
          if (sources.sources.length > 0) {
              console.log("First source URL:", sources.sources[0].url);
          }
      }
    }
  } catch (err) {
    console.error("Test failed:", err.message);
    if (err.stack) console.error(err.stack);
  }
}

test();
