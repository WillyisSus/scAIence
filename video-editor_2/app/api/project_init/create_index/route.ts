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
            description : "A project"
        }));
        await fsPromises.mkdir(`public/${name}/images`);
        await fsPromises.mkdir(`public/${name}/preset`);
        await fsPromises.mkdir(`public/${name}/sounds`);

        try {
            const appdata = await fsPromises.readFile(`public/appdata.json`);
            let appdatajson = await JSON.parse(appdata);
            appdatajson.current_project = name;
            appdatajson.projects_list.push(name);
            console.log("Helo?")
            console.log(appdatajson)
            await fsPromises.writeFile(`public/appdata.json`, JSON.stringify(appdatajson));
            return NextResponse.json({output: "Project created"})
        }

        catch (error){
            console.log("Goodbye?")
            await fsPromises.writeFile(`public/appdata.json`, JSON.stringify({
                current_project : name,
                projects_list : [name],
            }));
            return NextResponse.json({output: "Project created"})
        }

    }
    catch (error) {
        return NextResponse.json({output: "Project name invalid"})
    }
}