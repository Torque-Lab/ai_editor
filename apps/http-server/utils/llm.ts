import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.LLM_API_KEY;
const ai = new OpenAI({ apiKey: API_KEY }); 
export  async function test(){
  const models = await ai.models.list();
models.data.forEach(model => console.log(model.id));
}

export  async function parseToFFmpeg(userCommand: string) {

  const prompt = `
You are an expert in FFmpeg command generation.

Your task is to convert natural language instructions into a valid and minimal FFmpeg command-line instruction.

### Rules:
- Output only the FFmpeg command, nothing else.
- Do not include explanations, markdown, or commentary.
- Assume input file is called "input.mp4"
- Assume output file is called "output.mp4"
- Always use double quotes around filtergraph values
- Only include the necessary flags based on the user command
- Don't use complex shell scripting — keep it clean and simple.
- Don't reply anything other than FFmpeg command, user gives task in natural lanauge
 Your task is just to convert user commnad into FFmpeg command, your generated commnad will get passed to an ffmpeg process which do acutal edit of video , so just response with ffmpeg command
- You have only response with ffmpeg command after analysing what user saying
### Example input:
"Trim the video from 10 to 20 seconds and crop the center to 300x300."

### Example output:
ffmpeg -i input.mp4 -ss 10 -to 20 -vf "crop=300:300" output.mp4

---

Now generate the FFmpeg command for this request by user:
${userCommand}
`;
const response = await ai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: "You are command parser, you take user input and only response with FFmpeg command which passed to a FFmpeg process" },
    { role: "user", content: prompt}
  ],
});

  return response;
}

