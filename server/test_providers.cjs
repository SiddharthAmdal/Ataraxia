const { ANIME } = require('@consumet/extensions');
async function test() {
  for (const name of Object.keys(ANIME)) {
    try {
      console.log(`Testing ${name}...`);
      const provider = new ANIME[name]();
      const res = await provider.search('one piece');
      if (res.results && res.results.length > 0) {
        console.log(`${name} WORKS! Found: ${res.results[0].title}`);
      } else {
        console.log(`${name} returned 0 results`);
      }
    } catch (e) {
      console.log(`${name} FAILED: ${e.message}`);
    }
  }
}
test();
