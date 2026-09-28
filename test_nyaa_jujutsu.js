import { si } from 'nyaapi';
async function test() {
  const query = "jujutsu kaisen tv 01 1080p";
  const results = await si.search(query, 50, { category: '1_2' });
  const isNotBatch = (r) => !/\b\d{1,3}\s*-\s*\d{2,4}\b/.test(r.name) && !/batch/i.test(r.name) && !/~\s*\d{2,3}/.test(r.name) && !/complete/i.test(r.name);
  const isBrowserCompatible = (r) => !/hevc/i.test(r.name) && !/x265/i.test(r.name) && !/10-?bit/i.test(r.name) && !/av1/i.test(r.name);
  const isValid = (r) => isNotBatch(r) && isBrowserCompatible(r);
  const valids = results.filter(isValid);
  console.log("Valids count:", valids.length);
}
test();
