import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { EpisodeList } from "../components/EpisodeList";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { getShowDetail, updateWatchlist, getWatchlist } from "../services/mediaApi";
import type { ShowDetail, WatchlistStatus } from "../types/media";

export function ShowDetailPage() {
  const { showId = "" } = useParams();
  const [detail, setDetail] = useState<ShowDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [watchlistStatus, setWatchlistStatus] = useState<WatchlistStatus>("removed");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const searchParams = new URLSearchParams(window.location.search);
        const titleFromQuery = searchParams.get("title");
        
        // Fetch watchlist first to see if we have a title stored
        const watchlistData = await getWatchlist();
        const watchItem = watchlistData.find(item => item.animeId === showId);
        if (watchItem) setWatchlistStatus(watchItem.status);

        const showTitle = watchItem?.title || titleFromQuery || "";
        const showRes = await getShowDetail(showId, showTitle);
        
        setDetail(showRes);
      } catch {
        setError("Unable to load this show. The streaming provider might be temporarily unavailable.");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [showId]);

  const handleStatusChange = async (status: WatchlistStatus) => {
    if (!detail) return;
    setUpdating(true);
    try {
      await updateWatchlist(showId, {
        status,
        title: detail.metadata?.title || detail.show.name,
        image: detail.metadata?.imageUrl || detail.show.imageUrl
      });
      setWatchlistStatus(status);
    } catch (err) {
      console.error("Failed to update watchlist", err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <LoadingState label="Loading show details..." />;
  }

  if (error || !detail) {
    return <ErrorState message={error || "Show not found."} />;
  }

  return (
    <div className="space-y-8">
      <section
        className="glass-panel overflow-hidden rounded-[2rem] p-8"
        style={{
          backgroundImage: detail.show.backdropUrl
            ? `linear-gradient(to right, rgba(2,6,23,0.95), rgba(2,6,23,0.6)), url(${detail.show.backdropUrl})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.28em] text-accentSoft">
            Series Detail
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            {detail.metadata?.title || detail.show.name}
          </h2>
          <p className="mt-4 text-slate-200">
            {detail.metadata?.synopsis || detail.show.overview}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {(detail.metadata?.genres.length
              ? detail.metadata.genres
              : detail.show.genres
            ).map((genre) => (
              <span
                key={genre}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200"
              >
                {genre}
              </span>
            ))}
          </div>

          {/* Watchlist Picker */}
          <div className="mt-8 flex flex-col gap-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-accentSoft font-bold">
              Watchlist Status
            </p>
            <div className="flex flex-wrap gap-2">
              {(["watching", "completed", "planned", "on_hold", "dropped", "removed"] as WatchlistStatus[]).map((status) => (
                <button
                  key={status}
                  disabled={updating}
                  onClick={() => handleStatusChange(status)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
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
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-5">
          {detail.relations && detail.relations.length > 0 && (
            <div className="mb-10">
              <p className="text-xs uppercase tracking-[0.24em] text-accentSoft mb-4">
                Related Seasons & Series
              </p>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {detail.relations.map((rel) => (
                  <button
                    key={rel.id}
                    onClick={() => {
                      // Use window.location to force a reload if needed, 
                      // or just navigate if the component handles id changes
                      window.location.href = `/shows/${rel.id}?source=external`;
                    }}
                    className="flex-shrink-0 w-32 group"
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
                    <p className="mt-2 text-xs font-medium text-slate-300 line-clamp-2 group-hover:text-white transition-colors text-left">
                      {rel.title}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-accentSoft">
              Episodes
            </p>
            <h3 className="panel-title mt-2">
              {detail.episodes.length} episodes ready to play
            </h3>
          </div>
          <EpisodeList showId={showId} episodes={detail.episodes} />
        </div>

        <aside className="glass-panel rounded-3xl p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-accentSoft">
            Metadata
          </p>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-slate-400">Rating</dt>
              <dd className="mt-1 text-white">
                {detail.metadata?.score ?? detail.show.communityRating ?? "N/A"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Production year</dt>
              <dd className="mt-1 text-white">
                {detail.show.productionYear ?? "Unknown"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Episode count</dt>
              <dd className="mt-1 text-white">{detail.episodes.length}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Trailer</dt>
              <dd className="mt-1 text-white">
                {detail.metadata?.trailerUrl ? (
                  <a
                    href={detail.metadata.trailerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accentSoft transition hover:text-white"
                  >
                    Open trailer
                  </a>
                ) : (
                  "Unavailable"
                )}
              </dd>
            </div>
          </dl>
        </aside>
      </section>
    </div>
  );
}
