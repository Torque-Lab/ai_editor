import express from "express";
import { createUploadUrl } from "../controllers/s3.controller";

const router: express.Router = express.Router();

router.get("/upload", createUploadUrl);

export default router;