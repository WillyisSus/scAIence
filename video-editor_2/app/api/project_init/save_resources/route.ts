import {NextResponse} from "next/server";
import fsPromises from 'fs/promises';

export async function POST(req: { json: () => any; }, res: any)  {
    try {
        const data = await req.json();

        const appdata = await fsPromises.readFile(`public/appdata.json`);
        const appdatajson = await JSON.parse(appdata);
        const project_name = appdatajson.current_project;
        await fsPromises.writeFile(`public/${project_name}/resources.json`, JSON.stringify(data.resource_array));
        return NextResponse.json({output: "we good"})
    }
    catch (error) {
        return NextResponse.json({output: "we aint good"})
    }
}

export async function GET(req: { json: () => any; }, res: any)  {
    try {
        const appdata = await fsPromises.readFile(`public/appdata.json`);
        const appdatajson = await JSON.parse(appdata);
        const project_name = appdatajson.current_project;
        const save_data = await fsPromises.readFile(`public/${project_name}/resources.json`);

        const resources_data = await JSON.parse(save_data);

        return NextResponse.json({output: resources_data})
    }
    catch (error) {
        return NextResponse.json({output: "we aint good"})
    }
}

