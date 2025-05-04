import {GoogleGenAI, Modality} from "@google/genai";
import { createWriteStream } from "fs";
import { Readable } from "stream";
import fsPromises from "fs/promises";
import {NextResponse} from "next/server";
import fs from "node:fs";

export async function POST(req: { json: () => any; }, res: any)  {
    // try {
        const appdata = await fsPromises.readFile(`public/appdata.json`);
        const appdatajson = await JSON.parse(appdata);
        const project_name = appdatajson.current_project;
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY});
        const data = await req.json()
        const prompt = data.prompt_data
        const style = data.prompt_style;

        let operation = await ai.models.generateVideos({
            model: "veo-2.0-generate-001",
            prompt: `A video representation of this info: "${prompt}", with a ${style} style`,
            config: {
                personGeneration: "dont_allow",
                aspectRatio: "16:9",
                durationSeconds: 8,
            },
        });

        while (!operation.done) {
            await new Promise((resolve) => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({
                operation: operation,
            });
        }

        operation.response?.generatedVideos?.forEach(async (generatedVideo, n) => {
            const resp = await fetch(`${generatedVideo.video?.uri}&key=${process.env.API_KEY}`); // append your API key
            const writer = createWriteStream(`${project_name}/generated_video_${n}.mp4`);
            Readable.fromWeb(resp.body).pipe(writer);
        });


        return NextResponse.json({output: `${project_name}/generated_video.mp4`})
    // }
    // catch (error) {
    //     return NextResponse.json({output: "Fail"})
    // }
}