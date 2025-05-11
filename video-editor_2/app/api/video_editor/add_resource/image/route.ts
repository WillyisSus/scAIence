import { NextResponse } from "next/server";
import fsPromises from 'fs/promises';
import path from 'path';

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
    const resourceLocation = `${project_name}/images`;
    const fileName = `${uploadTime}.png`;

    const buffer = Buffer.from(await (file as Blob).arrayBuffer());
    const filePath = path.join(`public/${resourceLocation}`, fileName);

    await fsPromises.writeFile(filePath, buffer);

    return NextResponse.json({
        message: 'Image saved successfully',
        image_path: resourceLocation+"/"+fileName
    });
}
