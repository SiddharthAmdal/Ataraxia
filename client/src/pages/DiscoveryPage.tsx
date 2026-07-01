import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/http";
import { getWatchlist, updateWatchlist } from "../services/mediaApi";
import type { WatchlistItem, WatchlistStatus } from "../types/media";
import { motion, AnimatePresence } from "framer-motion";

interface StreamingResult {
  id: string;
  title: string;
  url: string;
  image: string;
  releaseDate: string;
  subOrDub: string;
}

interface Episode {
  id: string;
  number: number;
  url: string;
}

interface AnimeMetadata {
  title: string;
  synopsis: string;
  imageUrl: string;
  genres: string[];
  score: number;
  relations?: any[];
}

export function DiscoveryPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StreamingResult[]>([]);
  const [suggestions, setSuggestions] = useState<StreamingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedAnime, setSelectedAnime] = useState<StreamingResult | null>(null);
  const [metadata, setMetadata] = useState<AnimeMetadata | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoadingDetails, setIsLoadingEpisodes] = useState(false);
  const [watchlistStatus, setWatchlistStatus] = useState<WatchlistStatus>("removed");
  const [updatingWatchlist, setUpdatingWatchlist] = useState(false);

  const navigate = useNavigate();

  // Debounced suggestion fetching
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length > 2) {
        try {
          const response = await api.get(`/streaming/search?q=${encodeURIComponent(query)}`);
          setSuggestions(response.data.results.slice(0, 5));
          setShowSuggestions(true);
        } catch (err) {
          console.error("Failed to fetch suggestions");
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setShowSuggestions(false);
    setError(null);
    setSelectedAnime(null);

    try {
      const response = await api.get(`/streaming/search?q=${encodeURIComponent(query)}`);
      setResults(response.data.results);
    } catch (err) {
      setError("Failed to fetch results from streaming provider.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSuggestion = (anime: StreamingResult) => {
    setQuery(anime.title);
    handleSelectAnime(anime);
    setShowSuggestions(false);
  };

  const handleSelectAnime = async (anime: StreamingResult) => {
    setSelectedAnime(anime);
    setIsLoadingEpisodes(true);
    setEpisodes([]);
    setMetadata(null);
    
    try {
      // 1. Fetch metadata and watchlist status
      const [epRes, watchlistData] = await Promise.all([
        api.get(`/streaming/episodes?id=${encodeURIComponent(anime.id)}&title=${encodeURIComponent(anime.title)}`),
        getWatchlist()
      ]);
      
      setEpisodes(epRes.data.episodes);
      
      // Look for match in watchlist
      const watchItem = watchlistData.find(item => item.animeId === anime.id);
      if (watchItem) setWatchlistStatus(watchItem.status);
      else setWatchlistStatus("removed");

      const info = epRes.data.info;
      if (info) {
        setMetadata({
          title: typeof info.title === "string" ? info.title : info.title?.english || info.title?.romaji || info.title?.userPreferred || anime.title,
          synopsis: (info.description || "").replace(/<[^>]*>?/gm, '') || "No description available.",
          imageUrl: info.image || anime.image,
          genres: info.genres || [],
          score: info.rating || 0,
          relations: (info.relations || []).map((rel: any) => ({
            id: String(rel.id),
            relationType: rel.relationType,
            title: typeof rel.title === "string" ? rel.title : rel.title?.english || rel.title?.romaji || rel.title?.userPreferred || "Unknown Title",
            image: rel.image,
            type: rel.type
          }))
        });
      } else {
        setMetadata({
          title: anime.title,
          synopsis: "This anime is available for streaming via external providers. Select an episode below to start watching.",
          imageUrl: anime.image,
          genres: [],
          score: 0
        });
      }
      
    } catch (err) {
      setError("Failed to fetch details.");
    } finally {
      setIsLoadingEpisodes(false);
    }
  };

  const handleWatchlistChange = async (status: WatchlistStatus) => {
    if (!selectedAnime) return;
    setUpdatingWatchlist(true);
    try {
      await updateWatchlist(selectedAnime.id, {
        status,
        title: selectedAnime.title,
        image: selectedAnime.image
      });
      setWatchlistStatus(status);
    } catch (err) {
      console.error("Failed to update watchlist", err);
    } finally {
      setUpdatingWatchlist(false);
    }
  };

  const handleWatchEpisode = (episodeId: string) => {
    if (!selectedAnime) return;
    navigate(`/shows/external/watch/${encodeURIComponent(episodeId)}?source=external&animeId=${encodeURIComponent(selectedAnime.id)}&title=${encodeURIComponent(selectedAnime.title)}`);
  };

  return (
    <div className="space-y-8 min-h-[80vh]">
      <AnimatePresence mode="wait">
        {!selectedAnime ? (
          <motion.div 
            key="search"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="text-center max-w-2xl mx-auto mt-8">
              <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">Discover & Stream</h2>
              <p className="text-slate-400">
                Search the vast global anime database and instantly stream episodes via high-speed external servers.
              </p>
            </div>

            <form onSubmit={handleSearch} className="max-w-3xl mx-auto relative group">
              <div className="flex gap-4 w-full">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => query.trim().length > 2 && setShowSuggestions(true)}
                  placeholder="Search for an anime..."
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-white placeholder:text-slate-500 focus:border-accent focus:outline-none transition-all shadow-glow"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="rounded-2xl bg-accent px-8 py-4 font-bold text-white transition-all hover:bg-accentSoft disabled:opacity-50 shadow-lg shadow-accent/20"
                >
                  {isSearching ? "Searching..." : "Search"}
                </button>
              </div>

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 z-50 glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
                  >
                    {suggestions.map((anime) => (
                      <button
                        key={anime.id}
                        type="button"
                        onClick={() => handleSelectSuggestion(anime)}
                        className="w-full flex items-center gap-4 p-3 hover:bg-white/10 transition-colors text-left border-b border-white/5 last:border-0"
                      >
                        <img 
                          src={anime.image} 
                          alt={anime.title} 
                          className="w-10 h-14 object-cover rounded-lg bg-slate-800"
                        />
                        <div>
                          <p className="text-sm font-semibold text-white line-clamp-1">{anime.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{anime.releaseDate || 'TV Series'}</p>
                        </div>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleSearch()}
                      className="w-full p-3 text-center text-xs font-bold text-accent hover:text-white transition-colors bg-accent/5"
                    >
                      See all results for "{query}"
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            {error && (
              <div className="max-w-3xl mx-auto p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-center text-sm font-medium">
                {error}
              </div>
            )}

            {results.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 max-w-7xl mx-auto">
                {results.map((anime) => (
                  <motion.div 
                    layout
                    key={anime.id} 
                    className="group cursor-pointer flex flex-col gap-3"
                    onClick={() => handleSelectAnime(anime)}
                  >
                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[2rem] bg-white/5 border border-white/10 transition-all group-hover:border-accent/50 shadow-xl group-hover:scale-[1.02]">
                      <img 
                        src={anime.image} 
                        alt={anime.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <span className="bg-accent text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">Explore</span>
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-200 line-clamp-2 group-hover:text-accent transition-colors px-1">
                      {anime.title}
                    </h3>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-7xl mx-auto"
          >
            <button 
              onClick={() => setSelectedAnime(null)}
              className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to results
            </button>
            
            <div className="grid gap-12 lg:grid-cols-[300px_1fr]">
              {/* Sidebar/Poster */}
              <div className="space-y-6">
                <div className="aspect-[2/3] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl">
                  <img src={selectedAnime.image} alt={selectedAnime.title} className="w-full h-full object-cover" />
                </div>
                
                <div className="glass-panel p-6 rounded-3xl space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accentSoft">Watchlist status</p>
                  <div className="flex flex-col gap-2">
                    {(["watching", "completed", "planned", "on_hold", "dropped", "removed"] as WatchlistStatus[]).map((status) => (
                      <button
                        key={status}
                        disabled={updatingWatchlist}
                        onClick={() => handleWatchlistChange(status)}
                        className={`w-full px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                          watchlistStatus === status
                            ? "bg-accent border-accent text-white shadow-lg shadow-accent/20"
                            : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
                        } disabled:opacity-50`}
                      >
                        {status === "removed" 
                          ? "Not in list" 
                          : status === "planned" 
                          ? "Plan to watch" 
                          : status === "on_hold"
                          ? "On Hold"
                          : status === "dropped"
                          ? "Dropped"
                          : status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Info */}
              <div className="space-y-12">
                <div className="space-y-4">
                  <h1 className="text-5xl font-black text-white tracking-tight leading-tight">
                    {selectedAnime.title}
                  </h1>
                  <p className="text-lg text-slate-300 leading-relaxed max-w-3xl">
                    {metadata?.synopsis || "This anime is available for streaming via external providers. Select an episode below to start watching."}
                  </p>
                </div>

                {metadata?.relations && metadata.relations.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-accentSoft">Related Seasons</p>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                      {metadata.relations.map((rel: any) => (
                        <button
                          key={rel.id}
                          onClick={() => {
                            setQuery(rel.title);
                            handleSelectAnime(rel as any);
                          }}
                          className="flex-shrink-0 w-32 group text-left"
                        >
                          <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden border border-white/10 relative">
                            <img 
                              src={rel.image} 
                              alt={rel.title}
                              className="w-full h-full object-cover transition duration-300 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                              <span className="text-[10px] text-white font-bold uppercase tracking-wider">{rel.relationType}</span>
                            </div>
                          </div>
                          <p className="mt-2 text-[10px] font-medium text-slate-400 line-clamp-2 group-hover:text-white transition-colors">
                            {rel.title}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="glass-panel p-10 rounded-[2.5rem] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-accent" />
                  <h3 className="text-2xl font-bold text-white mb-8">Select Episode</h3>
                  
                  {isLoadingDetails ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-10 h-10 rounded-full border-4 border-accent border-t-transparent animate-spin" />
                    </div>
                  ) : episodes.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                      {episodes.map((ep) => (
                        <button
                          key={ep.id}
                          onClick={() => handleWatchEpisode(ep.id)}
                          className="aspect-square flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:bg-accent hover:text-white hover:border-accent hover:shadow-glow transition-all font-bold text-sm"
                        >
                          {ep.number}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400">No episodes found.</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
