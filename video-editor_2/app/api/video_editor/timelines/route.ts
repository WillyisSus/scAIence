import { NextResponse } from "next/server";
import fsPromises, { writeFile } from 'fs/promises';
import path from 'path';
import { requestFormReset } from "react-dom";
export async function GET(req: Request){
    try{
        const appdata = await fsPromises.readFile(`public/appdata.json`);
        const appdatajson = await JSON.parse(appdata.toString());
        const project_name = appdatajson.current_project;
    
        const timeline_data = await fsPromises.readFile(`public/${project_name}/timeline_data.json`)
        return NextResponse.json({output:timeline_data.toString()});
    }catch(err){
        console.log(err)
    }
    return NextResponse.json({output:JSON.stringify({})});
}
export async function POST(req: { json: () => any; }, res: any) {
    try{
        const reqData = await req.json();
        const appdata = await fsPromises.readFile(`public/appdata.json`);
        const appdatajson = await JSON.parse(appdata.toString());
        const project_name = appdatajson.current_project;
        console.log(project_name)
        const assets_data = reqData.profile;
        const save_data = JSON.stringify(assets_data);
        console.log("WTFISFWMATP:", save_data)
        await fsPromises.writeFile(`public/${project_name}/timeline_data.json`, save_data);
        return NextResponse.json({ output: "we good" })
    }catch(err){
        return NextResponse.json({ output: "dying" })
    }
    
}
