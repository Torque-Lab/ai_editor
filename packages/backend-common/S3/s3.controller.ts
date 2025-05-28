import { handleError } from "../../../apps/http-server/utils/controller.util";
import { Request, Response } from "express";
import dotenv from "dotenv";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { S3Client } from "@aws-sdk/client-s3";
import { prisma } from "@repo/db/client";
dotenv.config();
function generateRandomString(length: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export const s3 = new S3Client({
  region: process.env.AWS_REGION || "",
  credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export const createUploadUrl = async (req: Request, res: Response) => {
    const videoId=generateRandomString(18);
    const key=`ai_editor/${videoId}.mp4`;
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME || "",
      Key: key,
      Expires: 60,
      Conditions: [
        ["content-length-range", 0, 50 * 1024 * 1024] as ["content-length-range", number, number],
        ["eq", "$Content-Type", "video/mp4"] as ["eq", string, string],
      ],
      Fields: {
        "Content-Type": "video/mp4",
      },
    };
    
try{
    const uploadUrl=await createPresignedPost(s3,params);
    res.status(200).json({uploadUrl});
}
catch(error){
    handleError(res, error, "Failed to create upload URL");
}
}


export const createVideo = async (req: Request, res: Response) => {
    try {
        const { fileUrl } = req.body;
        const userId = "54545454";
        const video = await prisma.video.create({
            data: {
                fileUrl,
                userId,
              },
        });
        res.status(201).json({ video });
    } catch (error) {
        handleError(res, error, "Failed to create video");
    }
}