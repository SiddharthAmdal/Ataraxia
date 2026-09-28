import { si } from 'nyaapi';
async function test() {
  const query = "Jujutsu Kaisen 01 1080p";
  const results = await si.search(query, 20, { category: '1_2' });
  const isNotBatch = (r) => !/\b\d{1,3}\s*-\s*\d{2,4}\b/.test(r.name) && !/batch/i.test(r.name) && !/~\s*\d{2,3}/.test(r.name) && !/complete/i.test(r.name);
  const isBrowserCompatible = (r) => !/hevc/i.test(r.name) && !/x265/i.test(r.name) && !/10bit/i.test(r.name) && !/av1/i.test(r.name);
  const epRegex = new RegExp(`(?:\\b|e|ep|_|s\\d{1,2}e|-)0*1(?:v\\d)?\\b`, 'i');
  const isEpisodeMatch = (r) => epRegex.test(r.name);
  const title = "JUJUTSU KAISEN";
  const isSeasonMatch = (r) => {
      const s2Regex = /(?:s0?2|2nd season|season 2)/i;
      const s3Regex = /(?:s0?3|3rd season|season 3)/i;
      const s4Regex = /(?:s0?4|4th season|season 4)/i;
      if (!s2Regex.test(title) && s2Regex.test(r.name)) return false;
      if (!s3Regex.test(title) && s3Regex.test(r.name)) return false;
      if (!s4Regex.test(title) && s4Regex.test(r.name)) return false;
      if (!/movie/i.test(title) && /(?:movie|gekijouban)/i.test(r.name)) return false;
      if (!title.includes(':') && r.name.includes(':')) return false;
      return true;
  };
  const isValid = (r) => isNotBatch(r) && isBrowserCompatible(r) && isEpisodeMatch(r) && isSeasonMatch(r);
  const valids = results.filter(isValid);
  console.log("Valids count:", valids.length);
  for (const v of valids.slice(0, 3)) console.log(v.name);
}
test();
