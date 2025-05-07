import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "node:fs";
import { NextResponse } from "next/server";
import fsPromises from "fs/promises";

export async function POST(req: { json: () => any; }, res: any) {
    const data = await req.json();
    const prompt = data.prompt_data;
    const index = data.prompt_index;
    const style = data.prompt_style;

    const appdata = await fsPromises.readFile(`public/appdata.json`);
    const appdatajson = await JSON.parse(appdata.toString());
    const project_name = appdatajson.current_project;

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        // Set responseModalities to include "Image" so the model can generate  an image
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp-image-generation",
            contents: "Give an image representation of this idea: \"" + prompt + "\". Please don't put any text on the image. The image will have the style of " + style,
            config: {
                responseModalities: [Modality.TEXT, Modality.IMAGE],
                // systemInstruction: "The images have the resolution of 800x600 only. Do not generate any text on the image.",
            },
        });

        const candidate = response.candidates?.[0];
        const parts = candidate?.content?.parts;

        if (!parts || parts.length === 0)
            throw new Error("Response malformed.");

        let imageReceived = false;

        for (const part of parts) {
            // Based on the part type, either show the text or save the image
            if (part.text)
                console.log(part.text);
            else if (part.inlineData?.data) {
                imageReceived = true;
                const buffer = Buffer.from(part.inlineData.data, "base64");
                fs.writeFileSync(`public/${project_name}/images/generated_image_${index}.png`, buffer);
            }
        }

        if (!imageReceived)
            throw new Error("No image data received.")

        return NextResponse.json({ output: `${project_name}/images/generated_image_${index}.png` })
    }
    catch (error) {
        console.log(error)
        return NextResponse.json({ output: `${project_name}/images/generated_image_${index}.png` })
    }
}