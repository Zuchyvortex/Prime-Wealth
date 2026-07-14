async function main() {
  try {
    const res = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "API Test",
        email: "apitest@example.com",
        password: "password123",
        phone: "1234567890"
      })
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch(e) {
    console.error("Fetch error:", e);
  }
}
main();
