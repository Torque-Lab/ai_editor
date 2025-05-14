import { s3 } from "../utils/s3";
import { handleError } from "../utils/controller.util";
import { Request, Response } from "express";
import dotenv from "dotenv";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
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
    
      
    console.log(params);
try{
    const uploadUrl=await createPresignedPost(s3,params);
    res.status(200).json({uploadUrl,key});
}
catch(error){
    handleError(res, error, "Failed to create upload URL");
}
}