import fetch from "node-fetch";

async function testUrl(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      }
    });
    console.log(url, "Status:", res.status);
    const text = await res.text();
    console.log(url, "Length:", text.length, "Starts with:", text.substring(0, 50).replace(/\n/g, ' '));
  } catch (e) {
    console.log(url, "Failed:", e.message);
  }
}

async function test() {
  await testUrl("https://gogoanime3.co/search.html?keyword=dragon");
  await testUrl("https://gogoanime.hu/search.html?keyword=dragon");
  await testUrl("https://gogoanime3.net/search.html?keyword=dragon");
}
test();
