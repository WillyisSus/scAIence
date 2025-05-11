import {GoogleGenAI} from "@google/genai"
import {NextResponse} from "next/server";
import fs from "fs";
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

export async function POST(req: { json: () => any; }, res: any) {
    // console.log(process.cwd())

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY});
        const data = await req.json();
        const filename = data.filename;
        const file = data.file;
        const vibe = data.vibe;
        const audience = data.audience;

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [
                { text: "Summarize this document. Focus on the main points only." },
                {
                    inlineData: {
                        mimeType: 'application/pdf',
                            data: file
                    }
                }
            ],
            config: {
                systemInstruction: "The answers are split into paragraphs only. The result must be written in the source's language. Each sentence in those paragraphs should not be longer than 30 words. Do not use bullets or numbering when answer. The answer will have a vibe of " + vibe + " , and the listening audience will lean heavily towards " + audience,
                tools: [{googleSearch:{}}],
            }
        });

        const result = response.text

        return NextResponse.json({output: result})
    }
    catch (error){
        return NextResponse.json({output: "Nuh uh"})
    }
}