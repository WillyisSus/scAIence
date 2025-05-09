import { NextResponse } from 'next/server';
import fsPromises from 'fs/promises';
import * as path from 'path';

export async function DELETE(req: { json: () => any; }) {
    const appdata = await fsPromises.readFile(`public/appdata.json`);
    const appdatajson = await JSON.parse(appdata.toString());
    const project_name = appdatajson.current_project;

    const requestBody = await req.json();
    const id = requestBody.assets_id;

    const imageResources = path.join(process.cwd(), `public/${project_name}/images`);
    const audioRecources = path.join(process.cwd(), `public/${project_name}/sounds`);

    try {
        const images = await fsPromises.readdir(imageResources);
        const audios = await fsPromises.readdir(audioRecources);

        if (images.includes(`custom_image_${id}.png`)) {
            const imagePath = path.join(imageResources, `custom_image_${id}.png`);
            await fsPromises.unlink(imagePath);
        }

        if (audios.includes(`custom_audio_${id}.webm`)) {
            const audioPath = path.join(audioRecources, `custom_audio_${id}.webm`);
            await fsPromises.unlink(audioPath);
        }

        return NextResponse.json({ message: `Custom assets ${id} deleted.` });
    } catch (error) {
        console.error('Error deleting files:', error);
        return NextResponse.json(
            { error: 'Failed to delete files.' },
            { status: 500 }
        );
    }
}
