
import express from "express";
import authRoutes from "../routes/auth.routes";
import cors from "cors";
import parseRoutes from "../routes/commandParser.routes"
// import s3Routes from "../routes/s3.routes";
// import { createVideo } from "../../../packages/backend-common/S3/s3.controller";
export const app: express.Application = express();
app.use(express.json());
app.use(cors());
app.use("/api/auth", authRoutes);
 app.get("/health", (req, res) => {
    res.status(200).json({ message: "OK" });
})
// app.use("/api", s3Routes);
// app.use("/api",createVideo)

app.use("/api",parseRoutes)