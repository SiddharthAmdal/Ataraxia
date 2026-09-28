import { si } from 'nyaapi';
async function run() {
  const results = await si.search('ONE PIECE 1161 1080p', 1, { category: '1_2' });
  if (results.length > 0) {
    console.log(JSON.stringify(results[0], null, 2));
  } else {
    console.log('No results');
  }
}
run();
