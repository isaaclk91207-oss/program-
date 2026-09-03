"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const config_1 = require("../config");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const error_middleware_1 = require("../middlewares/error.middleware");
const prisma = new client_1.PrismaClient();
class AuthService {
    async login(data) {
        const user = await prisma.user.findUnique({
            where: { email: data.email },
        });
        if (!user) {
            throw (0, error_middleware_1.createAppError)(401, "INVALID_CREDENTIALS", "Invalid email or password");
        }
        const isPasswordValid = await bcrypt_1.default.compare(data.password, user.password);
        if (!isPasswordValid) {
            throw (0, error_middleware_1.createAppError)(401, "INVALID_CREDENTIALS", "Invalid email or password");
        }
        const token = (0, auth_middleware_1.generateToken)({
            id: user.id,
            email: user.email,
            role: user.role,
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
    async register(data) {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existingUser) {
            throw (0, error_middleware_1.createAppError)(409, "USER_EXISTS", "A user with this email already exists");
        }
        const hashedPassword = await bcrypt_1.default.hash(data.password, config_1.config.bcryptSaltRounds);
        const user = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                role: data.role,
                phone: data.phone,
            },
        });
        const token = (0, auth_middleware_1.generateToken)({
            id: user.id,
            email: user.email,
            role: user.role,
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
    async getMe(userId) {
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
            throw (0, error_middleware_1.createAppError)(404, "USER_NOT_FOUND", "User not found");
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
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map