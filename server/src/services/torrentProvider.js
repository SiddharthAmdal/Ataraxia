import { si } from 'nyaapi';
import WebTorrent from 'webtorrent';
import { config } from '../config.js';
const client = new WebTorrent();

export class TorrentProvider {
    constructor() {
        this.name = 'Torrent';
    }

    async fetchEpisodeSources(episodeId, showName = null) {
        // episodeId is typically something like "one-piece-episode-1000" or "223-episode-1"
        let title = showName || episodeId.replace(/-episode-\d+$/, '').replace(/-/g, ' ');
        let epNum = episodeId.match(/-episode-(\d+)$/)?.[1] || "1";
        
        // If it's a numeric ID (like Anilist ID), this won't work well,
        // but typically streaming routes pass the provider's episodeId.
        // Let's refine the search query:
        let padEp = epNum.length === 1 ? `0${epNum}` : epNum;
        const query = `${title} ${padEp} 1080p`;
        console.log(`[TorrentProvider] Searching Nyaa for: ${query}`);

        // category '1_2' is Anime - English-translated
        // Fetch up to 50 results to ensure we have a good pool to sort by seeders, especially for older seasons
        const results = await si.search(query, 50, { category: '1_2' });
        
        // Sort by seeders to get the most reliable torrents first
        results.sort((a, b) => parseInt(b.seeders) - parseInt(a.seeders));

        // Avoid batches (e.g., 01-12, 1-17, ~ 12, Batch, Complete)
        const isNotBatch = (r) => !/\b\d{1,3}\s*-\s*\d{2,4}\b/.test(r.name) && !/batch/i.test(r.name) && !/~\s*\d{2,3}/.test(r.name) && !/complete/i.test(r.name);
        
        // Browsers cannot natively stream HEVC/x265/10bit/av1 via byte-range requests universally.
        const isBrowserCompatible = (r) => !/hevc/i.test(r.name) && !/x265/i.test(r.name) && !/10-?bit/i.test(r.name) && !/av1/i.test(r.name);

        // Ensure the torrent explicitly specifies the exact episode number we are searching for
        const epRegex = new RegExp(`(?:\\b|e|ep|_|s\\d{1,2}e|-)0*${epNum}(?:v\\d)?\\b`, 'i');
        const isEpisodeMatch = (r) => epRegex.test(r.name);

        // Prevent cross-season pollution (e.g., Season 1 matching S02 or S03 torrents)
        const isSeasonMatch = (r) => {
            const s2Regex = /(?:s0?2|2nd season|season 2)/i;
            const s3Regex = /(?:s0?3|3rd season|season 3)/i;
            const s4Regex = /(?:s0?4|4th season|season 4)/i;
            if (!s2Regex.test(title) && s2Regex.test(r.name)) return false;
            if (!s3Regex.test(title) && s3Regex.test(r.name)) return false;
            if (!s4Regex.test(title) && s4Regex.test(r.name)) return false;
            
            // Reject movies if the show isn't a movie
            if (!/movie/i.test(title) && /(?:movie|gekijouban)/i.test(r.name)) return false;

            // Reject subtitled sequel arcs (e.g. "Jujutsu Kaisen: Shimetsu Kaiyuu") if the base title has no colon
            if (!title.includes(':') && r.name.includes(':')) return false;

            // Franchise pollution: explicit blocks for massive franchises where sequels overwhelm the base show
            if (/^Dragon Ball$/i.test(title) && /(?:Daima|Z|GT|Super|Kai)\b/i.test(r.name)) return false;
            if (/^Naruto$/i.test(title) && /Shippuden/i.test(r.name)) return false;

            return true;
        };

        const hardValid = (r) => {
            return isNotBatch(r) && isBrowserCompatible(r) && isEpisodeMatch(r) && isSeasonMatch(r);
        };

        const validCandidates = results.filter(hardValid);

        if (validCandidates.length === 0) {
            throw new Error(`No valid torrent candidates found for ${query}`);
        }

        // Score candidates: give a massive boost to trusted release groups
        // so a 10-seeder SubsPlease beats a 50-seeder unknown group.
        const score = (r) => {
            let s = parseInt(r.seeders) || 0;
            if (r.name.includes('[SubsPlease]') || r.name.includes('[Erai-raws]')) {
                s += 10000;
            }
            return s;
        };

        validCandidates.sort((a, b) => score(b) - score(a));
        const bestMatch = validCandidates[0];

        if (!bestMatch) {
            throw new Error(`No torrent found for ${query}`);
        }

        console.log(`[TorrentProvider] Found torrent: ${bestMatch.name}`);

        return {
            sources: [
                {
                    url: `${config.serverPublicUrl}/api/streaming/torrent/stream?magnet=${encodeURIComponent(bestMatch.magnet)}&torrentUrl=${encodeURIComponent(bestMatch.torrent)}`,
                    quality: '1080p',
                    isM3U8: false
                }
            ],
            subtitles: [] // Subs are usually burned-in or included in the mkv
        };
    }
}
