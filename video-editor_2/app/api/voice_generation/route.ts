import {NextResponse} from "next/server";
// Construct the request
let gtts = require("better-node-gtts").default;
let path = require('path');

export async function POST(req: { json: () => any; }, res: any){
    try {
        const data = await req.json()
        const prompt = data.prompt_data
        const index = data.prompt_index

        // Save the generated binary audio content to a local file

        await gtts.save("public/sounds/generated_voice_" + index + ".mp3", prompt)

        return NextResponse.json({output: "we good"})
    }
    catch (error){
        return NextResponse.json({output: "we not good"})
    }
}