import fsPromises from "fs/promises";
import {NextResponse} from "next/server";

export async function GET(req, res) {
    try {const sharedata = await fsPromises.readFile(`public/uploaddata.json`)
        return NextResponse.json(JSON.parse(sharedata));
    } catch (err) {
        await fsPromises.writeFile(`public/uploaddata.json`, JSON.stringify({facebook:[],youtube:[]}))
        return NextResponse.json({facebook:[],youtube:[]})
    }
}