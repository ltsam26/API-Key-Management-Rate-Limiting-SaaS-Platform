const key = process.argv[2];
const url = 'http://localhost:5000/api/public/data';

async function runTest() {
  for (let i = 1; i <= 15; i++) {
    try {
      const start = Date.now();
      const res = await fetch(url, { headers: { 'x-api-key': key } });
      const text = await res.text();
      const remain = res.headers.get('x-ratelimit-remaining');
      console.log(`Req ${i} (${Date.now() - start}ms): Status ${res.status} | Remaining: ${remain}`);
    } catch(e) {
      console.error(`Req ${i} Error:`, e.message);
    }
  }
}
runTest();
