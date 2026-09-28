const r = { name: "[FFA] Jujutsu Kaisen (TV) - 01 [1080p][HEVC][Multiple Subtitle].mkv" };
const isBrowserCompatible = (r) => !/hevc/i.test(r.name) && !/x265/i.test(r.name) && !/10-?bit/i.test(r.name) && !/av1/i.test(r.name);
console.log(isBrowserCompatible(r));
