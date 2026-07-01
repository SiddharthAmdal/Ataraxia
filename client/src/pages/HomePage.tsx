import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { getTrendingAnime, getPopularAnime, getContinueWatching, deleteProgress } from "../services/mediaApi";
import { LoadingState } from "../components/LoadingState";
import { ContinueWatchingRail } from "../components/ContinueWatchingRail";

export function HomePage() {
  const { isLoggedIn } = useAuth();
  const [trending, setTrending] = useState<any[]>([]);
  const [popular, setPopular] = useState<any[]>([]);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const [trend, pop, cw] = await Promise.all([
        getTrendingAnime(),
        getPopularAnime(),
        isLoggedIn ? getContinueWatching() : Promise.resolve([])
      ]);
      setTrending((trend || []).slice(0, 12));
      setPopular((pop || []).slice(0, 12));
      setContinueWatching(cw || []);
    } catch (e) {
      console.error("Failed to load home page data:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [isLoggedIn]);

  const handleDeleteProgress = async (itemId: string) => {
    try {
      await deleteProgress(itemId);
      setContinueWatching(prev => prev.filter(i => i.itemId !== itemId));
    } catch (err) {
      console.error("Failed to delete progress", err);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 10 } },
  };

  const renderRail = (title: string, items: any[]) => (
    <div className="w-full max-w-7xl mx-auto px-4 mt-12 mb-8">
      <div className="flex items-end justify-between mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
        <Link to="/library" className="text-sm text-accent hover:text-accentSoft transition-colors">View All</Link>
      </div>
      <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory hide-scrollbar">
        {items.map((item) => (
          <Link
            key={item.id}
            to={`/shows/${item.id}?source=external&title=${encodeURIComponent(item.title)}`}
            className="snap-start shrink-0 w-40 sm:w-48 lg:w-56 group relative rounded-2xl overflow-hidden bg-slate-800 border border-white/10 hover:border-accent/50 transition-all hover:-translate-y-1 shadow-lg"
          >
            <div className="aspect-[2/3] w-full relative">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <span className="bg-accent text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">Stream</span>
              </div>
            </div>
            <div className="p-3">
              <h3 className="text-sm font-semibold text-slate-200 line-clamp-1 group-hover:text-accent transition-colors">
                {typeof item.title === 'string' ? item.title : (item.title?.english || item.title?.romaji || 'Unknown Anime')}
              </h3>
              {item.rating && <p className="text-xs text-slate-400 mt-1">Score: {item.rating / 10}</p>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative flex flex-col items-center min-h-[85vh] overflow-hidden w-full pb-20">
      {/* Dynamic Background Elements */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.6, scale: 1 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-accent/10 rounded-full blur-[160px] pointer-events-none -z-10" 
      />

      <motion.div 
        className="z-10 flex flex-col items-center max-w-5xl px-4 mt-20 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-accent/30 blur-2xl rounded-full" />
          <h1 className="relative text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-accent drop-shadow-lg">
            Ataraxia
          </h1>
        </motion.div>
        
        <motion.p 
          variants={itemVariants}
          className="text-lg md:text-xl text-slate-300 max-w-2xl mb-12 leading-relaxed font-light backdrop-blur-sm"
        >
          Your premium portal to the anime universe. Explore the latest episodes, trending shows, and timeless classics.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-6 mb-20">
          <Link
            to="/discover"
            className="group relative inline-flex items-center justify-center px-10 py-4 font-bold text-white overflow-hidden rounded-full transition-all focus:outline-none focus:ring-4 focus:ring-accent/50 bg-accent hover:bg-accentSoft shadow-lg shadow-accent/20"
          >
            <span className="relative flex items-center text-lg tracking-wide z-10">
              Start Discovering
            </span>
          </Link>

          {!isLoggedIn && (
            <Link
              to="/login"
              className="group relative inline-flex items-center justify-center px-10 py-4 font-bold text-white overflow-hidden rounded-full transition-all border border-white/10 hover:border-white/30 bg-white/5 backdrop-blur-md hover:bg-white/10"
            >
              <span className="relative flex items-center text-lg tracking-wide z-10">
                Sign In
              </span>
            </Link>
          )}
        </motion.div>
      </motion.div>

      {loading ? (
        <LoadingState label="Loading anime dimensions..." />
      ) : (
        <div className="w-full space-y-4">
          {continueWatching.length > 0 && (
            <div className="max-w-7xl mx-auto px-4 mt-8">
              <ContinueWatchingRail items={continueWatching} onDelete={handleDeleteProgress} />
            </div>
          )}
          {renderRail("Trending Now", trending)}
          {renderRail("All Time Popular", popular)}
        </div>
      )}
    </div>
  );
}