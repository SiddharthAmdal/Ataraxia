const testMatch = (title, epNum, torrentName) => {
    const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const titleRegex = new RegExp(`${escapedTitle}\\s*[-:]?\\s*(?:s(?:eason)?\\s*\\d+\\s*)?(?:[-:]\\s*)?0*${epNum}\\b`, 'i');
    return titleRegex.test(torrentName);
};

console.log(testMatch("Dragon Ball Daima", "1", "[SubsPlease] Dragon Ball Daima - 01")); // true
console.log(testMatch("Bleach: Thousand-Year Blood War", "1", "[Erai-raws] Bleach - Sennen Kessen-hen - 01")); // English title vs Romaji title
