import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "node:fs";
import {NextResponse} from "next/server";
import dotenv from 'dotenv';
import fsPromises from "fs/promises";

dotenv.config({ path: '/' });


export async function POST(req: { json: () => any; }, res: any) {
    try {
        console.log("Test");
        const appdata = await fsPromises.readFile(`public/appdata.json`);
        const appdatajson = await JSON.parse(appdata);
        const project_name = appdatajson.current_project;
        const ai = new GoogleGenAI({ apiKey: "nope"});
        const data = await req.json()
        const prompt = data.prompt_data
        const index = data.prompt_index
        const style = data.prompt_style;

        // Set responseModalities to include "Image" so the model can generate  an image
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp-image-generation",
            contents: "Give an image representation of this idea: \"" + prompt + "\". Please don't put any text on the image. The image will have the style of " + style,
            config: {
                responseModalities: [Modality.TEXT, Modality.IMAGE],
                // systemInstruction: "The images have the resolution of 800x600 only. Do not generate any text on the image.",
            },
        });

        // @ts-ignore
        for (const part of response.candidates[0].content.parts) {
            // Based on the part type, either show the text or save the image
            if (part.text) {
                console.log(part.text);
            } else if (part.inlineData) {
                const imageData = part.inlineData.data;
                // @ts-ignore
                const buffer = Buffer.from(imageData, "base64");
                fs.writeFileSync(`public/${project_name}/images/generated_image_${index}.png`, buffer);
            }
        }


        return NextResponse.json({output: `${project_name}/images/generated_image_${index}.png`})
    }
    catch (error){
        return NextResponse.json({output: null})
    }
}