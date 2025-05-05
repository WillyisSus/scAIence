import fsPromises from "fs/promises";
import { isCustomErrorPage } from "next/dist/build/utils";
import {NextResponse} from "next/server";

export async function POST(req: { json: () => any; }, res: any)  {
    try {
        const data = await req.json();

        const page = data.page;
        const appdata = await fsPromises.readFile(`public/appdata.json`);
        let appdatajson = await JSON.parse(appdata);
        appdatajson.current_page = page;
        await fsPromises.writeFile(`public/appdata.json`, JSON.stringify(appdatajson));
        return NextResponse.json({output: "Page diverted"})

    }
    catch (error) {
        return NextResponse.json({output: "Page invalid"})
    }
}

export async function GET(req: any, res: any)  {
    try {
        const appdata = await fsPromises.readFile(`public/appdata.json`);
        let appdatajson = await JSON.parse(appdata);
        return NextResponse.json({output: appdatajson.current_page?appdatajson.current_page:1})
    }
    catch (error) {
        console.log(error)
        return NextResponse.json({output: 1})
    }
}

