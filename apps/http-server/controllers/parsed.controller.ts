import express, { Request, Response } from "express"
import parseToFFmpeg from "../utils/llm"

export const parsedCommand = async(req: Request, res: Response) => {
    try {
        const { command } = req.body;
        
        if (!command) {
        res.status(400).json({ error: "Command is required" });
        return
        }
        
        const result = await parseToFFmpeg(command);
         res.status(200).json({ result });
    } catch (error) {
        console.error("Error parsing command:", error);
        res.status(500).json({ error: "Failed to process command" });
    }
}