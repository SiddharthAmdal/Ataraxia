const parseTorrentTitle = (torrentName) => {
    // Remove group name like [SubsPlease] or (SomeGroup)
    let cleaned = torrentName.replace(/^\[[^\]]+\]\s*/, '').replace(/^\([^)]+\)\s*/, '');
    // Remove episode number and everything after it: - 01, -01, 01 (1080p)
    cleaned = cleaned.replace(/\s*-\s*\d+.*$/, '');
    cleaned = cleaned.replace(/\s+\d+\s*\(.*$/, ''); // e.g. 01 (1080p)
    cleaned = cleaned.replace(/\s*(?:S\d+E\d+|S\d+).*$/i, ''); // e.g. S02E01
    return cleaned.trim();
};

console.log(parseTorrentTitle("[SubsPlease] Dragon Ball Daima - 01 (1080p)")); // Dragon Ball Daima
console.log(parseTorrentTitle("[SoM] Dragon Ball Kai - COMPLETE (01-98)")); // Dragon Ball Kai - COMPLETE
console.log(parseTorrentTitle("[DB DUBS] Dragon Ball Z: TV Special 01 - The Bardock Special")); // Dragon Ball Z: TV Special 01
console.log(parseTorrentTitle("[Erai-raws] Dragon Ball - 01 (1080p)")); // Dragon Ball
console.log(parseTorrentTitle("[SubsPlease] Jujutsu Kaisen - 01 (1080p)")); // Jujutsu Kaisen
console.log(parseTorrentTitle("[Erai-raws] Bleach Sennen Kessen-hen - 01")); // Bleach Sennen Kessen-hen
console.log(parseTorrentTitle("Dragon Ball DAIMA [1080p] [DUAL-AUDIO] [001-010]")); // Dragon Ball DAIMA [1080p] [DUAL-AUDIO] [001-010]
