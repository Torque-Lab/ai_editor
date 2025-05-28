
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { S3Client } from "@aws-sdk/client-s3";
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

export const createUploadUrl = async () => {
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
    return uploadUrl;
}
catch(error){
   console.log("failed to upload ",error)
}
}
