import fsPromises from "fs/promises";
import {NextResponse} from "next/server";

export async function POST(req: { json: () => any; }, res: any)  {
    try {
        const data = await req.json();
        const name = data.project_name;

        await fsPromises.mkdir(`public/${name}`);
        await fsPromises.writeFile(`public/${name}/index.json`, JSON.stringify({
            project_name : name,
            date_created : Date.now(),
            description : "A project",
            status: 1
        }));
        await fsPromises.mkdir(`public/${name}/images`);
        await fsPromises.mkdir(`public/${name}/preset`);
        await fsPromises.mkdir(`public/${name}/sounds`);
        await fsPromises.mkdir(`public/${name}/exports`);

        try {
            const appdata = await fsPromises.readFile(`public/appdata.json`);
            let appdatajson = await JSON.parse(appdata);
            appdatajson.current_project = name;
            appdatajson.projects_list.push(name);
            appdatajson.current_page = 1;
            await fsPromises.writeFile(`public/appdata.json`, JSON.stringify(appdatajson));
            return NextResponse.json({output: "Project created"})
        }

        catch (error){
            await fsPromises.writeFile(`public/appdata.json`, JSON.stringify({
                current_project : name,
                projects_list : [name],
                current_page: 1,
            }));
            return NextResponse.json({output: "Project created"})
        }

    }
    catch (error) {
        return NextResponse.json({output: "Project name invalid"})
    }
}