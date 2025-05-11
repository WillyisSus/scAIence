import { NextResponse } from "next/server";
import path from 'path';
import fsPromises from 'fs/promises';
import fs from 'fs'
import { join } from 'path';
import { AwardIcon } from "lucide-react";
import { error } from "console";


// Usage example
const ffmpeg = require('fluent-ffmpeg')
const fs = require(('fs'))
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

export async function POST(req: Request) {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const appdata = await fsPromises.readFile(`public/appdata.json`);
    const appdatajson = await JSON.parse(appdata.toString());
    const project_name = appdatajson.current_project;
    const uploadTime = Date.now()
    const resourceLocation = `${project_name}/sounds`;
    const fileName = `${uploadTime}.mp3`;

    const buffer = Buffer.from(await (file as Blob).arrayBuffer());
    const filePath = path.join(`public/${resourceLocation}`, fileName);
    await fsPromises.writeFile(filePath, buffer);
    const duration = await getDurationFromURL(`public/${project_name}/sounds/${fileName}`)
            .then(result => result)
            .catch(err => console.log(err));
    console.log(duration)
    return NextResponse.json({
        message: 'Audio saved successfully',
        audio_path: resourceLocation+"/"+fileName,
        duration: duration
    });
}


