import { NextResponse } from "next/server";
import { speak, translate } from 'google-translate-api-x';
import { writeFileSync } from 'fs';
import fsPromises from "fs/promises";
const ffmpeg = require('fluent-ffmpeg')

function getDurationFromURL(url) {
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

export async function POST(req: { json: () => any; }, res: any) {
    const data = await req.json();
    const prompt = data.prompt_data;
    const index = data.prompt_index;
    const language = data.prompt_lang;

    const appdata = await fsPromises.readFile(`public/appdata.json`);
    const appdatajson = await JSON.parse(appdata.toString());
    const project_name = appdatajson.current_project;

    try {
        const translation = await translate(prompt, { to: language});
        const speakLanguage = translation.from.language.iso;
        
        const res = await speak(prompt, { to: speakLanguage });
        const buffer = Buffer.from(res.toString(), 'base64')

        writeFileSync(`public/${project_name}/sounds/generated_voice_${index}.mp3`, buffer, { encoding: 'base64' })

        const duration = await getDurationFromURL(`public/${project_name}/sounds/generated_voice_${index}.mp3`)
            .then(result => result)
            .catch(err => console.log(err));
        return NextResponse.json({
            output: `${project_name}/sounds/generated_voice_${index}.mp3`,
            duration: duration
        })
    }
    catch (error) {
        console.log(error)
        return NextResponse.json({
            output: `${project_name}/sounds/generated_voice_${index}.mp3`,
            duration: 0
        })
    }
}