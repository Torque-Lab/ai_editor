import { createClient } from "redis";

const client = createClient(
{
    url: "redis://localhost:6379"

});

client.connect().catch(console.error);

export async function pushToQueue(videoPath: string, command: string,userId:string) {
    try {
        await client.lPush("Command_Q", JSON.stringify({ videoPath, command ,userId}));
    } catch (e) {
        console.log("Error pushing to Queue:", e);
    }
}

export async function popFromQueue() {
    while(true){
        try{
          const work=  await client.brPop("Command_Q",0)
          return work;
        }catch(e){
            console.log('Error poping from Queue',e)
        }
    }
   
    
}