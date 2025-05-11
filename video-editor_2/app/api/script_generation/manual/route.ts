import {GoogleGenAI} from "@google/genai"
import {NextResponse} from "next/server";
import {translate} from 'google-translate-api-x';

export async function POST(req: { json: () => any; }, res: any) {
    // console.log(process.cwd())

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY});
        const data = await req.json()
        const prompt = data.script
        const vibe = data.vibe;
        const audience = data.audience;

        const translation = await translate(prompt, { to: 'en'});
        const originalLanguage = translation.from.language.iso;

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: translation.text,
            config: {
                systemInstruction: "The answers are split into paragraphs only. Each sentence in those paragraphs should not be longer than 30 words. Do not use bullets or numbering when answer. The answer will have a vibe of " + vibe + " , and the listening audience will lean heavily towards " + audience,
                tools: [{googleSearch:{}}],
            }
        });

        const reTranslation = await translate(response.text, { to: originalLanguage })

        const result = reTranslation.text

        return NextResponse.json({output: result})
    }
    catch (error){
        return NextResponse.json({output: "Nuh uh"})
    }
}