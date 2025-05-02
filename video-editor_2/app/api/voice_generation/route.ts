import {NextResponse} from "next/server";
// Construct the request
import { speak } from 'google-translate-api-x';
import { writeFileSync } from 'fs';

export async function POST(req: { json: () => any; }, res: any){
    try {
        const data = await req.json()
        const prompt = data.prompt_data
        const index = data.prompt_index
        const language = data.prompt_lang

        const res = await speak(prompt, {to: language});
        writeFileSync("public/sounds/generated_voice_" + index + ".mp3", res, {encoding:'base64'})

        return NextResponse.json({output: "we good"})
    }
    catch (error){
        return NextResponse.json({output: "we not good"})
    }
}