import {NextResponse} from "next/server";
// Construct the request
import { speak } from 'google-translate-api-x';
import { writeFileSync } from 'fs';
import fsPromises from "fs/promises";
import { Drum } from "lucide-react";
const ffmpeg = require('fluent-ffmpeg')
const fs = require(('fs'))
function  getDurationFromURL(url) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(url, (err, metadata) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(metadata.format.duration);
        });
    });
}
export async function POST(req: { json: () => any; }, res: any){
    try {
        const data = await req.json()
        const prompt = data.prompt_data
        const index = data.prompt_index
        const language = data.prompt_lang


        const res = await speak(prompt, {to: language});
        const appdata = await fsPromises.readFile(`public/appdata.json`);
        const appdatajson = await JSON.parse(appdata);
        const project_name = appdatajson.current_project;
        writeFileSync(`public/${project_name}/sounds/generated_voice_${index}.mp3`, res, {encoding:'base64'})
        let duration = await getDurationFromURL(`public/${project_name}/sounds/generated_voice_${index}.mp3`)
        .then(result => {return result})
        .catch(err => console.log(err))
        console.log("bout to kms: ", duration)
        return NextResponse.json({output: `${project_name}/sounds/generated_voice_${index}.mp3`, duration: duration})
    }
    catch (error){
        return NextResponse.json({output: null})
    }
}