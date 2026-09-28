import { TorrentProvider } from '../server/src/services/torrentProvider.js';

async function testTorrents() {
  const provider = new TorrentProvider();
  
  const queries = [
    "[SubsPlease] One Piece (1080p)", // Match batch testing
    "[SubsPlease] One Piece - 1089 (1080p)", // Match trusted group
    "[Erai-raws] Jujutsu Kaisen 2nd Season - 25 [1080p]"
  ];

  for (const q of queries) {
    try {
      console.log(`Searching for: ${q}`);
      const res = await provider.fetchEpisodeSources("test-id", "One Piece", q);
      console.log("Found:", res.sources[0].url.substring(0, 80) + "...");
    } catch (e) {
      console.log("Error:", e.message);
    }
  }
}
testTorrents();
