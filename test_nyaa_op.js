import { si } from 'nyaapi';
async function test() {
  const query = "One Piece 1161 1080p";
  const results = await si.search(query, 20, { category: '1_2' });
  console.log('Query:', query);
  for (const r of results.slice(0, 5)) {
    console.log(r.name);
  }
}
test();
