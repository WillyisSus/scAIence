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
        console.log(timeline_data?timeline_data:"File not found")
        return NextResponse.json({output:timeline_data.toString()}, {status: 200});
    }catch(err){
        return NextResponse.json({err: "File not found"}, {status: 404})
    }
}
export async function POST(req: { json: () => any; }, res: any) {
    try{
        const reqData = await req.json();
        const appdata = await fsPromises.readFile(`public/appdata.json`);
        const appdatajson = await JSON.parse(appdata.toString());
        const project_name = appdatajson.current_project;
        const assets_data = reqData.profile;
        console.log(assets_data[2]);
        const save_data = JSON.stringify(assets_data);
        await fsPromises.writeFile(`public/${project_name}/timeline_data.json`, save_data);
        return NextResponse.json({ output: "we good" })
    }catch(err){
        return NextResponse.json({ output: "dying" })
    }
    
}
