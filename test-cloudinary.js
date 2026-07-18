// no dotenv
const fs = require('fs');

async function testUpload() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "prime_wealth_avatars";

  if (!cloudName || cloudName === "your_cloudinary_cloud_name") {
    console.log("❌ ERROR: Cloudinary cloud name is still set to default or missing.");
    return;
  }

  console.log(`Testing connection for Cloud Name: ${cloudName}`);
  console.log(`Using Preset: ${uploadPreset}`);

  // Create a 1px base64 dummy image
  const base64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  
  const formData = new FormData();
  formData.append("file", base64Image);
  formData.append("upload_preset", uploadPreset);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      console.log("✅ SUCCESS: Uploaded test image!");
      console.log("URL:", data.secure_url);
      console.log("Public ID:", data.public_id);
    } else {
      console.log("❌ FAILED:", data);
    }
  } catch (error) {
    console.log("❌ EXCEPTION:", error);
  }
}

testUpload();
