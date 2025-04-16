import {NextResponse} from "next/server";
import fsPromises from 'fs/promises';

export async function POST(req: { json: () => any; }, res: any)  {
    try {
        const data = await req.json();

        const assets_data = data.my_assets;
        let save_data = JSON.stringify(assets_data);
        await fsPromises.writeFile("public/assets_data.json", save_data);

        return NextResponse.json({output: "we good"})
    }
    catch (error) {
        return NextResponse.json({output: "we aint good"})
    }
}

export async function GET(req: { json: () => any; }, res: any)  {
    try {

        let save_data = await fsPromises.readFile("public/assets_data.json");
        // @ts-ignore
        let assets_data = JSON.parse(save_data);

        return NextResponse.json({output: assets_data})
    }
    catch (error) {
        return NextResponse.json({output: "we aint good"})
    }
}