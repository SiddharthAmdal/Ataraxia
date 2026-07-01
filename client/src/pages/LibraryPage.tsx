import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LoadingState } from "../components/LoadingState";
import { getRecentEpisodes, getUpcomingAnime } from "../services/mediaApi";
import { motion } from "framer-motion";

export function LibraryPage() {
  const [recent, setRecent] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [recentData, upcomingData] = await Promise.all([
          getRecentEpisodes(),
          getUpcomingAnime()
        ]);
        setRecent(recentData.slice(0, 24));
        setUpcoming(upcomingData.slice(0, 24));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const renderGrid = (title: string, items: any[], isEpisode = false) => (
    <div className="mb-16">
      <h2 className="text-3xl font-bold tracking-tight text-white mb-8">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {items.map((item, idx) => (
          <motion.div
            key={`${item.id}-${idx}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Link
              to={`/shows/${item.id}?source=external&title=${encodeURIComponent(item.title)}`}
              className="group block relative rounded-2xl overflow-hidden bg-slate-800 border border-white/10 hover:border-accent/50 transition-all hover:-translate-y-1 shadow-lg"
            >
              <div className="aspect-[2/3] w-full relative">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="bg-accent text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                    {isEpisode ? `Ep ${item.episodeNumber}` : "View"}
                  </span>
                </div>
              </div>
              <div className="p-3">
                <h3 className="text-sm font-semibold text-slate-200 line-clamp-2 group-hover:text-accent transition-colors">
                  {typeof item.title === 'string' ? item.title : (item.title?.english || item.title?.romaji || 'Unknown Anime')}
                </h3>
                {isEpisode && item.episodeNumber && (
                  <p className="text-xs text-accent mt-1">Episode {item.episodeNumber}</p>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return <LoadingState label="Loading categories..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-12">
        <h1 className="text-5xl font-black text-white tracking-tight">Categories</h1>
        <p className="text-slate-400 mt-2 text-lg">Browse recent releases and upcoming shows.</p>
      </header>

      {renderGrid("Recently Released Episodes", recent, true)}
      {renderGrid("Upcoming Anime", upcoming)}
    </div>
  );
}