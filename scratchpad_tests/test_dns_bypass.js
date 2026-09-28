import https from 'https';
import axios from 'axios';
import { Resolver } from 'dns/promises';

const resolver = new Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1']);

async function testBypass() {
  const domain = 'hianime.to';
  try {
    console.log(`Resolving ${domain} via 8.8.8.8...`);
    const addresses = await resolver.resolve4(domain);
    console.log(`Addresses:`, addresses);

    const ip = addresses[0];
    console.log(`Testing connection to ${ip} with Host: ${domain}...`);

    const agent = new https.Agent({
      servername: domain, // Crucial for SNI
      rejectUnauthorized: false // Sometimes needed for Cloudflare
    });

    const response = await axios.get(`https://${ip}`, {
      headers: {
        'Host': domain,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      httpsAgent: agent,
      timeout: 10000
    });

    console.log(`Success! Status: ${response.status}`);
    console.log(`Title:`, response.data.match(/<title>(.*?)<\/title>/)?.[1]);
  } catch (err) {
    console.error(`Bypass failed:`, err.message);
    if (err.response) console.error(`Response data:`, err.response.data.substring(0, 100));
  }
}

testBypass();
