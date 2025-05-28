import express from "express"
import { parsedCommand } from "../controllers/parsed.controller"
const router: express.Router = express.Router();
router.post("/parse",parsedCommand)


export default router;