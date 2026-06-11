import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ success: false, message: "Email already registered" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        balance: 10000.00, // Preseed new users with a warm welcome balance
        savings: 2500.00,
        investments: 0.00,
        tier: "starter",
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
        job: "Wealth Advisory Member",
        cards: {
          create: {
            number: `**** **** **** ${Math.floor(1000 + Math.random() * 9000)}`,
            name: name,
            expiry: "09/30",
            cvv: String(Math.floor(100 + Math.random() * 900)),
            type: "visa",
            balance: 2000.00,
          }
        },
        notifications: {
          create: {
            title: "Welcome to Prime Wealth",
            message: "Your premium account setup is complete. Enjoy $10,000.00 complimentary starter balance.",
            type: "success",
          }
        }
      },
    });

    return NextResponse.json({ success: true, message: "Account created successfully" }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Invalid input data" }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
