import express from "express";
import { signIn, signUp } from "../controllers/auth.controller";

const router: express.Router = express.Router();

router.post("/signup", signUp);
router.post("/signin", signIn);

export default router;
