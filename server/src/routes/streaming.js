import { Router } from "express";
import { META, ANIME } from "@consumet/extensions";
import https from "https";
import axios from "axios";
import AnitakuProvider from "../services/anitakuProvider.js";
import { TorrentProvider } from "../services/torrentProvider.js";
import WebTorrent from "webtorrent";
import { validateExternalMediaUrl } from "../utils/urlValidator.js";
export const streamingRouter = Router();

const provider = new AnitakuProvider();
const torrentProvider = new TorrentProvider();
const hianime = new META.Anilist(provider);
const torrentClient = new WebTorrent();

torrentClient.on('error', (err) => {
  console.error('[WebTorrent Client Error]', err.message);
});

// Keep track of torrents currently being added to prevent duplicate add errors
const pendingTorrents = new Map();

function getOrAddTorrent(magnet, torrentUrl) {
  return new Promise((resolve, reject) => {
    const infoHashMatch = magnet.match(/urn:btih:([a-zA-Z0-9]+)/i);
    const infoHash = infoHashMatch ? infoHashMatch[1].toLowerCase() : null;
    console.log(`[Torrent] getOrAddTorrent called for infoHash: ${infoHash}`);
    
    let torrent = null;
    if (infoHash) {
      torrent = torrentClient.torrents.find(t => t.infoHash === infoHash);
    }
    
    if (torrent) {
      console.log(`[Torrent] Found existing torrent in client. ready=${torrent.ready}`);
      if (torrent.ready) return resolve(torrent);
      torrent.on('ready', () => {
        console.log(`[Torrent] Existing torrent became ready`);
        resolve(torrent);
      });
      return;
    }

    if (infoHash && pendingTorrents.has(infoHash)) {
      console.log(`[Torrent] Joining pending requests for ${infoHash}`);
      pendingTorrents.get(infoHash).push(resolve);
      return;
    }

    if (infoHash) {
      console.log(`[Torrent] Creating new pending queue for ${infoHash}`);
      pendingTorrents.set(infoHash, [resolve]);
    }
    
    const target = torrentUrl || magnet;
    console.log(`[Torrent] Calling torrentClient.add with ${target.substring(0, 50)}...`);
    torrentClient.add(target, (t) => {
      console.log(`[Torrent] torrentClient.add callback fired!`);
      if (infoHash) {
        const callbacks = pendingTorrents.get(infoHash) || [];
        pendingTorrents.delete(infoHash);
        callbacks.forEach(cb => cb(t));
      } else {
        resolve(t);
      }
    });
  });
}

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
        console.log(`[Streaming] Fetching Anilist info via GraphQL for numeric ID: ${id}`);
        const query = `
          query ($id: Int) {
            Media (id: $id, type: ANIME) {
              id
              title { romaji english native }
              episodes
              nextAiringEpisode { episode }
              coverImage { extraLarge large medium }
            }
          }
        `;
        const { data } = await axios.post('https://graphql.anilist.co', {
          query,
          variables: { id: parseInt(id, 10) }
        });
        const media = data.data.Media;
        if (media) {
          let epCount = media.episodes || 0;
          if (media.nextAiringEpisode && media.nextAiringEpisode.episode > 1) {
            epCount = Math.max(epCount, media.nextAiringEpisode.episode - 1);
          }
          if (epCount > 0) {
            episodes = Array.from({ length: epCount }, (_, i) => ({
              id: `${id}-episode-${i+1}`,
              number: i+1,
              title: `Episode ${i+1}`
            }));
          }
          info = {
            id,
            title: media.title.english || media.title.romaji || title,
            image: media.coverImage?.extraLarge || media.coverImage?.large,
            episodes
          };
        }
      } catch (e) {
        console.warn(`[Streaming] Anilist GraphQL fetch failed for id=${id}, trying manual search fallback for title=${title}`, e.message);
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
    let { episodeId, category = "sub", showName } = request.query;
    if (showName === "undefined") showName = undefined;
    console.log(`[Streaming] Watch request: episodeId=${episodeId}, category=${category}, showName=${showName}`);
    
    if (!episodeId) {
      return response.status(400).json({ message: "Episode ID is required" });
    }

    let sources = null;
    try {
      console.log(`[Streaming] Trying torrent provider first...`);
      if (!showName) {
        let baseName = episodeId.replace(/-episode-\d+$/, '').replace(/-/g, ' ').replace(/\btv\b/gi, '').trim();
        if (/^\d+$/.test(baseName)) {
            try {
                const query = `query ($id: Int) { Media (id: $id, type: ANIME) { title { english romaji } } }`;
                const { data } = await axios.post('https://graphql.anilist.co', { query, variables: { id: parseInt(baseName, 10) } });
                const media = data.data.Media;
                if (media) {
                    showName = media.title.english || media.title.romaji;
                }
            } catch (e) {
                console.warn(`[Streaming] Failed to resolve Anilist ID ${baseName} to title:`, e.message);
            }
        }
      }
      sources = await torrentProvider.fetchEpisodeSources(episodeId, showName);
    } catch (e) {
      console.warn(`[Streaming] Torrent source fetch failed:`, e.message);
    }

    if (!sources || !sources.sources || sources.sources.length === 0) {
      console.warn(`[Streaming] Torrent provider returned no sources for episodeId=${episodeId}, trying direct provider`);
      try {
        sources = await provider.fetchEpisodeSources(episodeId);
      } catch (e2) {
        console.warn(`[Streaming] Direct source fetch failed:`, e2.message);
      }
      
      if (!sources || !sources.sources || sources.sources.length === 0) {
        console.log(`[Streaming] Direct source empty, falling back to meta-aggregator...`);
        try {
          sources = await hianime.fetchEpisodeSources(episodeId, category);
        } catch (e3) {
          console.error(`[Streaming] Meta-aggregator fallback also failed:`, e3.message);
        }
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
  let { url, referer } = req.query;
  if (!url) {
    return res.status(400).send("URL is required");
  }

  try {
    url = validateExternalMediaUrl(String(url));
  } catch (err) {
    return res.status(400).send(err.message || "Invalid proxy URL.");
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

streamingRouter.get("/streaming/torrent/stream", async (req, res) => {
  const magnet = req.query.magnet;
  const torrentUrl = req.query.torrentUrl;
  if (!magnet) return res.status(400).send("Magnet link required");

  console.log(`[Torrent] Requesting stream for: ${magnet.substring(0, 40)}...`);
  try {
    const torrent = await getOrAddTorrent(magnet, torrentUrl);
    handleTorrentStream(torrent, req, res);
  } catch (err) {
    console.error(`[Torrent] Failed to add torrent:`, err.message);
    res.status(500).send("Failed to stream torrent");
  }
});

function handleTorrentStream(torrent, req, res) {
  if (!torrent.files || torrent.files.length === 0) {
    console.error("[Torrent] No files found in torrent!");
    return res.status(500).send("No files in torrent");
  }

  // Find largest file (the video)
  const file = torrent.files.reduce((a, b) => (a.length > b.length ? a : b));

  const contentType = file.name.endsWith('.mkv') ? 'video/webm' : 'video/mp4';

  const range = req.headers.range;
  if (!range) {
    res.writeHead(200, {
      "Content-Length": file.length,
      "Content-Type": contentType,
    });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    file.createReadStream().pipe(res);
    return;
  }

  const positions = range.replace(/bytes=/, "").split("-");
  const start = parseInt(positions[0], 10);
  const total = file.length;
  const end = positions[1] ? parseInt(positions[1], 10) : total - 1;
  const chunksize = end - start + 1;

  res.writeHead(206, {
    "Content-Range": `bytes ${start}-${end}/${total}`,
    "Accept-Ranges": "bytes",
    "Content-Length": chunksize,
    "Content-Type": contentType,
  });

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  const stream = file.createReadStream({ start, end });
  stream.pipe(res);
  
  stream.on('error', (err) => {
    console.error("[Torrent] Stream error:", err);
  });
}

