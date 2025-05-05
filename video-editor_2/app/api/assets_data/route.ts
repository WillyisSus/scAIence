import { NextResponse } from "next/server";
import fsPromises from 'fs/promises';

export async function POST(req: { json: () => any; }, res: any) {
    try {
        const appdata = await fsPromises.readFile(`public/appdata.json`);
        const appdatajson = await JSON.parse(appdata.toString());
        const project_name = appdatajson.current_project;

        const data = await req.json();
        const assets_data = data.my_assets;
        const save_data = JSON.stringify(assets_data);
        await fsPromises.writeFile(`public/${project_name}/assets_data.json`, save_data);
        return NextResponse.json({ output: "we good" })
    }
    catch (error) {
        return NextResponse.json({ output: "we aint good" })
    }
}

export async function GET(req: { json: () => any; }, res: any) {
    try {
        const appdata = await fsPromises.readFile(`public/appdata.json`);
        const appdatajson = await JSON.parse(appdata.toString());
        const project_name = appdatajson.current_project;

        const save_data = await fsPromises.readFile(`public/${project_name}/assets_data.json`);
        const assets_data = await JSON.parse(save_data.toString());

        return NextResponse.json({ output: assets_data })
    }
    catch (error) {
        return NextResponse.json({ output: "we aint good" })
    }
}