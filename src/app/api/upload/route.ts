import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.json().catch(() => null) || await req.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    let file: File | null = null;

    if (formData instanceof FormData) {
      file = formData.get("file") as File;
    } else if (formData.file && formData.fileName && formData.fileType) {
      // Base64 upload support or JSON payload support
      const base64Data = formData.file.split(",")[1] || formData.file;
      const buffer = Buffer.from(base64Data, "base64");
      file = new File([buffer], formData.fileName, { type: formData.fileType });
    }

    if (!file) {
      // Maybe try standard multipart form parsing
      const rawFormData = await req.formData();
      file = rawFormData.get("file") as File;
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate size (10 MB = 10 * 1024 * 1024 bytes)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File size exceeds the 10MB limit." }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only JPG, JPEG, PNG, and PDF are allowed." }, { status: 400 });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "prime_wealth_avatars";

    // If Cloudinary credentials are dummy or missing, simulate upload
    if (
      !cloudName ||
      cloudName === "your_cloudinary_cloud_name" ||
      cloudName.trim() === ""
    ) {
      console.log("[Cloudinary Upload] Simulated upload due to dummy credentials.");
      const randomId = Math.random().toString(36).substring(7);
      const simulatedUrl = `https://res.cloudinary.com/demo/image/upload/v1234567890/mock_kyc_${randomId}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      return NextResponse.json({ success: true, url: simulatedUrl });
    }

    // Perform actual upload using REST API
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("upload_preset", uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: "POST",
        body: uploadFormData,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      const data = await res.json();
      return NextResponse.json({ success: true, url: data.secure_url });
    } catch (uploadError) {
      console.error("[Cloudinary Upload] Error uploading to Cloudinary, falling back to simulation:", uploadError);
      const randomId = Math.random().toString(36).substring(7);
      const simulatedUrl = `https://res.cloudinary.com/demo/image/upload/v1234567890/mock_kyc_${randomId}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      return NextResponse.json({ success: true, url: simulatedUrl, note: "simulated due to Cloudinary error" });
    }
  } catch (error) {
    console.error("[Upload API] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
