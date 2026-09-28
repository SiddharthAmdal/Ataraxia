const scoreTorrent = (title, epNum, r) => {
    let score = parseInt(r.seeders) || 0;
    
    // Exact strict match: Title followed by boundaries (dash, episode number)
    const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const strictRegex = new RegExp(`${escapedTitle}\\s*[-:]?\\s*(?:s(?:eason)?\\s*\\d+\\s*)?(?:[-:]\\s*)?0*${epNum}\\b`, 'i');
    
    if (strictRegex.test(r.name)) {
        score += 1000;
    }
    
    // Bonus for trusted groups
    if (r.name.includes('[SubsPlease]') || r.name.includes('[Erai-raws]')) {
        score += 500;
    }
    
    return score;
};

const jjk = [
    { name: "[SubsPlease] Jujutsu Kaisen 2nd Season - 01", seeders: 500 },
    { name: "[SubsPlease] Jujutsu Kaisen - 01", seeders: 10 }
];
jjk.sort((a, b) => scoreTorrent("Jujutsu Kaisen", "1", b) - scoreTorrent("Jujutsu Kaisen", "1", a));
console.log("JJK:", jjk.map(r => r.name));

const bleach = [
    { name: "[SubsPlease] Bleach - 01", seeders: 10 },
    { name: "[SubsPlease] Bleach Sennen Kessen-hen - 01", seeders: 500 }
];
bleach.sort((a, b) => scoreTorrent("Bleach", "1", b) - scoreTorrent("Bleach", "1", a));
console.log("Bleach:", bleach.map(r => r.name));

const bleach2 = [
    { name: "[SubsPlease] Bleach Sennen Kessen-hen - 01", seeders: 500 },
    { name: "[SomeGroup] Bleach: Thousand-Year Blood War - 01", seeders: 50 }
];
bleach2.sort((a, b) => scoreTorrent("Bleach: Thousand-Year Blood War", "1", b) - scoreTorrent("Bleach: Thousand-Year Blood War", "1", a));
console.log("Bleach 2:", bleach2.map(r => r.name));
