import { NextResponse } from "next/server";
import fsPromises from 'fs/promises';
import { join } from 'path';

async function getAllMp4FilesFromSubfolders(publicFolderPath: string): Promise<string[]> {
  const result: string[] = [];

  try {
    // Read the contents of the public folder
    const entries = await fsPromises.readdir(publicFolderPath, { withFileTypes: true });

    // Filter only subdirectories
    const subfolders = entries.filter(entry => entry.isDirectory());

    for (const folder of subfolders) {
      const folderPath = join(publicFolderPath, folder.name);
      const subentries = await fsPromises.readdir(folderPath, {withFileTypes: true});
      const subsubfolders = subentries.filter(entry => entry.name === "exports")
      for (const subsubfolder of subsubfolders){
        const exportFolder = join(folderPath, subsubfolder.name)
        const files = await fsPromises.readdir(exportFolder);
        for (const file of files) {
        if (file.endsWith('.mp4')) {
          result.push(join(exportFolder, file));
            }
        }
      }
   
    }
  } catch (error) {
    console.error('Error reading folders:', error);
  }

  return result;
}

// Usage example

// export async function POST(req: { json: () => any; }, res: any) {
//     try {
//         const appdata = await fsPromises.readFile(`public/appdata.json`);
//         const appdatajson = await JSON.parse(appdata.toString());
//         const project_name = appdatajson.current_project;

//         const data = await req.json();
//         const assets_data = data.my_assets;
//         const save_data = JSON.stringify(assets_data);
//         await fsPromises.writeFile(`public/${project_name}/assets_data.json`, save_data);
//         return NextResponse.json({ output: "we good" })
//     }
//     catch (error) {
//         return NextResponse.json({ output: "we aint good" })
//     }
// }

export async function GET(req: { json: () => any; }, res: any) {
    try {
        const exportedFiles = await getAllMp4FilesFromSubfolders("./public")

        return NextResponse.json({ output: JSON.stringify(exportedFiles) })
    }
    catch (error) {
        return NextResponse.json({ output: "we aint good"}, { status: 404 })
    }
}