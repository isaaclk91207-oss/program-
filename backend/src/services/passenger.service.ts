import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import { config } from "../config";
import { createAppError } from "../middlewares/error.middleware";
import { CreatePassengerDto } from "../types";

export interface PassengerResponse {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  department: string;
}

class PassengerService {
  async create(data: CreatePassengerDto): Promise<PassengerResponse> {
    if (!data.name?.trim() || !data.email?.trim() || !data.password || !data.department?.trim()) {
      throw createAppError(400, "MISSING_FIELDS", "Name, email, password and department are required");
    }
    if (data.password.length < 6) {
      throw createAppError(400, "WEAK_PASSWORD", "Password must be at least 6 characters");
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw createAppError(409, "USER_EXISTS", "A user with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, config.bcryptSaltRounds);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        role: "PASSENGER",
        passengerProfile: {
          create: { department: data.department },
        },
      },
      include: { passengerProfile: true },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      department: user.passengerProfile!.department,
    };
  }
}

export const passengerService = new PassengerService();
