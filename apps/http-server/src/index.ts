
import express from "express";
import authRoutes from "../routes/auth.routes";
import cors from "cors";

export const app: express.Application = express();
app.use(express.json());
app.use(cors());
app.use("/api/auth", authRoutes);

app.get("/health", (req, res) => {
    res.status(200).json({ message: "OK" });
})
