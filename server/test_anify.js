import axios from 'axios';

async function testAnify() {
  try {
    console.log("Searching for dragon ball z on Anify...");
    const searchResponse = await axios.get('https://api.anify.tv/search?query=dragon%20ball%20z&type=anime');
    const results = searchResponse.data;
    console.log("Results found:", results.length);
    
    if (results.length > 0) {
      const anime = results[0];
      console.log("First result:", anime.title.english || anime.title.romaji, "ID:", anime.id);
      
      console.log("Fetching info for:", anime.id);
      const infoResponse = await axios.get(`https://api.anify.tv/info/${anime.id}`);
      const info = infoResponse.data;
      console.log("Episodes:", info.episodes.data.length);
      
      if (info.episodes.data.length > 0) {
          const episode = info.episodes.data[0];
          console.log("Fetching sources for episode 1...");
          // Anify sources usually have subtitles
          const sourceResponse = await axios.get(`https://api.anify.tv/sources?animeId=${anime.id}&episodeId=${episode.id}&episodeNumber=1&type=sub`);
          const sources = sourceResponse.data;
          console.log("Subtitles found:", sources.subtitles?.length || 0);
          console.log("Subtitles:", sources.subtitles?.map(s => s.lang));
      }
    }
  } catch (err) {
    console.error("Test failed:", err.message);
  }
}

testAnify();
