import { NextResponse } from "next/server";
import fsPromises from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
    const formData = await req.formData();
    const file = formData.get('file');
    const assetId = formData.get('asset_id');

    if (!file || typeof assetId !== 'string') {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const appdata = await fsPromises.readFile(`public/appdata.json`);
    const appdatajson = await JSON.parse(appdata.toString());
    const project_name = appdatajson.current_project;

    const resourceLocation = `${project_name}/images`;
    const fileName = `custom_image_${assetId}.png`;

    const buffer = Buffer.from(await (file as Blob).arrayBuffer());
    const filePath = path.join(process.cwd(), `public/${resourceLocation}`, fileName);

    await fsPromises.writeFile(filePath, buffer);

    return NextResponse.json({
        message: 'Image saved successfully',
        image_path: path.join(resourceLocation, fileName)
    });
}
