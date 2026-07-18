import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

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

    // Validate size (10 MB)
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
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "primewealth_kyc";

    if (!cloudName || cloudName.trim() === "" || cloudName === "your_cloudinary_cloud_name") {
      console.error("[Upload API] Cloudinary configuration is missing.");
      return NextResponse.json(
        { success: false, message: "Cloudinary configuration is missing.", error: "Configuration Error" },
        { status: 500 }
      );
    }

    console.log(`[Upload API] Upload received. Size: ${file.size}, Type: ${file.type}`);
    console.log(`[Upload API] Cloudinary upload started for cloud: ${cloudName}, preset: ${uploadPreset}`);

    cloudinary.config({ cloud_name: cloudName });

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Perform actual upload using Cloudinary Node SDK
    try {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.unsigned_upload_stream(
          uploadPreset,
          { resource_type: "auto" },
          (error, result) => {
            if (error) {
              return reject(error);
            }
            resolve(result);
          }
        );
        stream.end(buffer);
      });

      const data = uploadResult as any;
      console.log(`[Upload API] Cloudinary response successful. secure_url: ${data.secure_url}, public_id: ${data.public_id}`);

      return NextResponse.json({ 
        success: true, 
        url: data.secure_url, 
        public_id: data.public_id 
      });
    } catch (uploadError: any) {
      console.error("[Upload API] Cloudinary upload failed:", uploadError);
      return NextResponse.json(
        { success: false, message: "Failed to upload document to cloud storage.", error: uploadError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[Upload API] Unhandled Exception:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error during upload operations.", error: error.message },
      { status: 500 }
    );
  }
}
