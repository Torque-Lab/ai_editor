import express from "express";
import { createUploadUrl } from "../controllers/s3.controller";

const router: express.Router = express.Router();

router.get("/create-upload-url", createUploadUrl);

export default router;