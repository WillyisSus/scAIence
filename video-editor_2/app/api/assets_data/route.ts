import { NextResponse } from "next/server";
import fsPromises from 'fs/promises';

export async function POST(req: { json: () => any; }, res: any) {
    try {
        const data = await req.json();

        const save_data = JSON.stringify(data);

        await fsPromises.writeFile("public/assets_data.json", save_data);

        return NextResponse.json({ output: "we good" })
    }
    catch (error) {
        return NextResponse.json({ output: "we aint good" })
    }
}

export async function GET(req: { json: () => any; }, res: any) {
    try {

        const save_data = await fsPromises.readFile("public/assets_data.json");
        // @ts-ignore
        const assets_data = JSON.parse(save_data);

        return NextResponse.json(assets_data)
    }
    catch (error) {
        return NextResponse.json({ output: "we aint good" })
    }
}