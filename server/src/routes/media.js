import { Router } from "express";
import axios from "axios";
import { fetchAnimeMetadata } from "../services/jikanClient.js";
import { META } from "@consumet/extensions";
import AnitakuProvider from "../services/anitakuProvider.js";
import { Readable } from "node:stream";
import { config } from "../config.js";
import { validateExternalMediaUrl } from "../utils/urlValidator.js";

const provider = new AnitakuProvider();
const hianime = new META.Anilist(provider);

export const mediaRouter = Router();

function buildServerUrl(request, pathname) {
  const origin = config.serverPublicUrl || `${request.protocol}://${request.get("host")}`;
  return new URL(pathname, `${origin}/`).toString();
}

function rewritePlaylist(playlistText, request, upstreamUrl, originalReferer) {
  const refererToUse = originalReferer || upstreamUrl;
  const lines = playlistText.split(/\r?\n/);
  const rewrittenLines = lines.map((line) => {
      if (line.startsWith("#") && line.includes('URI="')) {
        return line.replace(/URI="([^"]+)"/g, (_, uri) => {
          try {
            const target = new URL(uri, upstreamUrl).toString();
            const proxyUrl = buildServerUrl(
              request,
              `/api/playback/proxy?target=${encodeURIComponent(target)}&referer=${encodeURIComponent(refererToUse)}&originReferer=${encodeURIComponent(refererToUse)}`
            );
            return `URI="${proxyUrl}"`;
          } catch (e) {
            return `URI="${uri}"`;
          }
        });
      }

      if (!line || line.startsWith("#")) {
        return line;
      }

      try {
        const target = new URL(line, upstreamUrl).toString();
        return buildServerUrl(
          request,
          `/api/playback/proxy?target=${encodeURIComponent(target)}&referer=${encodeURIComponent(refererToUse)}&originReferer=${encodeURIComponent(refererToUse)}`
        );
      } catch (e) {
        return line;
      }
    });
    
    return rewrittenLines.join("\n");
}

const seasonMalIdCache = new Map();

mediaRouter.get("/shows/:showId", async (request, response) => {
  try {
    const { showId } = request.params;
    const isNumericId = /^\d+$/.test(showId);
    
    let info;
    if (isNumericId) {
      console.log(`[Media] Fetching info for numeric ID: ${showId}`);
      try {
        info = await hianime.fetchAnimeInfo(showId);
      } catch (e) {
        console.warn(`[Media] Anilist fetch failed for ${showId}, will try fallback if possible.`);
      }
    } else {
      console.log(`[Media] Fetching info for direct ID: ${showId}`);
      info = await provider.fetchAnimeInfo(showId);
    }

    // Fallback logic for numeric IDs that return 0 episodes or fail
    if (isNumericId && (!info || !info.episodes || info.episodes.length === 0)) {
        const title = request.query.title;
        if (title) {
            console.log(`[Media] Fallback: Searching provider for title "${title}"`);
            const searchResults = await provider.search(title);
            if (searchResults.results.length > 0) {
                const bestMatch = searchResults.results[0];
                console.log(`[Media] Fallback: Found match "${bestMatch.title}" with ID ${bestMatch.id}`);
                const fallbackInfo = await provider.fetchAnimeInfo(bestMatch.id);
                if (fallbackInfo && fallbackInfo.episodes && fallbackInfo.episodes.length > 0) {
                    // Merge fallback episodes while keeping original metadata if it exists
                    if (!info) {
                        info = fallbackInfo;
                    } else {
                        info.episodes = fallbackInfo.episodes;
                        // Use fallback ID for episodes to ensure playback works
                        info.id = fallbackInfo.id; 
                    }
                }
            }
        }
    }

    // Generate dummy episodes if still empty, so torrent provider can be used
    if (info && (!info.episodes || info.episodes.length === 0)) {
        const maxEp = info.totalEpisodes || (info.nextAiringEpisode ? info.nextAiringEpisode.episode - 1 : 0);
        if (maxEp > 0) {
            info.episodes = [];
            for (let i = 1; i <= maxEp; i++) {
                // we'll pass the title as ID so the torrent provider can parse it, or we just pass the anime title + episode
                const safeTitle = (typeof info.title === "string" ? info.title : info.title?.english || info.title?.romaji || "Anime").replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "-");
                info.episodes.push({
                    id: `${safeTitle}-episode-${i}`,
                    number: i,
                    title: `Episode ${i}`
                });
            }
        }
    }

    if (!info || (!info.title && !info.id)) {
      return response.status(404).json({ message: "Anime details not found." });
    }
    
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
    console.error("Consumet info error:", error.message);
    response.status(500).json({ message: "Failed to fetch anime info." });
  }
});

mediaRouter.get("/playback/proxy", async (request, response, next) => {
  try {
    let target = String(request.query.target || "");
    
    try {
      target = validateExternalMediaUrl(target);
    } catch (err) {
      return response.status(400).json({ message: err.message || "Invalid proxy target." });
    }

    const rawReferer = request.query.referer || "https://anineko.to/";
    const originalReferer = request.query.originReferer || rawReferer;
    
    // Clean referer (strip query params for segment requests to keep headers small)
    let referer = rawReferer;
    try {
        const refUrl = new URL(rawReferer);
        if (target.includes("byteimg") || target.includes("ibyteimg")) {
            referer = refUrl.origin + refUrl.pathname;
        }
    } catch (e) {}

    let origin;
    try {
        origin = new URL(referer).origin;
    } catch (e) {
        origin = "https://anineko.to";
    }

    const headers = {
        "User-Agent": request.headers["user-agent"] || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": referer,
        "Origin": origin,
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
    };

    if (request.headers.range) {
        headers["Range"] = request.headers.range;
    }

    try {
        const upstream = await fetch(target, { 
            headers,
            redirect: 'follow'
        });

        if (!upstream.ok && upstream.status !== 206) {
          console.error(`[Proxy] Upstream failed: ${upstream.status} ${upstream.statusText} for ${target.substring(0, 80)}`);
          return response.status(upstream.status).send(upstream.statusText);
        }

        const contentType = upstream.headers.get("content-type") || "";
        const isPlaylist = contentType.includes("mpegurl") || target.toLowerCase().includes(".m3u8");

        if (isPlaylist) {
          const playlistText = await upstream.text();
          console.log(`[Proxy] Rewriting playlist: ${target.substring(0, 60)}... (${playlistText.length} bytes)`);
          response.setHeader("content-type", "application/vnd.apple.mpegurl");
          response.setHeader("Access-Control-Allow-Origin", "*");
          return response.send(rewritePlaylist(playlistText, request, upstream.url, originalReferer));
        }

        response.status(upstream.status);

        const forwardedHeaders = [
          "content-type",
          "content-length",
          "accept-ranges",
          "content-range",
          "cache-control",
          "last-modified",
          "etag"
        ];

        for (const header of forwardedHeaders) {
          let value = upstream.headers.get(header);
          if (value) {
            // Fix for "fake" image segments or octet-streams
            if (header === "content-type") {
                const isSegment = target.includes("byteimg") || target.includes("ibyteimg") || target.includes(".ts") || target.includes("segment");
                if (isSegment && (value.includes("image") || value.includes("application/octet-stream") || value.includes("text/plain"))) {
                    value = "video/mp2t";
                }
            }
            response.setHeader(header, value);
          }
        }
        
        response.setHeader("Access-Control-Allow-Origin", "*");

        if (upstream.body) {
            const { Readable } = await import("node:stream");
            Readable.fromWeb(upstream.body).pipe(response);
        } else {
            response.end();
        }
    } catch (err) {
        console.error(`[Proxy] Fetch error for ${target.substring(0, 50)}:`, err.message);
        if (!response.headersSent) {
            response.status(500).send("Proxy fetch error");
        }
    }
  } catch (error) {
    console.error(`[Proxy] Critical error:`, error.message);
    if (!response.headersSent) {
      response.status(500).json({ message: "Proxy error" });
    }
  }
});

mediaRouter.get("/skip-times/:malId/:episodeNumber", async (request, response, next) => {
  let targetMalId;
  try {
    const { malId, episodeNumber } = request.params;
    const { showName, seasonNumber } = request.query;

    targetMalId = malId;
    
    if (malId === "0" && showName) {
      const cacheKey = `${showName}`;
      if (seasonMalIdCache.has(cacheKey)) {
        targetMalId = seasonMalIdCache.get(cacheKey);
      } else {
        const metadata = await fetchAnimeMetadata(showName);
        if (metadata && metadata.malId) {
          targetMalId = metadata.malId;
          seasonMalIdCache.set(cacheKey, targetMalId);
        }
      }
    } else if (showName && seasonNumber && Number(seasonNumber) > 1) {
      const cacheKey = `${showName}_Season_${seasonNumber}`;
      if (seasonMalIdCache.has(cacheKey)) {
        targetMalId = seasonMalIdCache.get(cacheKey);
      } else {
        const metadata = await fetchAnimeMetadata(`${showName} Season ${seasonNumber}`);
        if (metadata && metadata.malId) {
          targetMalId = metadata.malId;
          seasonMalIdCache.set(cacheKey, targetMalId);
        }
      }
    }

    if (!targetMalId || targetMalId === "0" || targetMalId === 0) {
      console.log(`[SkipTimes] No valid MAL ID found for episode ${episodeNumber}, skipping API call.`);
      return response.json({ found: false, results: [] });
    }

    console.log(`[SkipTimes] Fetching skip times for MAL ID ${targetMalId}, Episode ${episodeNumber}`);
    const { data } = await axios.get(
      `https://api.aniskip.com/v2/skip-times/${targetMalId}/${episodeNumber}?types=op&types=ed&episodeLength=0`
    );
    response.json(data);
  } catch (error) {
    if (error.response?.status === 404 || error.response?.status === 400) {
      console.log(`[SkipTimes] No skip times found (404/400) for MAL ID ${targetMalId}`);
      response.json({ found: false, results: [] });
    } else {
      console.error(`[SkipTimes] Error fetching skip times:`, error.message);
      next(error);
    }
  }
});
