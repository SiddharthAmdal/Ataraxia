import { useEffect, useRef } from "react";
import Artplayer from "artplayer";
import Hls from "hls.js";
import { ticksToSeconds } from "../lib/formatters";

interface InternalPlayerProps {
  url: string;
  type: "m3u8" | "m4v";
  subtitles?: { url: string; lang: string }[];
  savedPositionTicks?: number;
  onProgress?: (currentSecond: number, duration: number) => void;
  onEnded?: () => void;
  onReady?: (art: Artplayer) => void;
}

export function InternalPlayer({ 
  url, 
  type, 
  subtitles = [], 
  savedPositionTicks = 0,
  onProgress,
  onEnded,
  onReady
}: InternalPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<Artplayer | null>(null);
  const hasSeekedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!containerRef.current) return;

    hasSeekedRef.current = false;

    console.log("%c[Player] 🚀 Initializing Artplayer...", "color: #a855f7; font-weight: bold; font-size: 14px;");
    
    if (Array.isArray(Artplayer.instances)) {
        Artplayer.instances.forEach(ins => {
            try { ins.destroy(true); } catch (e) {}
        });
    }

    const orphans = document.querySelectorAll('video, audio');
    orphans.forEach(el => {
        try {
            (el as HTMLMediaElement).pause();
            (el as HTMLMediaElement).src = "";
            (el as HTMLMediaElement).load();
            el.remove();
        } catch (e) {}
    });

    const defaultSub = subtitles.find(s => s.lang.toLowerCase().includes('english') || s.lang.toLowerCase().includes('en')) || subtitles[0];

    const art = new Artplayer({
      container: containerRef.current,
      url,
      type,
      customType: {
        m3u8: function (video, m3u8Url, art) {
          if (Hls.isSupported()) {
            if ((art as any).hls) (art as any).hls.destroy();
            const hls = new Hls({
              debug: false,
              enableWorker: true,
              lowLatencyMode: true,
              backBufferLength: 90
            });
            (art as any).hls = hls;
            hls.loadSource(m3u8Url);
            hls.attachMedia(video);
            
            hls.on(Hls.Events.ERROR, (_, data) => {
              if (data.fatal) {
                console.error("[Player] HLS Fatal Error:", data.type, data.details);
                if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
                else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
              }
            });
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = m3u8Url;
          }
        },
      },
      theme: '#a855f7',
      volume: 1,
      autoplay: true,
      pip: true,
      autoSize: true,
      screenshot: false, // REMOVED SCREENSHOT BUTTON
      setting: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: true,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: true,
      airplay: true,
      hotkey: true,
      lock: true,
      fastForward: true,
      autoHide: 5000, // Hide controls after 5 seconds of inactivity
      subtitle: defaultSub ? {
        url: defaultSub.url,
        type: defaultSub.url.endsWith('vtt') ? 'vtt' : 'srt',
        style: { 
          color: '#ffffff', 
          fontSize: '24px',
          textShadow: '0 0 4px rgba(0, 0, 0, 0.9)',
          fontWeight: '500'
        },
        encoding: 'utf-8',
        escape: false,
      } : undefined,
      settings: [
        {
          html: 'Subtitle Size',
          width: 250,
          tooltip: '24px',
          selector: [
            { html: '16px', value: '16px' },
            { html: '20px', value: '20px' },
            { default: true, html: '24px', value: '24px' },
            { html: '28px', value: '28px' },
            { html: '32px', value: '32px' },
            { html: '40px', value: '40px' },
          ],
          onSelect: function (item) {
            art.subtitle.style('fontSize', item.value);
            return item.html;
          },
        },
      ],
    });

    artRef.current = art;

    // Handle Subtitle Resize via Hotkeys
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only handle if player is active
      if (!artRef.current) return;
      
      const art = artRef.current;
      const step = 2;
      const minSize = 12;
      const maxSize = 80;

      // Safely get current font size
      let currentSize = 24; // Default fallback
      
      try {
        // First try the direct style property
        const directStyle = art.subtitle.style("fontSize");
        if (directStyle && directStyle.includes("px")) {
          currentSize = parseInt(directStyle);
        } else {
          // Fallback to computed style of the subtitle container
          const subElement = containerRef.current?.querySelector(".art-subtitle");
          if (subElement) {
            const computedSize = window.getComputedStyle(subElement).fontSize;
            currentSize = parseInt(computedSize) || 24;
          }
        }
      } catch (err) {
        console.warn("[Player] Error detecting font size:", err);
      }

      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        const newSize = Math.min(maxSize, currentSize + step);
        art.subtitle.style("fontSize", `${newSize}px`);
        art.notice.show = `Subtitle Size: ${newSize}px`;
      } else if (e.key === "-") {
        e.preventDefault();
        const newSize = Math.max(minSize, currentSize - step);
        art.subtitle.style("fontSize", `${newSize}px`);
        art.notice.show = `Subtitle Size: ${newSize}px`;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);

    art.on('ready', () => {
      console.log("[Player] ✅ Artplayer is Ready");
      if (!hasSeekedRef.current && savedPositionTicks > 0) {
        art.currentTime = ticksToSeconds(savedPositionTicks);
        hasSeekedRef.current = true;
      }
      if (onReady) onReady(art);
    });

    art.on('error', (err) => console.error("[Player] ❌ Artplayer Error:", err));
    art.on('video:ended', () => { if (onEnded) onEnded(); });

    let lastSavedSecond = 0;
    art.on('video:timeupdate', () => {
      const currentSecond = Math.floor(art.currentTime);
      if (currentSecond % 5 === 0 && currentSecond !== lastSavedSecond) {
        lastSavedSecond = currentSecond;
        if (onProgress) onProgress(currentSecond, art.duration);
      }
    });

    // Handle Subtitle Resize via Artplayer events or settings
    art.on('subtitleOffset', (offset) => {
        console.log('[Player] Subtitle offset changed:', offset);
    });

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
      if (art) {
        try {
          art.pause();
          if (art.video) {
            art.video.src = "";
            art.video.load();
          }
          if ((art as any).hls) (art as any).hls.destroy();
          art.destroy(true);
        } catch (e) {}
      }
    };
  }, [url, type]); 

  useEffect(() => {
    const art = artRef.current;
    if (!art || hasSeekedRef.current || savedPositionTicks <= 0) return;
    art.currentTime = ticksToSeconds(savedPositionTicks);
    hasSeekedRef.current = true;
  }, [savedPositionTicks]);

  return (
    <div ref={containerRef} className="w-full h-full bg-black relative" />
  );
}
