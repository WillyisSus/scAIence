import {NextResponse} from "next/server";
import fsPromises from 'fs/promises';

// export async function POST(req: { json: () => any; }, res: any)  {
//     try {
//         const data = await req.json();

//         const appdata = await fsPromises.readFile(`public/appdata.json`);
//         const appdatajson = await JSON.parse(appdata);
//         const project_name = appdatajson.current_project;
//         const projectindex = await fsPromises.readFile(`public/${project_name}/index.json`)
//         const projectindexjson = await JSON.parse(projectindex.toString())
//         console.log(projectindexjson)
//         await fsPromises.writeFile(`public/${project_name}/resources.json`, JSON.stringify(data.resource_array));
//         await fsPromises.writeFile(`public/${project_name}/index.json`, JSON.stringify({...projectindexjson, status: 3}))
//         return NextResponse.json({output: "we good"})
//     }
//     catch (error) {
//         return NextResponse.json({output: "we aint good"})
//     }
// }

export async function GET(req: { json: () => any; }, res: any)  {
    try {
        const appdata = await fsPromises.readFile(`public/appdata.json`);
        const appdatajson = await JSON.parse(appdata.toString());
        const project_name = appdatajson.current_project;
        const projectIndex = await fsPromises.readFile(`public/${project_name}/index.json`);
        const projectIndexJson = await JSON.parse(projectIndex.toString())
        const pageToGo = Math.min(projectIndexJson.status + 1, 4)
        console.log(pageToGo)
        return NextResponse.json({output: pageToGo})
    }
    catch (error) {
        return NextResponse.json({output: "we aint good"})
    }
}

