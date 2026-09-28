function test(name, ep) {
    const epRegex = new RegExp(`(?:\\b|e|ep|_|s\\d{1,2}e|-)0*${ep}(?:v\\d)?\\b`, 'i');
    console.log(epRegex.test(name), name, ep);
}

test("[SubsPlease] Jujutsu Kaisen - 01 (1080p)", 1);
test("[SubsPlease] Jujutsu Kaisen - Kaigyoku Gyokusetsu (1080p)", 1);
test("JUJUTSU KAISEN S02 MULTi 1080p DSNP WEB-DL AAC2.0 H.264", 1);
test("One Piece S01E1161 1080p NF WEB-DL", 1161);
test("[ToonsHub] One Piece EP1161 1080p", 1161);
test("Dragon.Ball.Kai.S01.1080p", 1);
test("Dragon Ball Episode 001", 1);
test("Jujutsu Kaisen S2 - 01 (25)", 25);
test("Jujutsu Kaisen S2 - 01 (25)", 1);
