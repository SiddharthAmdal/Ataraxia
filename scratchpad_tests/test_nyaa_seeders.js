import { si } from 'nyaapi';
async function run() {
  const results = await si.search('One Piece 1161 1080p', 10, { category: '1_2' });
  results.sort((a, b) => parseInt(b.seeders) - parseInt(a.seeders));
  for (const r of results) {
    console.log(`${r.seeders} seeders: ${r.name}`);
  }
}
run();
