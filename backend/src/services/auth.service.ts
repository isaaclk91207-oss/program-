import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import { config } from "../config";
import { generateToken } from "../middlewares/auth.middleware";
import { createAppError } from "../middlewares/error.middleware";
import { LoginRequest, LoginResponse } from "../types";

export class AuthService {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw createAppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw createAppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role as "ADMIN" | "DRIVER" | "PASSENGER",
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
    role: "ADMIN" | "DRIVER" | "PASSENGER";
    phone?: string;
  }): Promise<LoginResponse> {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw createAppError(409, "USER_EXISTS", "A user with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, config.bcryptSaltRounds);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role,
        phone: data.phone,
      },
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role as "ADMIN" | "DRIVER" | "PASSENGER",
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        driverProfile: {
          include: {
            currentVehicle: true,
            assessments: true,
          },
        },
        passengerProfile: true,
      },
    });

    if (!user) {
      throw createAppError(404, "USER_NOT_FOUND", "User not found");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      driverProfile: user.driverProfile,
      passengerProfile: user.passengerProfile,
    };
  }
}

export const authService = new AuthService();
