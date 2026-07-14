async function main() {
  try {
    const params = new URLSearchParams();
    params.append('email', 'admin@primewealth.com');
    params.append('password', 'admin123');
    params.append('redirect', 'false');

    const res = await fetch("http://localhost:3000/api/auth/callback/credentials", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": "next-auth.csrf-token=dummy_csrf"
      },
      body: params.toString() + "&csrfToken=dummy_csrf"
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch(e) {
    console.error("Fetch error:", e);
  }
}
main();
