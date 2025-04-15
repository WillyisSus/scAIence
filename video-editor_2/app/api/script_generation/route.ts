import {GoogleGenAI} from "@google/genai"
import {NextResponse} from "next/server";
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

export async function POST(req: { json: () => any; }, res: any) {
    // console.log(process.cwd())

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.REACT_APP_GEMINI_API_KEY});
        const data = await req.json()
        const prompt = data.body

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
            config: {
                systemInstruction: "The answers are split into paragraphs only. Do not use bullets or numbering when answer.",
            //     tools: [{googleSearchRetrieval:{}}],
            }
        });

        const result = response.text

        return NextResponse.json({output: result})
    }
    catch (error){
        return NextResponse.json({output: "Nuh uh"})
    }
}