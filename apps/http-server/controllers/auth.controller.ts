

import {Request, Response} from "express";
import { SignInSchema, SignUpSchema } from "../types/authType";
import { comparePassword, hashPassword } from "../utils/controller.util";
import { prisma } from "@repo/db/client";
import { handleError } from "../utils/controller.util";


export const signUp = async (req: Request, res: Response) => {
    try {
       const parsedData = SignUpSchema.safeParse(req.body);
       if(!parsedData.success) {
         res.status(400).json({ error: "Invalid data" });
         return;
       }
       const { username, password, name } = parsedData.data;
       const hashedPassword = await hashPassword(password);
       const user = await prisma.user.create({
        data: {
            username,
            password: hashedPassword,
            name,
        }
       });
       res.status(201).json({ message: "User created successfully" });
    } catch (error) {
         handleError(res, error, "Failed to create user");
    }
};

export const signIn = async (req: Request, res: Response) => {
    try {
       const parsedData = SignInSchema.safeParse(req.body);
       if(!parsedData.success) {
         res.status(400).json({ error: "Invalid data" });
         return;
       }
       const { username, password } = parsedData.data;
       const user = await prisma.user.findUnique({
        where: {
            username,
        }
       });
       if(!user) {
         res.status(401).json({ error: "Invalid credentials" });
         return;
       }
       const isPasswordValid = await comparePassword(password, user.password);
       if(!isPasswordValid) {
         res.status(401).json({ error: "Invalid credentials" });
         return;
       }
       res.status(200).json({ message: "User signed in successfully" });
    } catch (error) {
         handleError(res, error, "Failed to sign in user");
    }
};
