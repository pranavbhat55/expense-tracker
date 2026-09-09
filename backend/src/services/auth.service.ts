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

    const result = await prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
            data: {
                name: `${data.name}'s Organization`,
            },
        });

        const user = await tx.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                tenantId: tenant.id,
            },
        });

        return { user, tenant };
    });

    return {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        tenantId: result.tenant.id,
        tenantName: result.tenant.name,
        createdAt: result.user.createdAt,
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
        include: {
            tenant: true,
        },
    });

    if (!user) {
        throw new AppError("Invalid email or password", 401);
    }

    if (!user.tenantId || !user.tenant) {
        throw new AppError(
            "User is not associated with a tenant",
            403,
        );
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
            tenantId: user.tenantId,
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
            tenantId: user.tenantId,
            tenantName: user.tenant.name,
        },
    };
}