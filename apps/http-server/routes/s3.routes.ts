import express from "express";
import { createUploadUrl, createVideo } from "../../../packages/backend-common/S3/s3.controller";

const router: express.Router = express.Router();

router.get("/upload", createUploadUrl);
router.post("/video-entry", createVideo);

export default router;