import { Router } from "express";
import { META, ANIME } from "@consumet/extensions";
import https from "https";
import AnitakuProvider from "../services/anitakuProvider.js";

export const streamingRouter = Router();

// Use Anitaku (GogoAnime mirror) as the provider for Anilist meta aggregator
// It's not blocked by ISP and provides English content/subtitles
const provider = new AnitakuProvider();
const hianime = new META.Anilist(provider);

streamingRouter.get("/streaming/trending", async (request, response) => {
  try {
    console.log("[Streaming] Fetching trending anime...");
    const data = await hianime.fetchTrendingAnime();
    if (data && data.results) {
      data.results = data.results.map(anime => ({
        ...anime,
        title: typeof anime.title === "string" 
          ? anime.title 
          : anime.title?.english || anime.title?.romaji || anime.title?.userPreferred || "Unknown Title"
      }));
    }
    response.json(data || { results: [] });
  } catch (error) {
    console.error("Consumet trending error:", error);
    response.json({ results: [], message: "Trending currently unavailable." });
  }
});

streamingRouter.get("/streaming/popular", async (request, response) => {
  try {
    console.log("[Streaming] Fetching popular anime...");
    const data = await hianime.fetchPopularAnime();
    if (data && data.results) {
      data.results = data.results.map(anime => ({
        ...anime,
        title: typeof anime.title === "string" 
          ? anime.title 
          : anime.title?.english || anime.title?.romaji || anime.title?.userPreferred || "Unknown Title"
      }));
    }
    response.json(data || { results: [] });
  } catch (error) {
    console.error("Consumet popular error:", error);
    response.json({ results: [], message: "Popular currently unavailable." });
  }
});

streamingRouter.get("/streaming/recent", async (request, response) => {
  try {
    console.log("[Streaming] Fetching recent episodes...");
    const data = await provider.fetchRecentEpisodes();
    if (data && data.results) {
      data.results = data.results.map(anime => ({
        ...anime,
        title: typeof anime.title === "string" 
          ? anime.title 
          : anime.title?.english || anime.title?.romaji || anime.title?.userPreferred || "Unknown Title"
      }));
    }
    response.json(data || { results: [] });
  } catch (error) {
    console.error("Consumet recent error:", error);
    response.json({ results: [], message: "Recent episodes currently unavailable." });
  }
});

streamingRouter.get("/streaming/upcoming", async (request, response) => {
  try {
    console.log("[Streaming] Fetching upcoming anime...");
    const data = await hianime.fetchAiringSchedule();
    if (data && data.results) {
      data.results = data.results.map(anime => ({
        ...anime,
        title: typeof anime.title === "string" 
          ? anime.title 
          : anime.title?.english || anime.title?.romaji || anime.title?.userPreferred || "Unknown Title"
      }));
    }
    response.json(data || { results: [] });
  } catch (error) {
    console.error("Consumet upcoming error:", error);
    response.json({ results: [], message: "Upcoming schedule currently unavailable." });
  }
});

streamingRouter.get("/streaming/search", async (request, response) => {
  try {
    const { q } = request.query;
    console.log(`[Streaming] Search request: q=${q}`);
    if (!q) {
      return response.status(400).json({ message: "Search query is required" });
    }

    const results = await hianime.search(q);
    const flattenedResults = (results?.results || []).map(anime => ({
      ...anime,
      title: typeof anime.title === "string" 
        ? anime.title 
        : anime.title?.english || anime.title?.romaji || anime.title?.userPreferred || "Unknown Title"
    }));
    console.log(`[Streaming] Found ${flattenedResults.length} results for q=${q}`);
    response.json({ results: flattenedResults });
  } catch (error) {
    console.error("Consumet search error:", error);
    response.json({ results: [], message: "Search failed. Please try again later." });
  }
});

streamingRouter.get("/streaming/info", async (request, response) => {
  try {
    const { id } = request.query;
    if (!id) return response.status(400).json({ message: "Anime ID is required" });
    
    const info = await hianime.fetchAnimeInfo(id);
    
    // Ensure description doesn't have HTML tags if it comes from Anilist
    const cleanDescription = (info.description || "").replace(/<[^>]*>?/gm, '');

    // Map to ShowDetail format
    const showDetail = {
      show: {
        id: info.id,
        name: typeof info.title === "string" ? info.title : info.title?.english || info.title?.romaji || info.title?.userPreferred || "Unknown Title",
        overview: cleanDescription || "No description available.",
        imageUrl: info.image,
        backdropUrl: info.cover,
        genres: info.genres || [],
        communityRating: info.rating ? info.rating / 10 : undefined,
        productionYear: info.releaseDate
      },
      episodes: (info.episodes || []).map(ep => ({
        id: ep.id,
        name: ep.title || `Episode ${ep.number}`,
        indexNumber: ep.number,
        runtimeTicks: 0,
        overview: ep.description || ""
      })),
      metadata: {
        malId: info.malId,
        title: typeof info.title === "string" ? info.title : info.title?.english || info.title?.romaji || info.title?.userPreferred || "Unknown Title",
        synopsis: cleanDescription || "",
        score: info.rating,
        genres: info.genres || [],
        imageUrl: info.image,
        trailerUrl: info.trailer ? `https://www.youtube.com/watch?v=${info.trailer.id}` : undefined,
        relations: (info.relations || []).map(rel => ({
          id: String(rel.id),
          relationType: rel.relationType,
          title: typeof rel.title === "string" ? rel.title : rel.title?.english || rel.title?.romaji || rel.title?.userPreferred || "Unknown Title",
          image: rel.image,
          type: rel.type
        }))
      },
      relations: (info.relations || []).map(rel => ({
        id: String(rel.id),
        relationType: rel.relationType,
        title: typeof rel.title === "string" ? rel.title : rel.title?.english || rel.title?.romaji || rel.title?.userPreferred || "Unknown Title",
        image: rel.image,
        type: rel.type
      }))
    };
    
    response.json(showDetail);
  } catch (error) {
    console.error("Consumet info error:", error);
    response.status(500).json({ message: "Failed to fetch anime info." });
  }
});

streamingRouter.get("/streaming/episodes", async (request, response) => {
  try {
    const { id, title } = request.query;
    console.log(`[Streaming] Episodes request: id=${id}, title=${title}`);
    if (!id) {
      return response.status(400).json({ message: "Anime ID is required" });
    }

    let episodes = [];
    let info = null;
    
    const isNumericId = /^\d+$/.test(id);

    if (isNumericId) {
      try {
        console.log(`[Streaming] Fetching Anilist info for numeric ID: ${id}`);
        info = await hianime.fetchAnimeInfo(id);
        episodes = info.episodes || [];
      } catch (e) {
        console.warn(`[Streaming] Anilist info fetch failed for id=${id}, trying manual search fallback for title=${title}`);
      }
    } else {
      try {
        console.log(`[Streaming] Fetching Provider info for direct ID: ${id}`);
        info = await provider.fetchAnimeInfo(id);
        episodes = info.episodes || [];
      } catch (e) {
        console.warn(`[Streaming] Provider info fetch failed for direct id=${id}, trying manual search fallback for title=${title}`);
      }
    }

    if (episodes.length === 0 && title) {
      // Manual fallback: search the provider directly by title
      console.log(`[Streaming] Manual fallback search for title: ${title}`);
      const searchResults = await provider.search(title);
      if (searchResults.results.length > 0) {
        const firstMatch = searchResults.results[0];
        console.log(`[Streaming] Fallback found match: ${firstMatch.title} (ID: ${firstMatch.id})`);
        try {
          const manualInfo = await provider.fetchAnimeInfo(firstMatch.id);
          episodes = manualInfo.episodes || [];
          if (!info) info = manualInfo;
        } catch (e) {
          console.error(`[Streaming] Fallback info fetch failed for ${firstMatch.id}:`, e.message);
        }
      }
    }

    console.log(`[Streaming] Found ${episodes.length} episodes for id=${id}`);
    response.json({ episodes, info });
  } catch (error) {
    console.error("Consumet episodes error:", error);
    response.status(500).json({ message: "Failed to fetch episodes." });
  }
});

streamingRouter.get("/streaming/watch", async (request, response) => {
  try {
    const { episodeId, category = "sub" } = request.query;
    console.log(`[Streaming] Watch request: episodeId=${episodeId}, category=${category}`);
    
    if (!episodeId) {
      return response.status(400).json({ message: "Episode ID is required" });
    }

    let sources = null;
    try {
      // Try fetching via meta-aggregator first
      sources = await hianime.fetchEpisodeSources(episodeId, category);
    } catch (e) {
      console.warn(`[Streaming] Anilist source fetch failed for episodeId=${episodeId}`);
    }

    if (!sources || !sources.sources || sources.sources.length === 0) {
      console.warn(`[Streaming] Meta-aggregator returned no sources for episodeId=${episodeId}, trying direct provider`);
      // Try direct provider (Anitaku)
      try {
        sources = await provider.fetchEpisodeSources(episodeId);
      } catch (e2) {
        console.error(`[Streaming] Direct source fetch failed:`, e2);
      }
    }
    
    console.log(`[Streaming] Found ${sources?.sources?.length || 0} sources for episodeId=${episodeId}`);
    
    const defaultSource = sources?.sources?.find(s => s.quality === "default" || s.quality === "auto") || sources?.sources?.[0];

    if (!defaultSource) {
      console.warn(`[Streaming] No sources found for episodeId=${episodeId} (${category})`);
      return response.status(404).json({ message: "No streaming sources found for the selected audio type." });
    }

    console.log(`[Streaming] Success: Using source ${defaultSource.url}`);
    response.json({ 
      source: defaultSource.url,
      embedUrl: defaultSource.embedUrl,
      isM3U8: defaultSource.isM3U8,
      headers: sources.headers,
      subtitles: sources.subtitles || []
    });
  } catch (error) {
    console.error("Consumet watch error:", error);
    response.status(500).json({ message: "Failed to extract streaming source." });
  }
});

streamingRouter.get("/streaming/proxy", async (req, res) => {
  const { url, referer } = req.query;
  if (!url) {
    return res.status(400).send("URL is required");
  }

  const headers = {
    "Referer": referer || "https://anineko.to/",
    "User-Agent": req.headers["user-agent"] || "Mozilla/5.0"
  };

  if (req.headers.range) {
    headers["Range"] = req.headers.range;
  }

  try {
    const response = await fetch(url, { headers });
    
    // Copy headers from upstream response
    const forwardedHeaders = [
      "content-type",
      "content-length",
      "accept-ranges",
      "content-range",
      "cache-control"
    ];

    res.status(response.status);
    for (const header of forwardedHeaders) {
      const value = response.headers.get(header);
      if (value) {
        res.setHeader(header, value);
      }
    }

    if (response.body) {
      const { Readable } = await import("node:stream");
      Readable.fromWeb(response.body).pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    console.error("Proxy error:", err);
    if (!res.headersSent) {
      res.status(500).end();
    }
  }
});
