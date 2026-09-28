import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRecentEpisodes, getWatchlist, getUpcomingAnime } from "../services/mediaApi";
import { LoadingState } from "../components/LoadingState";
import { motion, AnimatePresence } from "framer-motion";


interface NotificationItem {
  type: "new_episode" | "new_season" | "upcoming";
  animeId: string;
  episodeId?: string;
  episodeNumber?: number;
  title: string;
  image: string;
  reason: string;
  airingAt?: number;
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "watching" | "completed">("all");

  useEffect(() => {
    async function loadNotifications() {
      try {
        const [recent, watchlist, upcoming] = await Promise.all([
          getRecentEpisodes(),
          getWatchlist(),
          getUpcomingAnime()
        ]);

        const personalized: NotificationItem[] = [];
        const watching = watchlist.filter(i => i.status === "watching");
        const completed = watchlist.filter(i => i.status === "completed");

        // 1. Check for new episodes of "Watching" anime
        recent.forEach((ep: any) => {
          const match = watching.find(w => 
            ep.title.toLowerCase().includes(w.title.toLowerCase()) || 
            w.title.toLowerCase().includes(ep.title.toLowerCase())
          );
          if (match) {
            personalized.push({
              type: "new_episode",
              animeId: match.animeId,
              episodeId: ep.episodeId,
              episodeNumber: ep.episodeNumber,
              title: ep.title,
              image: ep.image,
              reason: `New episode released for a show you're watching!`
            });
          }
        });

        // 2. Check for upcoming episodes or new seasons
        upcoming.forEach((item: any) => {
          // Check if it's a show we are watching
          const watchingMatch = watching.find(w => 
            item.title.toLowerCase().includes(w.title.toLowerCase()) || 
            w.title.toLowerCase().includes(item.title.toLowerCase())
          );

          if (watchingMatch) {
            personalized.push({
              type: "upcoming",
              animeId: watchingMatch.animeId,
              title: item.title,
              image: item.image,
              reason: `Next episode airs soon!`,
              airingAt: item.airingAt
            });
          } else {
            // Check if it's a new season of a completed show
            const completedMatch = completed.find(c => 
              item.title.toLowerCase().includes(c.title.toLowerCase()) && 
              item.title.toLowerCase() !== c.title.toLowerCase()
            );

            if (completedMatch) {
              personalized.push({
                type: "new_season",
                animeId: item.id, // Use the new show's ID
                title: item.title,
                image: item.image,
                reason: `A new season/sequel for "${completedMatch.title}" is airing!`
              });
            }
          }
        });

        // Remove duplicates (by title and type)
        const unique = personalized.filter((v, i, a) => 
          a.findIndex(t => t.title === v.title && t.type === v.type) === i
        );

        setNotifications(unique);
      } catch (err) {
        console.error("Failed to load notifications", err);
        setError("Unable to sync your personalized updates.");
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, []);

  const filtered = notifications.filter(n => {
    if (activeFilter === "all") return true;
    if (activeFilter === "watching") return n.type === "new_episode" || n.type === "upcoming";
    if (activeFilter === "completed") return n.type === "new_season";
    return true;
  });

  if (loading) return <LoadingState label="Personalizing your updates..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Your Updates</h1>
          <p className="text-slate-400">Personalized notifications for the shows you love.</p>
        </div>

        <div className="flex gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
          {(["all", "watching", "completed"] as const).map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeFilter === f ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-slate-400 hover:text-white"
              }`}
            >
              {f === "all" ? "All Updates" : f === "watching" ? "Watching" : "New Seasons"}
            </button>
          ))}
        </div>
      </header>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[2.5rem] text-red-400 text-center">
          <p className="font-medium">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="text-slate-400 font-medium">No new updates for your watchlist right now.</p>
          <p className="text-slate-600 text-sm mt-2">We'll notify you here when new episodes or seasons drop.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((n, idx) => (
              <motion.div
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                key={`${n.type}-${n.title}`}
                className="group glass-panel rounded-[2rem] overflow-hidden border border-white/10 hover:border-accent/50 transition-all duration-300 p-6"
              >
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="w-full md:w-24 aspect-[2/3] rounded-2xl overflow-hidden flex-shrink-0 border border-white/5 shadow-xl">
                    <img src={n.image} alt={n.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  
                  <div className="flex-1 text-center md:text-left min-w-0">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        n.type === "new_episode" ? "bg-green-500/20 text-green-400" : 
                        n.type === "new_season" ? "bg-purple-500/20 text-purple-400" : 
                        "bg-blue-500/20 text-blue-400"
                      }`}>
                        {n.type.replace("_", " ")}
                      </span>
                      {n.episodeNumber && (
                        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                          EP {n.episodeNumber}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-white group-hover:text-accent transition-colors mb-2 line-clamp-1">
                      {n.title}
                    </h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                      {n.reason}
                    </p>
                    
                    {n.airingAt && (
                      <p className="text-accentSoft text-xs mt-3 font-bold uppercase tracking-widest">
                        Airing {new Date(n.airingAt * 1000).toLocaleDateString(undefined, { weekday: 'long', hour: 'numeric', minute: 'numeric' })}
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0 w-full md:w-auto">
                    <Link
                      to={n.episodeId ? `/shows/${n.animeId}/watch/${n.episodeId}` : `/shows/${n.animeId}`}
                      className="inline-flex w-full md:w-auto items-center justify-center gap-3 px-8 py-4 bg-accent text-white font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-accent/20"
                    >
                      {n.type === "new_episode" ? "Watch Now" : "View Series"}
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
