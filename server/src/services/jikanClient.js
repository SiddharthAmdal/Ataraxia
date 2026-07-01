import axios from "axios";
import { config } from "../config.js";

const jikan = axios.create({
  baseURL: config.jikanBaseUrl,
  timeout: 12000
});

export async function fetchAnimeMetadata(title) {
  if (!title) {
    return null;
  }

  try {
    const { data } = await jikan.get("/anime", {
      params: {
        q: title,
        limit: 5
      }
    });

    let match = data.data?.[0];

    const seasonMatch = title.match(/Season\s+(\d+)/i);
    if (seasonMatch && data.data) {
      const num = seasonMatch[1];
      const suffixes = { '1': '1st', '2': '2nd', '3': '3rd' };
      const suffix = suffixes[num] || `${num}th`;
      
      const exactMatch = data.data.find(anime => {
        const titles = [
          anime.title_english,
          anime.title,
          ...(anime.titles?.map(t => t.title) || []),
          ...(anime.title_synonyms || [])
        ].filter(Boolean).map(t => t.toLowerCase());
        
        return titles.some(t => 
          t.includes(`season ${num}`) || 
          t.includes(`${suffix} season`)
        );
      });
      
      if (exactMatch) {
        match = exactMatch;
      }
    }

    if (!match) {
      return null;
    }

    return {
      malId: match.mal_id,
      title: match.title,
      synopsis: match.synopsis || "",
      score: match.score || undefined,
      genres: (match.genres || []).map((genre) => genre.name),
      trailerUrl: match.trailer?.url || undefined,
      imageUrl: match.images?.jpg?.large_image_url || undefined
    };
  } catch {
    return null;
  }
}

export async function fetchUserWatchlist(username) {
  try {
    // Jikan v4 /users/{username}/animelist is often 404. Using MAL direct json instead.
    const { data } = await axios.get(`https://myanimelist.net/animelist/${username}/load.json`, {
      params: {
        offset: 0,
        status: 7 // all
      }
    });
    
    return data.map(item => {
      let status = "planned";
      if (item.status === 1) status = "watching";
      if (item.status === 2) status = "completed";
      if (item.status === 3) status = "on_hold";
      if (item.status === 4) status = "dropped";

      return {
        animeId: item.anime_id.toString(),
        title: item.anime_title_eng || item.anime_title,
        image: item.anime_image_path ? item.anime_image_path.replace(/\/r\/\d+x\d+/, '') : null,
        status,
        updatedAt: new Date().toISOString()
      };
    });
  } catch (err) {
    console.error("MAL Fetch failed:", err.message);
    throw new Error(`Failed to fetch MAL list for user ${username}`);
  }
}
