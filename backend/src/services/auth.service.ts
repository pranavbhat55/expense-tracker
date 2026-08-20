import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { AppError } from "../utils/AppError.js";
import { prisma } from "./prisma.js";
import { jwtSecret } from "../config/env.js";
export async function registerUser(data: {
    name: string;
    email: string;
    password: string;
}) {
    const existingUser = await prisma.user.findUnique({
        where: {
            email: data.email,
        },
    });

    if (existingUser) {
        throw new AppError("Email already registered", 409);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
        },
    });

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
    };
}
export async function loginUser(data: {
    email: string;
    password: string;
}) {
    const user = await prisma.user.findUnique({
        where: {
            email: data.email,
        },
    });

    if (!user) {
        throw new AppError("Invalid email or password", 401);
    }

    const passwordMatches = await bcrypt.compare(
        data.password,
        user.password,
    );

    if (!passwordMatches) {
        throw new AppError("Invalid email or password", 401);
    }

    const token = jwt.sign(
        {
            userId: user.id,
            email: user.email,
        },
        jwtSecret,
        {
            expiresIn: "1h",
        },
    );

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
        },
    };
}