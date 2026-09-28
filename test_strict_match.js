const isStrictTitleMatch = (title, torrentName) => {
    const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Ensure that right after the title, we ONLY see typical boundaries (dash, number, season, brackets)
    // We use a positive lookahead or just a regex match.
    // Note: If the torrent name is exactly "Dragon Ball", we want to allow it. So \b or end of string.
    const strictRegex = new RegExp(`${escapedTitle}(?:\\s*(?:-|\\d+|season|s\\d|movie|ova|sp|\\[|\\(|\\b$))`, 'i');
    return strictRegex.test(torrentName);
};

console.log(isStrictTitleMatch("Dragon Ball", "[SubsPlease] Dragon Ball Daima - 01")); // should be false
console.log(isStrictTitleMatch("Dragon Ball", "[SoM] Dragon Ball Kai - 01")); // should be false
console.log(isStrictTitleMatch("Dragon Ball", "[DB DUBS] Dragon Ball Z: TV Special 01")); // should be false
console.log(isStrictTitleMatch("Dragon Ball", "[Erai-raws] Dragon Ball - 01 (1080p)")); // should be true
console.log(isStrictTitleMatch("Jujutsu Kaisen", "[SubsPlease] Jujutsu Kaisen - 01 (1080p)")); // should be true
console.log(isStrictTitleMatch("Jujutsu Kaisen", "[SubsPlease] Jujutsu Kaisen 2nd Season - 01")); // should be false
console.log(isStrictTitleMatch("Jujutsu Kaisen Season 2", "[SubsPlease] Jujutsu Kaisen 2nd Season - 01")); // wait, title is "Season 2", torrent is "2nd Season".

// Let's refine.
