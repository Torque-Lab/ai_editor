import { s3 } from "../../../packages/backend-common/S3/s3.controller";
import { Request, Response } from "express";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { handleError } from "../utils/controller.util";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";


const TEMP_DIR = path.join(os.tmpdir(), 'ai_editor_videos');

if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Fetch a video from S3 by its key
 */
export const fetchVideo = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        
        if (!key) {
            return res.status(400).json({ error: "Video key is required" });
        }
        
        // Create a local file path for the downloaded video
        const localFilePath = path.join(TEMP_DIR, path.basename(key));
        
        // Create a write stream to save the file locally
        const fileStream = fs.createWriteStream(localFilePath);
        
        // Get the object from S3
        const getObjectParams = {
            Bucket: process.env.AWS_BUCKET_NAME || "",
            Key: key
        };
        
        const command = new GetObjectCommand(getObjectParams);
        const response = await s3.send(command);
        
        if (!response.Body) {
            return res.status(404).json({ error: "Video not found" });
        }
        
        // Stream the file to local storage
        await new Promise<void>((resolve, reject) => {
            if (!response.Body) return reject(new Error("No response body"));
            
            const stream = response.Body as any;
            stream.pipe(fileStream);
            
            fileStream.on('finish', () => {
                resolve();
            });
            
            fileStream.on('error', (err) => {
                reject(err);
            });
        });
        
        res.status(200).json({ 
            message: "Video fetched successfully", 
            localPath: localFilePath 
        });
    } catch (error) {
        handleError(res, error, "Failed to fetch video");
    }
};

/**
 * Process a video using FFmpeg based on LLM commands
 */
export const processVideo = async (req: Request, res: Response) => {
    try {
        const { localPath, commands } = req.body;
        
        if (!localPath || !commands || !Array.isArray(commands)) {
            return res.status(400).json({ 
                error: "Both localPath and commands array are required" 
            });
        }
        
        // Create output file path
        const outputPath = path.join(TEMP_DIR, `edited_${path.basename(localPath)}`);
        
        // Convert LLM commands to FFmpeg arguments
        const ffmpegArgs = convertLLMCommandsToFFmpeg(commands, localPath, outputPath);
        
        // Execute FFmpeg with the generated arguments
        const result = await executeFFmpeg(ffmpegArgs);
        
        // Upload the processed video back to S3
        const newKey = `ai_editor/edited_${path.basename(localPath)}`;
        await uploadToS3(outputPath, newKey);
        
        // Generate a presigned URL for the new video
        const url = await generatePresignedUrl(newKey);
        
        // Clean up temporary files
        fs.unlinkSync(localPath);
        fs.unlinkSync(outputPath);
        
        res.status(200).json({ 
            message: "Video processed successfully", 
            url,
            key: newKey,
            ffmpegOutput: result
        });
    } catch (error) {
        handleError(res, error, "Failed to process video");
    }
};

/**
 * Convert LLM commands to FFmpeg arguments
 */
function convertLLMCommandsToFFmpeg(commands: string[], inputPath: string, outputPath: string): string[] {
    // Start with input file
    const args = ['-i', inputPath];
    
    // Process each command and add corresponding FFmpeg arguments
    for (const command of commands) {
        const lowerCommand = command.toLowerCase();
        
        // Handle different types of edit commands
        if (lowerCommand.includes('trim') || lowerCommand.includes('cut')) {
            // Example: "trim from 00:01:30 to 00:02:45"
            const matches = command.match(/from\s+(\d+:\d+:\d+)\s+to\s+(\d+:\d+:\d+)/);
            if (matches && matches.length >= 3 && matches[1] && matches[2]) {
                args.push('-ss', matches[1], '-to', matches[2]);
            }
        } else if (lowerCommand.includes('resize') || lowerCommand.includes('scale')) {
            // Example: "resize to 720p" or "scale to 1280x720"
            if (lowerCommand.includes('720p')) {
                args.push('-vf', 'scale=1280:720');
            } else if (lowerCommand.includes('1080p')) {
                args.push('-vf', 'scale=1920:1080');
            } else {
                const matches = command.match(/(\d+)x(\d+)/);
                if (matches && matches.length >= 3 && matches[1] && matches[2]) {
                    args.push('-vf', `scale=${matches[1]}:${matches[2]}`);
                }
            }
        } else if (lowerCommand.includes('rotate')) {
            // Example: "rotate 90 degrees clockwise"
            if (lowerCommand.includes('90') && lowerCommand.includes('clockwise')) {
                args.push('-vf', 'transpose=1');
            } else if (lowerCommand.includes('90') && lowerCommand.includes('counterclockwise')) {
                args.push('-vf', 'transpose=2');
            } else if (lowerCommand.includes('180')) {
                args.push('-vf', 'transpose=2,transpose=2');
            }
        } else if (lowerCommand.includes('speed') || lowerCommand.includes('faster') || lowerCommand.includes('slower')) {
            // Example: "speed up by 2x" or "slow down by 0.5x"
            let speedFactor = 1.0;
            
            if (lowerCommand.includes('up') || lowerCommand.includes('faster')) {
                const matches = command.match(/(\d+(\.\d+)?)x/);
                if (matches && matches.length >= 2 && matches[1]) {
                    speedFactor = parseFloat(matches[1]);
                } else {
                    speedFactor = 2.0; // Default speed up
                }
            } else if (lowerCommand.includes('down') || lowerCommand.includes('slower')) {
                const matches = command.match(/(\d+(\.\d+)?)x/);
                if (matches && matches.length >= 2 && matches[1]) {
                    speedFactor = 1 / parseFloat(matches[1]);
                } else {
                    speedFactor = 0.5; // Default slow down
                }
            }
            
            // Apply speed change using setpts filter
            args.push('-filter:v', `setpts=${1/speedFactor}*PTS`, '-filter:a', `atempo=${speedFactor}`);
        }
        // Add more command types as needed
    }
    
    // Add output file and ensure we overwrite if it exists
    args.push('-y', outputPath);
    
    return args;
}

/**
 * Execute FFmpeg with the given arguments
 */
async function executeFFmpeg(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', args);
        let output = '';
        let errorOutput = '';
        
        ffmpeg.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        ffmpeg.stderr.on('data', (data) => {
            errorOutput += data.toString();
            // FFmpeg logs to stderr even when successful
            console.log(`FFmpeg: ${data}`);
        });
        
        ffmpeg.on('close', (code) => {
            if (code === 0) {
                resolve(output || errorOutput); // FFmpeg often outputs to stderr even on success
            } else {
                reject(new Error(`FFmpeg exited with code ${code}: ${errorOutput}`));
            }
        });
        
        ffmpeg.on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Upload a file to S3
 */
async function uploadToS3(filePath: string, key: string): Promise<void> {
    const fileContent = fs.readFileSync(filePath);
    
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME || "",
        Key: key,
        Body: fileContent,
        ContentType: 'video/mp4'
    };
    
    const command = new PutObjectCommand(params);
    await s3.send(command);
}

/**
 * Generate a presigned URL for accessing a file in S3
 * This is a simplified implementation since we don't have the s3-request-presigner package
 */
async function generatePresignedUrl(key: string): Promise<string> {
    // Since we don't have the s3-request-presigner package,
    // we'll return a URL format that the frontend can use to construct the actual URL
    const bucket = process.env.AWS_BUCKET_NAME || "";
    if (!bucket) {
        throw new Error("AWS_BUCKET_NAME is not defined");
    }
    
    // This is a simplified approach - in production, you would use the proper AWS SDK
    // to generate a real presigned URL with authentication
    const region = process.env.AWS_REGION || "us-east-1";
    return `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;
}