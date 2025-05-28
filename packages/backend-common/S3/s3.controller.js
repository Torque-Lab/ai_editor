"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUploadUrl = exports.s3 = void 0;
const s3_presigned_post_1 = require("@aws-sdk/s3-presigned-post");
const client_s3_1 = require("@aws-sdk/client-s3");
function generateRandomString(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
exports.s3 = new client_s3_1.S3Client({
    region: process.env.AWS_REGION || "",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
});
const createUploadUrl = async () => {
    const videoId = generateRandomString(18);
    const key = `ai_editor/${videoId}.mp4`;
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME || "",
        Key: key,
        Expires: 60,
        Conditions: [
            ["content-length-range", 0, 50 * 1024 * 1024],
            ["eq", "$Content-Type", "video/mp4"],
        ],
        Fields: {
            "Content-Type": "video/mp4",
        },
    };
    try {
        const uploadUrl = await (0, s3_presigned_post_1.createPresignedPost)(exports.s3, params);
        return uploadUrl;
    }
    catch (error) {
        console.log("failed to upload ", error);
    }
};
exports.createUploadUrl = createUploadUrl;
