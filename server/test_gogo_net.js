import axios from 'axios';

async function testGogo() {
  const url = "https://gogoanime3.net/search.html?keyword=dragon";
  try {
    console.log(`Testing ${url}...`);
    const res = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      },
      timeout: 10000
    });
    console.log("Status:", res.status);
    console.log("Length:", res.data.length);
  } catch (err) {
    console.log("Failed:", err.message);
  }
}
testGogo();
