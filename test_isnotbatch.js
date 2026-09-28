const name = "[FFA] Jujutsu Kaisen (TV) - 01 [1080p][HEVC][Multiple Subtitle].mkv";
const isNotBatch = (r) => !/01-\d{2,3}/.test(r.name) && !/batch/i.test(r.name) && !/~\s*\d{2,3}/.test(r.name) && !/complete/i.test(r.name) && !/,/.test(r.name);
console.log(isNotBatch({name}));
