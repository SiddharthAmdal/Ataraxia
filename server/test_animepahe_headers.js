import axios from 'axios';

async function testAnimePaheCom() {
  try {
    console.log("Testing animepahe.com with realistic headers...");
    const response = await axios.get('https://animepahe.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'max-age=0',
        'Sec-Ch-Ua': '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 10000
    });
    console.log("Status:", response.status);
    console.log("Title:", response.data.match(/<title>(.*?)<\/title>/)?.[1]);
  } catch (err) {
    console.error("Test failed:", err.message);
    if (err.response) {
        console.error("Status:", err.response.status);
        console.error("Headers:", err.response.headers);
    }
  }
}

testAnimePaheCom();
