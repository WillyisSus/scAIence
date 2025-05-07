import { NextResponse } from 'next/server';
import fsPromises from 'fs/promises';
import * as path from 'path';

export async function DELETE() {
	const appdata = await fsPromises.readFile(`public/appdata.json`);
	const appdatajson = await JSON.parse(appdata.toString());
	const project_name = appdatajson.current_project;

	const imageResources = path.join(process.cwd(), `public/${project_name}/images`);
	const audioRecources = path.join(process.cwd(), `public/${project_name}/sounds`);

	try {
		const images = await fsPromises.readdir(imageResources);
		const audios = await fsPromises.readdir(audioRecources);

		await Promise.all(
			images.map(async (file) => {
				const filePath = path.join(imageResources, file);
				const stat = await fsPromises.stat(filePath);

				if (stat.isFile())
					await fsPromises.unlink(filePath);
			})
		);

		await Promise.all(
			audios.map(async (file) => {
				const filePath = path.join(audioRecources, file);
				const stat = await fsPromises.stat(filePath);

				if (stat.isFile())
					await fsPromises.unlink(filePath);
			})
		);

		return NextResponse.json({ message: 'All files deleted.' });
	} catch (error) {
		console.error('Error deleting files:', error);
		return NextResponse.json(
			{ error: 'Failed to delete files.' },
			{ status: 500 }
		);
	}
}
