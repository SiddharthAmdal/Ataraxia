import axios from 'axios';
import { load } from 'cheerio';
import { AnimeParser, SubOrSub } from '@consumet/extensions/dist/models/index.js';

class AnitakuProvider extends AnimeParser {
    constructor() {
        super();
        this.name = 'Anitaku';
        this.baseUrl = 'https://anineko.to';
        this.logo = 'https://anineko.to/img/logo.png';
        this.classPath = 'ANIME.Anitaku';
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
            }
        });
    }

    async search(query, page = 1) {
        try {
            const { data } = await this.client.get(`/browser?keyword=${encodeURIComponent(query)}&page=${page}`);
            const $ = load(data);
            const results = [];
            $('article.nv-anime-card').each((i, el) => {
                const title = $(el).find('.nv-anime-title a').text().trim();
                const href = $(el).find('.nv-anime-title a').attr('href');
                const id = href.replace('/watch/', '');
                const image = $(el).find('.nv-anime-thumb img').attr('src');
                const url = `${this.baseUrl}/watch/${id}`;
                results.push({ id, title, image, url });
            });
            return {
                currentPage: page,
                hasNextPage: $('.pagination li.next').length > 0 || $('.nv-pagination li.next').length > 0,
                results
            };
        } catch (err) {
            throw new Error(`Anitaku search failed: ${err.message}`);
        }
    }

    async fetchRecentEpisodes(page = 1) {
        try {
            const { data } = await this.client.get(`/updates?page=${page}`);
            const $ = load(data);
            const results = [];
            $('article.nv-anime-card').each((i, el) => {
                const title = $(el).find('.nv-anime-title a').text().trim();
                const href = $(el).find('.nv-anime-title a').attr('href');
                const baseId = href.replace('/watch/', '');
                
                const epText = $(el).find('.nv-stat-cc').text().trim().replace('CC', '').trim();
                const episodeNumber = parseInt(epText) || 1;
                
                // Construct episodeId to point directly to the latest episode
                const episodeId = `${baseId}/ep-${episodeNumber}`;
                const id = baseId;
                
                const image = $(el).find('.nv-anime-thumb img').attr('src');
                const url = `${this.baseUrl}/watch/${episodeId}`;
                results.push({ id, episodeId, episodeNumber, title, image, url });
            });
            return {
                currentPage: page,
                hasNextPage: $('.pagination li.next').length > 0 || $('.nv-pagination li.next').length > 0,
                results
            };
        } catch (err) {
            throw new Error(`Anitaku fetchRecentEpisodes failed: ${err.message}`);
        }
    }

    async fetchAnimeInfo(id) {
        if (!id || typeof id !== 'string') {
            console.error(`[Anitaku] Invalid ID passed to fetchAnimeInfo:`, id);
            return { id: '', title: 'Unknown', episodes: [] };
        }
        try {
            const cleanId = id.startsWith('/') ? id.substring(1) : id;
            // id could be 'one-piece' or 'one-piece/ep-1'
            const animeId = cleanId.split('/')[0];
            const { data } = await this.client.get(`/watch/${animeId}`);
            const $ = load(data);
            const info = {
                id: animeId,
                title: $('.nv-info-main h1').text().trim(),
                image: $('.nv-info-poster img').attr('src'),
                genres: [],
                episodes: []
            };

            $('.nv-info-genres span').each((i, el) => {
                info.genres.push($(el).text().trim());
            });

            // Parse episodes
            $('article.nv-info-episode-item').each((i, el) => {
                const href = $(el).find('.nv-info-episode-main').attr('href');
                const epId = href.replace('/watch/', '');
                const numberStr = $(el).find('strong').text().replace('Episode', '').replace('EP', '').trim();
                const number = parseInt(numberStr);
                
                info.episodes.push({
                    id: epId,
                    number: isNaN(number) ? i + 1 : number,
                    url: `${this.baseUrl}/watch/${epId}`
                });
            });

            // Sort episodes by number ascending
            info.episodes.sort((a, b) => a.number - b.number);

            return info;
        } catch (err) {
            throw new Error(`Anitaku fetchAnimeInfo failed: ${err.message}`);
        }
    }

    async fetchEpisodeSources(episodeId, subOrDub = SubOrSub.SUB) {
        try {
            let data;
            try {
                const response = await this.client.get(`/watch/${episodeId}`);
                data = response.data;
            } catch (err) {
                if (err.response?.status === 404 && episodeId.includes('-episode-')) {
                    console.log(`[Anitaku] 404 for legacy ID ${episodeId}, attempting migration...`);
                    // Legacy ID format: "one-piece-episode-1"
                    const parts = episodeId.split('-episode-');
                    const titleSlug = parts[0].replace(/-/g, ' ');
                    const epNum = parts[1];
                    
                    const searchResults = await this.search(titleSlug);
                    if (searchResults.results.length > 0) {
                        const animeId = searchResults.results[0].id;
                        const info = await this.fetchAnimeInfo(animeId);
                        const targetEp = info.episodes.find(e => e.number.toString() === epNum);
                        if (targetEp) {
                            console.log(`[Anitaku] Migrated ${episodeId} -> ${targetEp.id}`);
                            const response = await this.client.get(`/watch/${targetEp.id}`);
                            data = response.data;
                        }
                    }
                }
                if (!data) throw err;
            }

            const $ = load(data);
            const sources = [];
            const subtitles = [];

            // AniNeko has tabs: tab_0 (HSUB), tab_1 (SUB), tab_2 (DUB)
            const tabMap = {
                'hsub': 'tab_0',
                'sub': 'tab_1',
                'dub': 'tab_2'
            };

            const targetTab = subOrDub === SubOrSub.DUB ? 'tab_2' : 'tab_1';
            const tabsToTry = [targetTab, 'tab_0', 'tab_1', 'tab_2'];

            const extractFromButtons = (selector) => {
                $(selector).each((i, el) => {
                    const name = $(el).text().trim().split('\n')[0].trim();
                    const url = $(el).attr('data-video');
                    if (!url) return;
                    
                    const absoluteUrl = url.startsWith('http') ? url : `https:${url}`;
                    try {
                        const urlObj = new URL(absoluteUrl);
                        const subUrl = urlObj.searchParams.get('sub') || urlObj.searchParams.get('caption_1') || urlObj.searchParams.get('caption');
                        const subLang = urlObj.searchParams.get('sub_1') || urlObj.searchParams.get('lang') || 'English';

                        if (subUrl && !subtitles.some(s => s.url === subUrl)) {
                            subtitles.push({ url: subUrl, lang: subLang });
                        }
                    } catch (e) {
                        // ignore malformed URLs
                    }
                    
                    sources.push({
                        url: absoluteUrl,
                        quality: name || 'default',
                        isM3U8: absoluteUrl.includes('.m3u8')
                    });
                });
            };

            for (const tab of tabsToTry) {
                extractFromButtons(`.nv-server-btn[data-tab="${tab}"]`);
                if (sources.length > 0) break;
            }

            if (sources.length === 0) {
                extractFromButtons(`.nv-server-btn`);
            }

            // Enhanced extraction: for VibePlayer links, try to get the direct .m3u8
            for (const source of sources) {
                if (source.url.includes('vibeplayer.site') || source.url.includes('vibe.sh') || source.url.includes('animeplay.cc')) {
                    try {
                        console.log(`[Anitaku] Attempting direct extraction from: ${source.url}`);
                        const { data: playerHtml } = await axios.get(source.url, {
                            headers: { 
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                                'Referer': 'https://anineko.to/'
                            },
                            timeout: 5000
                        });
                        
                        const m3u8Match = playerHtml.match(/const src = ["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/) || 
                                          playerHtml.match(/file: ["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/) ||
                                          playerHtml.match(/source: ["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/);

                        if (m3u8Match) {
                            console.log(`[Anitaku] Extracted direct m3u8: ${m3u8Match[1]}`);
                            sources.unshift({
                                url: m3u8Match[1],
                                embedUrl: source.url,
                                quality: 'default',
                                isM3U8: true
                            });
                            break; 
                        }
                    } catch (e) {
                        console.warn(`[Anitaku] Failed to extract direct m3u8 from ${source.url}: ${e.message}`);
                    }
                }
            }

            return {
                sources,
                subtitles,
                headers: {
                    Referer: `${this.baseUrl}/watch/${episodeId}`,
                    'User-Agent': 'Mozilla/5.0'
                }
            };
        } catch (err) {
            throw new Error(`Anitaku fetchEpisodeSources failed: ${err.message}`);
        }
    }
}

export default AnitakuProvider;
