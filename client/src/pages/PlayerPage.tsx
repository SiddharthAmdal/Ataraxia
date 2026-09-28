import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { useProgress } from "../context/ProgressContext";
import { secondsToTicks } from "../lib/formatters";
import { getPlaybackSource, getSkipTimes, updateWatchlist, getWatchlist, getShowDetail } from "../services/mediaApi";
import type { Episode, PlaybackSource, SkipTimesResult, WatchlistStatus } from "../types/media";
import { api } from "../lib/http";
import { InternalPlayer } from "../components/InternalPlayer";

export function PlayerPage() {
  const navigate = useNavigate();
  const { showId = "", episodeId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const isExternal = searchParams.get("source") === "external";
  const animeId = searchParams.get("animeId");
  const [subOrDub, setSubOrDub] = useState<"sub" | "dub">("sub");
  
  const { progressByItemId, upsertProgress } = useProgress();
  const [detail, setDetail] = useState<any>(null);
  const [playbackSource, setPlaybackSource] = useState<PlaybackSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [skipTimes, setSkipTimes] = useState<SkipTimesResult | null>(null);
  const [autoNext, setAutoNext] = useState(true);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [watchlistStatus, setWatchlistStatus] = useState<WatchlistStatus>("removed");
  const [updatingWatchlist, setUpdatingWatchlist] = useState(false);

  useEffect(() => {
    async function loadWatchlistStatus() {
      if (!animeId && !showId) return;
      try {
        const watchlist = await getWatchlist();
        const item = watchlist.find(i => i.animeId === (animeId || showId));
        if (item) setWatchlistStatus(item.status);
      } catch (err) {
        console.error("Failed to load watchlist status", err);
      }
    }
    loadWatchlistStatus();
  }, [animeId, showId]);

  const handleWatchlistChange = async (status: WatchlistStatus) => {
    const id = animeId || showId;
    if (!id) return;
    setUpdatingWatchlist(true);
    try {
      await updateWatchlist(id, {
        status,
        title: searchParams.get("title") || detail?.show?.name || "Unknown Anime",
        image: detail?.show?.imageUrl
      });
      setWatchlistStatus(status);
    } catch (err) {
      console.error("Failed to update watchlist", err);
    } finally {
      setUpdatingWatchlist(false);
    }
  };

  const currentEpisode = useMemo<Episode | undefined>(() => {
    if (isExternal) {
      const found = detail?.episodes?.find((episode: any) => episode.id === episodeId);
      if (found) return found;
      return { id: episodeId, name: `Episode ${episodeId.split('-').pop()}`, indexNumber: parseInt(episodeId.split('-').pop() || "1"), runtimeTicks: 0 } as Episode;
    }
    return detail?.episodes?.find((episode: any) => episode.id === episodeId);
  }, [detail?.episodes, episodeId, isExternal]);

  const nextEpisode = useMemo<Episode | undefined>(() => {
    if (!detail?.episodes?.length) return undefined;
    const currentIndex = detail.episodes.findIndex((episode: any) => episode.id === episodeId);
    return currentIndex >= 0 ? detail.episodes[currentIndex + 1] : undefined;
  }, [detail?.episodes, episodeId]);

  useEffect(() => {
    async function loadPlayerData() {
      setLoading(true);
      setError("");

      try {
        if (isExternal) {
          const watchResponse = await api.get(`/streaming/watch?episodeId=${encodeURIComponent(episodeId)}&category=${subOrDub}`);
          const sourceUrl = watchResponse.data.source;
          const isM3U8 = watchResponse.data.isM3U8;
          const embedUrl = watchResponse.data.embedUrl;
          const referer = embedUrl || watchResponse.data.headers?.Referer || "";
          
          const baseUrl = api.defaults.baseURL || 'http://localhost:4000/api';
          const proxyBase = baseUrl.startsWith('http') ? baseUrl : `${window.location.origin}${baseUrl}`;
          
          const isTorrent = sourceUrl.includes('/streaming/torrent/stream');
          setPlaybackSource({ 
            itemId: episodeId,
            streamUrl: isM3U8 
              ? `${proxyBase}/playback/proxy?target=${encodeURIComponent(sourceUrl)}&referer=${encodeURIComponent(referer)}`
              : undefined,
            directStreamUrl: !isM3U8
              ? (isTorrent ? sourceUrl : `${proxyBase}/streaming/proxy?url=${encodeURIComponent(sourceUrl)}&referer=${encodeURIComponent(referer)}`)
              : undefined,
            subtitles: watchResponse.data.subtitles
          } as PlaybackSource);

          if (animeId && !detail?.episodes?.length) {
            const currentTitle = searchParams.get("title") || "";
            const episodesResponse = await api.get(`/streaming/episodes?id=${encodeURIComponent(animeId)}&title=${encodeURIComponent(currentTitle)}`);
            const mappedEpisodes = episodesResponse.data.episodes.map((ep: any) => ({
              id: ep.id,
              name: `Episode ${ep.number}`,
              indexNumber: ep.number,
              runtimeTicks: 0
            }));
            
            const info = episodesResponse.data.info;
            const mappedRelations = (info?.relations || []).map((rel: any) => ({
              id: String(rel.id),
              relationType: rel.relationType,
              title: typeof rel.title === "string" ? rel.title : rel.title?.english || rel.title?.romaji || rel.title?.userPreferred || "Unknown Title",
              image: rel.image,
              type: rel.type
            }));

            setDetail({ 
              show: { 
                name: currentTitle || (typeof info?.title === "string" ? info.title : info?.title?.english || info?.title?.romaji || "External Stream"), 
                imageUrl: info?.image 
              }, 
              episodes: mappedEpisodes,
              relations: mappedRelations
            } as any);
          } else if (!detail) {
            setDetail({ show: { name: searchParams.get("title") || "External Stream" }, episodes: [] } as any);
          }
        } else {
          const [detailResponse, playbackResponse] = await Promise.all([
            getShowDetail(showId, searchParams.get("title") || undefined),
            getPlaybackSource(episodeId, subOrDub, searchParams.get("title") || undefined)
          ]);
          setDetail(detailResponse);
          setPlaybackSource(playbackResponse);
        }
      } catch (err: any) {
        console.error("Playback load error:", err);
        const message = err.response?.data?.message || err.message || "Unable to prepare playback. Stream may be unavailable.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void loadPlayerData();
  }, [episodeId, showId, subOrDub, animeId, isExternal]);

  useEffect(() => {
    async function loadSkipTimes() {
      const title = searchParams.get("title");
      const malId = (isExternal && title) ? 0 : detail?.metadata?.malId;
      const epNum = currentEpisode?.indexNumber;
      if (malId !== undefined && epNum) {
        try {
          const res = await getSkipTimes(malId, epNum, title || detail?.show?.name, currentEpisode?.parentIndexNumber);
          setSkipTimes(res);
        } catch (err) {
          console.error("Failed to load skip times", err);
          setSkipTimes(null);
        }
      } else {
        setSkipTimes(null);
      }
    }
    void loadSkipTimes();
  }, [detail?.metadata?.malId, currentEpisode?.indexNumber, isExternal]);

  const [artInstance, setArtInstance] = useState<Artplayer | null>(null);

  const handlePersistProgress = useCallback(async (currentSecond: number, duration: number, played = false) => {
    if (!currentEpisode) return;
    await upsertProgress({
      itemId: episodeId,
      animeId: animeId || showId,
      title: searchParams.get("title") || detail?.show?.name || "Unknown",
      image: detail?.show?.imageUrl,
      episodeNumber: currentEpisode.indexNumber,
      positionTicks: secondsToTicks(currentSecond),
      runtimeTicks: currentEpisode.runtimeTicks || secondsToTicks(duration),
      played
    });
  }, [currentEpisode, episodeId, animeId, showId, searchParams, detail, upsertProgress]);

  const handleEnded = useCallback(() => {
    void handlePersistProgress(0, 0, true).then(() => {
      if (autoNext && nextEpisode) {
        navigate(
          isExternal 
            ? `/shows/${showId}/watch/${encodeURIComponent(nextEpisode.id)}?source=external&animeId=${encodeURIComponent(animeId || "")}&title=${encodeURIComponent(searchParams.get("title") || "")}`
            : `/shows/${showId}/watch/${nextEpisode.id}`
        );
      }
    });
  }, [handlePersistProgress, autoNext, nextEpisode, navigate, isExternal, showId, animeId, searchParams]);

  const handleSkip = (type: "op" | "ed") => {
    if (!artInstance) return;
    if (!skipTimes?.found) {
        artInstance.notice.show = `No skip markers found for this episode`;
        return;
    }
    const match = skipTimes.results.find(r => r.skipType === type);
    if (match) {
      artInstance.currentTime = match.interval.endTime;
      artInstance.notice.show = `Skipped ${type === "op" ? "Intro" : "Outro"}`;
    } else {
        artInstance.notice.show = `No ${type === "op" ? "Intro" : "Outro"} marker available`;
    }
  };

  const hasOp = skipTimes?.found && skipTimes.results.some(r => r.skipType === "op");
  const hasEd = skipTimes?.found && skipTimes.results.some(r => r.skipType === "ed");

  if (loading) return <LoadingState label="Preparing video playback..." />;
  if (error || !detail || !currentEpisode || !playbackSource) return <ErrorState message={error || "This episode could not be loaded."} />;

  const playerUrl = playbackSource.streamUrl || playbackSource.directStreamUrl!;

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start">
      {/* Sidebar */}
      <div className={`flex flex-col gap-4 transition-all duration-300 ease-in-out overflow-hidden ${isSidebarOpen ? "w-full xl:w-[22rem] opacity-100" : "w-0 opacity-0 hidden xl:flex"}`}>
        <div className="flex items-center justify-between px-2 pt-2">
          <h3 className="text-xl font-semibold text-white">Episodes</h3>
        </div>
        <div className="glass-panel rounded-3xl flex-1 overflow-y-auto max-h-[70vh] p-2 space-y-1">
          {detail.episodes.map((ep: any) => (
            <Link
              key={ep.id}
              to={isExternal 
                ? `/shows/${showId}/watch/${encodeURIComponent(ep.id)}?source=external&animeId=${encodeURIComponent(animeId || "")}&title=${encodeURIComponent(searchParams.get("title") || "")}`
                : `/shows/${showId}/watch/${ep.id}`
              }
              className={`block rounded-2xl p-3 transition ${ep.id === episodeId ? "bg-accent text-black font-semibold shadow-md" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm line-clamp-2">
                  <span className="opacity-60 mr-1">{ep.indexNumber ? `${ep.indexNumber}.` : ""}</span>
                  {ep.name}
                </p>
                {ep.id === episodeId && <div className="w-2 h-2 rounded-full bg-black shrink-0" />}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full space-y-6 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="mt-1 hidden xl:flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/20"
            >
              {isSidebarOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-accentSoft">Now Playing</p>
              <Link to={isExternal ? `/shows/${animeId}?source=external` : `/shows/${showId}`}>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white line-clamp-1 hover:text-accent transition-colors">
                  {detail.show.name}
                </h2>
              </Link>
              <p className="text-slate-300 line-clamp-1 mt-2">{currentEpisode.name}</p>
            </div>
          </div>

          <Link
            to={isExternal ? "/discover" : `/shows/${showId}`}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 shrink-0"
          >
            {isExternal ? "Back to discovery" : "Back to show"}
          </Link>
        </div>

        {/* Player Container */}
        <div className="glass-panel overflow-hidden rounded-[2rem] p-4 shadow-2xl">
          <div className="w-full aspect-video rounded-[1.5rem] overflow-hidden bg-black relative">
            <InternalPlayer
              key={playerUrl}
              url={playerUrl}
              type={playbackSource.streamUrl ? "m3u8" : "m4v"}
              subtitles={playbackSource.subtitles}
              savedPositionTicks={progressByItemId[episodeId]?.positionTicks}
              onProgress={handlePersistProgress}
              onEnded={handleEnded}
              onReady={setArtInstance}
            />
          </div>
        </div>

        {/* External Player Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex gap-3">
            <button
              onClick={() => handleSkip("op")}
              className={`flex items-center gap-2 px-5 py-2.5 bg-accent/20 hover:bg-accent/40 text-accentSoft rounded-xl transition-all font-bold text-xs uppercase tracking-widest border border-accent/30 ${!hasOp ? "opacity-30 cursor-not-allowed" : ""}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
              Skip Intro
            </button>
            <button
              onClick={() => handleSkip("ed")}
              className={`flex items-center gap-2 px-5 py-2.5 bg-accent/20 hover:bg-accent/40 text-accentSoft rounded-xl transition-all font-bold text-xs uppercase tracking-widest border border-accent/30 ${!hasEd ? "opacity-30 cursor-not-allowed" : ""}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
              Skip Outro
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-300">Auto Next</span>
            <button
              onClick={() => setAutoNext(!autoNext)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${autoNext ? "bg-accent" : "bg-slate-600"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoNext ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="glass-panel rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-accentSoft">Watchlist</p>
            <div className="flex items-center gap-2 mt-4 bg-white/5 border border-white/10 p-1.5 rounded-2xl w-max">
              {(["watching", "completed", "planned", "on_hold", "dropped", "removed"] as WatchlistStatus[]).map((status) => (
                <button
                  key={status}
                  disabled={updatingWatchlist}
                  onClick={() => handleWatchlistChange(status)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                    watchlistStatus === status
                      ? "bg-accent text-white shadow-lg shadow-accent/20"
                      : "text-slate-500 hover:text-white"
                  }`}
                >
                  {status === "removed" 
                    ? "Remove" 
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
            {isExternal && (
              <div className="mt-8">
                <p className="text-xs uppercase tracking-[0.24em] text-accentSoft">Audio Options</p>
                <div className="mt-3 flex gap-2 max-w-sm">
                  <button onClick={() => setSubOrDub("sub")} className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${subOrDub === "sub" ? "bg-accent text-black" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>Sub</button>
                  <button onClick={() => setSubOrDub("dub")} className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${subOrDub === "dub" ? "bg-accent text-black" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>Dub</button>
                </div>
              </div>
            )}
          </div>
          <div className="glass-panel rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-accentSoft">Up Next</p>
            {nextEpisode ? (
              <>
                <h3 className="mt-2 text-xl font-semibold text-white">{nextEpisode.name}</h3>
                <p className="mt-3 text-sm text-slate-300">Will play automatically after current episode.</p>
                <Link
                  to={isExternal 
                    ? `/shows/${showId}/watch/${encodeURIComponent(nextEpisode.id)}?source=external&animeId=${encodeURIComponent(animeId || "")}&title=${encodeURIComponent(searchParams.get("title") || "")}`
                    : `/shows/${showId}/watch/${nextEpisode.id}`
                  }
                  className="mt-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Play next now
                </Link>
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-300">No more episodes available.</p>
            )}
          </div>
        </section>

        {detail.relations && detail.relations.length > 0 && (
          <section className="glass-panel rounded-[2rem] p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-accentSoft mb-6">Related Seasons & Series</p>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {detail.relations.map((rel: any) => (
                <button
                  key={rel.id}
                  onClick={() => {
                    window.location.href = `/shows/${rel.id}?source=external`;
                  }}
                  className="flex-shrink-0 w-36 group"
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
          </section>
        )}
      </div>
    </div>
  );
}
