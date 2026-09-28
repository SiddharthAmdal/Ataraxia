import { si } from 'nyaapi';
async function test() {
  const query = "\"Dragon Ball\" 01 1080p";
  const results = await si.search(query, 20, { category: '1_2' });
  for (const v of results) console.log(v.seeders, v.name);
}
test();
