import { Link } from "react-router-dom";
import { useState } from "react";
import { progressPercent } from "../lib/formatters";
import type { ContinueWatchingItem } from "../types/media";
import { motion, AnimatePresence } from "framer-motion";

type ContinueWatchingRailProps = {
  items: ContinueWatchingItem[];
  onDelete?: (itemId: string) => void;
};

export function ContinueWatchingRail({ items, onDelete }: ContinueWatchingRailProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (items.length === 0) {
    return null;
  }

  const displayedItems = isExpanded ? items : items.slice(0, 3);
  const hasMore = items.length > 3;

  return (
    <motion.section 
      layout
      className="glass-panel rounded-[2rem] p-8 border border-white/10 relative overflow-hidden"
    >
      <div className="mb-6 flex items-center justify-between gap-4 relative z-10">
        <motion.div layout="position">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accentSoft">
            Continue Watching
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">Resume where you left off</h2>
        </motion.div>
        
        {hasMore && (
          <motion.button
            layout="position"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-accent transition-all"
          >
            {isExpanded ? "Show Less" : `View All (${items.length})`}
            <svg 
              className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.button>
        )}
      </div>

      <motion.div 
        layout
        className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {displayedItems.map((item) => (
            <motion.div
              layout
              key={item.itemId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="group relative rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:border-white/20 shadow-lg flex gap-4"
            >
              {item.image && (
                <div className="w-16 h-24 shrink-0 rounded-xl overflow-hidden bg-slate-800">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400">
                  {item.updatedAt
                    ? `Updated ${new Date(item.updatedAt).toLocaleDateString()}`
                    : "Recently watched"}
                </p>
                <h3 className="mt-1 text-base font-semibold text-white line-clamp-1">{item.title}</h3>
                {item.episodeNumber !== undefined && (
                  <p className="text-xs text-slate-300 mt-1">Episode {item.episodeNumber}</p>
                )}
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{
                      width: `${progressPercent(
                        item.positionTicks,
                        item.runtimeTicks
                      )}%`
                    }}
                  />
                </div>
                <Link
                  to={`/shows/${item.animeId}/watch/${encodeURIComponent(item.itemId)}?source=external&animeId=${encodeURIComponent(item.animeId)}&title=${encodeURIComponent(item.title)}`}
                  className="absolute inset-0 z-10"
                />
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(item.itemId);
                    }}
                    className="absolute top-3 right-3 z-20 p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                    title="Remove from history"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </motion.section>
  );
}
