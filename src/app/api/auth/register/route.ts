import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate input
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid input data";
      return NextResponse.json({ success: false, message }, { status: 400 });
    }

    const { name, email, password, phone } = parsed.data;

    // Check for existing account
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // SECURITY: Role is always "user" — admin accounts are never created via public registration
    await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "user",
        phone: phone || null,
        balance: 0.0,
        savings: 0.0,
        investments: 0.0,
        tier: "None",
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
        job: "Wealth Advisory Member",
        cards: {
          create: {
            number: `**** **** **** ${Math.floor(1000 + Math.random() * 9000)}`,
            name: name,
            expiry: "09/30",
            cvv: String(Math.floor(100 + Math.random() * 900)),
            type: "visa",
            balance: 0.0,
          },
        },
        notifications: {
          create: {
            title: "Welcome to Prime Wealth",
            message:
              "Your premium account setup is complete.\n\nStart your investment journey today by selecting one of our investment plans and begin growing your portfolio with our secure investment platform.",
            type: "success",
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, message: "Account created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Register API] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
