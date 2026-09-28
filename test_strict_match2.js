const testMatch = (title, epNum, torrentName) => {
    const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const titleRegex = new RegExp(`${escapedTitle}\\s*[-:]?\\s*(?:s(?:eason)?\\s*\\d+\\s*)?(?:[-:]\\s*)?0*${epNum}\\b`, 'i');
    return titleRegex.test(torrentName);
};

console.log(testMatch("Dragon Ball", "1", "[SubsPlease] Dragon Ball Daima - 01")); // false
console.log(testMatch("Dragon Ball", "1", "[SoM] Dragon Ball Kai - 01")); // false
console.log(testMatch("Dragon Ball", "1", "[Erai-raws] Dragon Ball - 01 (1080p)")); // true
console.log(testMatch("Jujutsu Kaisen", "1", "[SubsPlease] Jujutsu Kaisen - 01 (1080p)")); // true
console.log(testMatch("Jujutsu Kaisen", "1", "[SubsPlease] Jujutsu Kaisen 2nd Season - 01")); // false
console.log(testMatch("Sword Art Online", "1", "[Erai-raws] Sword Art Online Alicization - 01")); // false
console.log(testMatch("Bleach", "1", "[Erai-raws] Bleach Sennen Kessen-hen - 01")); // false
