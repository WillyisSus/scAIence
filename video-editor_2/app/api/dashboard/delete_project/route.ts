import { NextResponse } from "next/server";
import fsPromises from 'fs/promises';
import fs from 'fs'
import { join } from 'path';
import { AwardIcon } from "lucide-react";
import { error } from "console";


// Usage example

export async function POST(req: { json: () => any; }, res: any) {
    try {
        const appdata = await fsPromises.readFile(`public/appdata.json`);
        const appdatajson = await JSON.parse(appdata.toString());
        const data = await req.json();
        const deleted_projects = data.chosen_projects;
        const app_projects: [] = appdatajson.projects_list;
        console.log(appdatajson.app_projects)
        for (const project of deleted_projects){
            console.log(project)
            fs.rm(`./public/${project}`, {recursive: true, force:true}, (error) => {
                return NextResponse.json({output: error}, {status: 403})
            })
            const removeIndex = app_projects.findIndex((el) => el === project)
            app_projects.splice(removeIndex, 1)
            if (appdatajson.current_project === project) {
                appdatajson.current_project = ""
                if (appdatajson.current_page === 4) appdatajson.current_page = 1
            }
            
        }
        console.log(appdatajson)
        const results = []
        for (const project of app_projects){
            const projectIndex = await fsPromises.readFile(`public/${project}/index.json`)
            const projectIndexJson = await JSON.parse(projectIndex.toString())
            console.log(projectIndexJson)
            results.push(projectIndexJson)
        }
        await fsPromises.writeFile("./public/appdata.json", JSON.stringify({...appdatajson, projects_list: app_projects}))
        return NextResponse.json({ output: JSON.stringify(results)})
    }
    catch (error) {
        console.log(error)
        return NextResponse.json({output: "Không thể xóa!!"}, {status: 403})
    }
}

