import { useState, useEffect } from "react";
import { api } from "../lib/http";

interface DownloadProgress {
  infoHash: string;
  name: string;
  progress: number;
  downloadSpeed: number;
  timeRemaining: number;
  done: boolean;
}

export function DownloadManager() {
  const [downloads, setDownloads] = useState<DownloadProgress[]>([]);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await api.get("/torrents/status");
        setDownloads(response.data.downloads);
      } catch (err) {
        // console.error("Failed to fetch download status", err);
      }
    };

    // Poll every 2 seconds
    const interval = setInterval(fetchStatus, 2000);
    fetchStatus(); // Initial fetch

    return () => clearInterval(interval);
  }, []);

  if (downloads.length === 0) {
    return null;
  }

  const formatSpeed = (bytesPerSec: number) => {
    if (bytesPerSec === 0) return "0 B/s";
    const k = 1024;
    const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
    const i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
    return parseFloat((bytesPerSec / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatTime = (ms: number) => {
    if (ms === Infinity || ms === 0) return "--:--";
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 animate-fade-in-up">
      <div className="glass-panel rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div 
          className="bg-white/10 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-white/20 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <h3 className="font-semibold text-white text-sm">Active Downloads ({downloads.length})</h3>
          </div>
          <svg className={`w-4 h-4 text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* List */}
        {isOpen && (
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-4 space-y-4">
            {downloads.map((d) => (
              <div key={d.infoHash} className="space-y-2">
                <p className="text-xs text-white line-clamp-1" title={d.name}>{d.name}</p>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent transition-all duration-500 ease-out" 
                    style={{ width: `${Math.max(0, Math.min(100, d.progress * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>{d.done ? "Completed" : `${(d.progress * 100).toFixed(1)}%`}</span>
                  {!d.done && (
                    <span className="flex gap-2">
                      <span>{formatSpeed(d.downloadSpeed)}</span>
                      <span>ETA: {formatTime(d.timeRemaining)}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
