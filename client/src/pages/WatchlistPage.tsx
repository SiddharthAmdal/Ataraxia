import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getWatchlist, importFromMAL, getContinueWatching, deleteProgress } from "../services/mediaApi";
import type { WatchlistItem, ContinueWatchingItem } from "../types/media";
import { LoadingState } from "../components/LoadingState";
import { motion, AnimatePresence } from "framer-motion";
import { ContinueWatchingRail } from "../components/ContinueWatchingRail";
import { api } from "../lib/http";

export function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"watching" | "completed" | "planned" | "on_hold" | "dropped">("watching");
  const [showMalModal, setShowMalModal] = useState(false);
  const [malUsername, setMalUsername] = useState("");
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function loadData() {
    try {
      const [watchlistData, progressData] = await Promise.all([
        getWatchlist(),
        getContinueWatching()
      ]);
      setWatchlist(watchlistData);
      setContinueWatching(progressData);
    } catch (err) {
      console.error("Failed to load watchlist data", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleMalImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!malUsername) return;
    
    setImporting(true);
    setMessage(null);
    try {
      const res = await importFromMAL(malUsername);
      setMessage({ text: res.message, type: "success" });
      await loadData();
      setTimeout(() => setShowMalModal(false), 2000);
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || "Import failed", type: "error" });
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteProgress = async (itemId: string) => {
    try {
      await deleteProgress(itemId);
      setContinueWatching(prev => prev.filter(p => p.itemId !== itemId));
    } catch (err) {
      console.error("Failed to delete progress", err);
    }
  };

  const filteredList = watchlist.filter(item => item.status === activeTab);

  if (loading) return <LoadingState label="Loading your list..." />;

  const tabs = [
    { id: "watching", label: "Watching" },
    { id: "completed", label: "Completed" },
    { id: "planned", label: "Plan to Watch" },
    { id: "on_hold", label: "On Hold" },
    { id: "dropped", label: "Dropped" }
  ] as const;

  return (
    <motion.div 
      layout
      className="max-w-7xl mx-auto px-4 py-12 space-y-12"
    >
      <ContinueWatchingRail items={continueWatching} onDelete={handleDeleteProgress} />

      <motion.div layout>
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">My Watchlist</h1>
            <div className="flex gap-4 border-b border-white/10">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
                    activeTab === tab.id ? "text-accent" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={async () => {
                setLoading(true);
                try {
                  const res = await api.post("/watchlist/fix-ids");
                  setMessage({ text: res.data.message, type: "success" });
                  await loadData();
                } catch (err) {
                  setMessage({ text: "Failed to fix links", type: "error" });
                } finally {
                  setLoading(false);
                }
              }}
              className="flex items-center gap-2 px-6 py-3 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 rounded-2xl transition-all font-semibold"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Fix Incorrect Links
            </button>

            <button 
              onClick={() => setShowMalModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-600/30 rounded-2xl transition-all font-semibold"
            >
              <img src="https://myanimelist.net/favicon.ico" className="w-4 h-4" alt="MAL" />
              Sync MyAnimeList
            </button>
          </div>
        </header>

        {message && !showMalModal && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 p-4 rounded-xl text-sm font-medium ${
              message.type === "success" ? "bg-green-500/20 text-green-400 border border-green-500/20" : "bg-red-500/20 text-red-400 border border-red-500/20"
            }`}
          >
            {message.text}
            <button onClick={() => setMessage(null)} className="ml-4 text-xs underline">Dismiss</button>
          </motion.div>
        )}

        <AnimatePresence>
          {showMalModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl"
              >
                <h2 className="text-3xl font-bold text-white mb-2">Sync MAL</h2>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">Enter your MyAnimeList username to automatically import your watching, completed, planned, on hold, and dropped shows.</p>
                
                <form onSubmit={handleMalImport} className="space-y-6">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="MAL Username"
                      value={malUsername}
                      onChange={(e) => setMalUsername(e.target.value)}
                      className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-accent transition-colors"
                      autoFocus
                    />
                  </div>
                  
                  {message && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-xl text-sm font-medium ${
                        message.type === "success" ? "bg-green-500/20 text-green-400 border border-green-500/20" : "bg-red-500/20 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {message.text}
                    </motion.div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowMalModal(false)}
                      className="flex-1 px-6 py-4 text-slate-300 hover:bg-white/5 rounded-2xl transition-colors font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={importing || !malUsername}
                      className="flex-1 px-6 py-4 bg-accent text-white font-bold rounded-2xl disabled:opacity-50 transition-all hover:scale-[1.02] shadow-lg shadow-accent/20"
                    >
                      {importing ? "Syncing..." : "Start Sync"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {filteredList.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <p className="text-slate-400">No shows in this category yet.</p>
            <Link to="/discover" className="text-accent mt-4 inline-block hover:underline">
              Go discover something new
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredList.map((item) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                key={item.animeId}
                className="group relative"
              >
                <Link to={`/shows/${item.animeId}?title=${encodeURIComponent(item.title)}`} className="block">
                  <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-slate-800 border border-white/10 transition-transform duration-300 group-hover:scale-[1.02] group-hover:border-accent/50 shadow-lg">
                    <img
                      src={item.image || "/placeholder.png"}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <span className="text-xs font-bold text-white uppercase tracking-wider bg-accent/80 px-2 py-1 rounded">
                        View Details
                      </span>
                    </div>
                  </div>
                  <h3 className="mt-3 text-sm font-medium text-slate-200 line-clamp-2 group-hover:text-accent transition-colors">
                    {item.title}
                  </h3>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
