const results = [
    { name: "[SubsPlease] Dragon Ball Daima - 01 (1080p)", seeders: 50 },
    { name: "[SoM] Dragon Ball Kai - 01", seeders: 40 },
    { name: "[Erai-raws] Dragon Ball - 01 (1080p)", seeders: 5 },
    { name: "Dragon Ball 01 1080p", seeders: 1 }
];

const title = "Dragon Ball";
const epNum = "1";
const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const titleRegex = new RegExp(`${escapedTitle}\\s*[-:]?\\s*(?:s(?:eason)?\\s*\\d+\\s*)?(?:[-:]\\s*)?0*${epNum}\\b`, 'i');

const scoreTorrent = (r) => {
    let score = parseInt(r.seeders) || 0;
    if (titleRegex.test(r.name)) {
        score += 1000; // massive boost for strict title match
    }
    return score;
};

results.sort((a, b) => scoreTorrent(b) - scoreTorrent(a));
console.log(results.map(r => r.name));
