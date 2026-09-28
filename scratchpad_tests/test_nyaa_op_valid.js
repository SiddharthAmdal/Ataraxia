import { si } from 'nyaapi';
async function test() {
  const query = "One Piece 1161 1080p";
  const results = await si.search(query, 20, { category: '1_2' });
  const isNotBatch = (r) => !/01-\d{2,3}/.test(r.name) && !/batch/i.test(r.name) && !/~\s*\d{2,3}/.test(r.name) && !/complete/i.test(r.name) && !/,/.test(r.name);
  const isBrowserCompatible = (r) => !/hevc/i.test(r.name) && !/x265/i.test(r.name) && !/10bit/i.test(r.name);
  const isValid = (r) => isNotBatch(r) && isBrowserCompatible(r);

  const valids = results.filter(isValid);
  console.log("Valids count:", valids.length);
  for (const v of valids.slice(0, 3)) console.log(v.name);
}
test();
