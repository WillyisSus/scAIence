import { NextResponse } from "next/server";
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
    const formData = await req.formData();
    const file = formData.get('file');
    const assetId = formData.get('asset_id');

    if (!file || typeof assetId !== 'string') {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const buffer = Buffer.from(await (file as Blob).arrayBuffer());
    const filePath = path.join(process.cwd(), 'public/sounds', `custom_audio_${assetId}.webm`);

    await writeFile(filePath, buffer);

    return NextResponse.json({ message: 'Audio saved successfully' });
}
