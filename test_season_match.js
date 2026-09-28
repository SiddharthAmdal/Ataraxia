function isSeasonMatch(showName, torrentName) {
    const s2Regex = /(?:s0?2|2nd season|season 2)/i;
    const s3Regex = /(?:s0?3|3rd season|season 3)/i;
    const s4Regex = /(?:s0?4|4th season|season 4)/i;

    const showHasS2 = s2Regex.test(showName);
    const showHasS3 = s3Regex.test(showName);
    const showHasS4 = s4Regex.test(showName);

    if (!showHasS2 && s2Regex.test(torrentName)) return false;
    if (!showHasS3 && s3Regex.test(torrentName)) return false;
    if (!showHasS4 && s4Regex.test(torrentName)) return false;

    return true;
}
console.log(isSeasonMatch("Jujutsu Kaisen", "Jujutsu Kaisen 2nd Season - 01")); // false
console.log(isSeasonMatch("Jujutsu Kaisen", "JUJUTSU KAISEN S03E11")); // false
console.log(isSeasonMatch("Jujutsu Kaisen", "[SubsPlease] Jujutsu Kaisen - 01")); // true
console.log(isSeasonMatch("Jujutsu Kaisen Season 2", "Jujutsu Kaisen 2nd Season - 01")); // true
