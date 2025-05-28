import { createClient } from "redis";

const client = createClient(
{
    url: "redis://localhost:6379"

});

client.connect().catch(console.error); // Make sure to handle async connect

export async function pushToQueue(videoPath: string, command: string) {
    try {
        await client.lPush("Command_Q", JSON.stringify({ videoPath, command }));
    } catch (e) {
        console.log("Error pushing to Queue:", e);
    }
}

export async function popFromQueue() {
    while(true){
        try{
            await client.brPop("Command_Q",0)
        }catch(e){
            console.log('Error poping from Queue',e)
        }
    }
   
    
}