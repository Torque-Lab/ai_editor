import express from "express";
import { createUploadUrl, createVideo } from "../controllers/s3.controller";

const router: express.Router = express.Router();

router.get("/upload", createUploadUrl);
router.post("/video-entry", createVideo);

export default router;