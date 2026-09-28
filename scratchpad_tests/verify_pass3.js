import fetch from 'node-fetch';

async function testAll() {
  const apiUrl = 'http://localhost:4000/api';
  
  console.log("--- 2. AUTHENTICATION VERIFICATION ---");
  let res = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'wrong' })
  });
  console.log("Invalid login status:", res.status); // Expect 401

  res = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'ataraxia' })
  });
  console.log("Valid login status:", res.status); // Expect 200
  const authData = await res.json();
  const token = authData.token;
  console.log("Received token:", !!token);

  res = await fetch(`${apiUrl}/progress`);
  console.log("Protected route without token:", res.status); // Expect 401

  res = await fetch(`${apiUrl}/progress`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log("Protected route with token:", res.status); // Expect 200

  res = await fetch(`${apiUrl}/progress`, {
    headers: { 'Authorization': `Bearer fake_token` }
  });
  console.log("Protected route with fake token:", res.status); // Expect 401


  console.log("\n--- 3. SSRF VERIFICATION ---");
  const ssrfTests = [
    "http://localhost:8080",
    "http://127.0.0.1:80",
    "http://0.0.0.0",
    "http://192.168.1.1",
    "http://10.0.0.1",
    "http://169.254.169.254/latest/meta-data/",
    "http://[::1]",
    "http://[::ffff:127.0.0.1]",
    "not_a_url",
    "ftp://example.com"
  ];
  
  for (const t of ssrfTests) {
    let ssrfRes = await fetch(`${apiUrl}/playback/proxy?target=${encodeURIComponent(t)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`SSRF Proxy test '${t}' ->`, ssrfRes.status); // Expect 400
  }

  let validRes = await fetch(`${apiUrl}/playback/proxy?target=${encodeURIComponent("https://google.com")}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(`SSRF Valid Proxy test ->`, validRes.status); // Expect 200/301/302

  console.log("\n--- 5. CORS VERIFICATION ---");
  let corsRes = await fetch(`${apiUrl}/health`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:5173',
      'Access-Control-Request-Method': 'GET'
    }
  });
  console.log("CORS Trusted Origin:", corsRes.headers.get('access-control-allow-origin')); // Expect origin

  let corsResFail = await fetch(`${apiUrl}/health`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://evil.com',
      'Access-Control-Request-Method': 'GET'
    }
  });
  console.log("CORS Untrusted Origin:", corsResFail.headers.get('access-control-allow-origin')); // Expect null or omitted


  console.log("\n--- 7. TORRENT FALLBACK VERIFICATION ---");
  try {
    let torRes = await fetch(`${apiUrl}/streaming/torrent?query=${encodeURIComponent("One Piece 1089")}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log("Torrent request status:", torRes.status);
    let data = await torRes.json();
    console.log("Torrent response URLs:", data.sources?.[0]?.url);
  } catch (e) {
    console.log("Torrent Error", e.message);
  }
}

testAll().catch(console.error);
