const url = "https://xdukkkohkqjubpojxpnd.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkdWtra29oa3FqdWJwb2p4cG5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzU2MTkxNCwiZXhwIjoyMDkzMTM3OTE0fQ.ARRMTPDAhzd8oEJX3tr3JHuS4eG2zKhQQHbhWt_ELV0";

async function check() {
  const resp = await fetch(`${url}/rest/v1/profiles?select=*&limit=1`, {
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`
    }
  });
  if (!resp.ok) {
    console.error("Profiles check error:", await resp.text());
  } else {
    const data = await resp.json();
    console.log("Profiles columns found:", Object.keys(data[0] || {}));
  }
}

check();
