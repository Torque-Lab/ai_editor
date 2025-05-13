import {Response} from "express";
import bcrypt from "bcrypt";

export const handleError = (res: Response, error: any, message: string = 'Internal server error') => {
    console.error(`Error: ${message}`, error);
    return res.status(500).json({ error: message });
  };
  
  export const hashPassword = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, 10);
  };
  
  export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
    return await bcrypt.compare(password, hashedPassword);
  };