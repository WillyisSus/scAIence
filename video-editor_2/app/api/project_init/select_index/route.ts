import fsPromises from "fs/promises";
import {NextResponse} from "next/server";

export async function POST(req: { json: () => any; }, res: any)  {
    try {
        const data = await req.json();
        const name = data.project_name;

        await fsPromises.access(`public/appdata.json`)
            .then(async () => {
                const appdata = await fsPromises.readFile(`public/appdata.json`);
                let appdatajson = await JSON.parse(appdata);
                appdatajson.current_project = name;
                await fsPromises.writeFile(`public/appdata.json`, JSON.stringify(appdatajson));
            });
        return NextResponse.json({output: "Project opened"})

    }
    catch (error) {
        return NextResponse.json({output: "Project name invalid"})
    }
}

export async function GET(req: any, res: any)  {
    try {
        const appdata = await fsPromises.readFile(`public/appdata.json`);
        let appdatajson = await JSON.parse(appdata);
        return NextResponse.json({output: appdatajson.projects_list})
    }
    catch (error) {
        return NextResponse.json({output: []})
    }
}
