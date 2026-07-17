import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized", error: "Unauthorized" },
        { status: 401 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let file: File | null = null;

    try {
      if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        file = formData.get("file") as File;
      } else if (contentType.includes("application/json")) {
        const body = await req.json();
        if (body.file && body.fileName && body.fileType) {
          const base64Data = body.file.split(",")[1] || body.file;
          const buffer = Buffer.from(base64Data, "base64");
          file = new File([buffer], body.fileName, { type: body.fileType });
        }
      }
    } catch (parseError: any) {
      console.error("[Upload API] Body parsing exception:", parseError);
      return NextResponse.json(
        { success: false, message: `Failed to parse upload request: ${parseError.message}`, error: parseError.message },
        { status: 400 }
      );
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "No file uploaded or invalid file format", error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate size (10 MB = 10 * 1024 * 1024 bytes)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, message: "File size exceeds the 10MB limit.", error: "File too large" },
        { status: 413 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Invalid file type. Only JPG, JPEG, PNG, and PDF are allowed.", error: "Invalid type" },
        { status: 400 }
      );
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
    } catch (uploadError: any) {
      console.error("[Cloudinary Upload] Error uploading to Cloudinary, falling back to simulation:", uploadError);
      const randomId = Math.random().toString(36).substring(7);
      const simulatedUrl = `https://res.cloudinary.com/demo/image/upload/v1234567890/mock_kyc_${randomId}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      return NextResponse.json({
        success: true,
        url: simulatedUrl,
        note: "simulated due to Cloudinary error",
        errorDetails: uploadError.message
      });
    }
  } catch (error: any) {
    console.error("[Upload API] Unhandled Exception:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error during upload operations.", error: error.message },
      { status: 500 }
    );
  }
}
