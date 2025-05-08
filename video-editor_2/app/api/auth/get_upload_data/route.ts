import fsPromises from "fs/promises";
import {NextResponse} from "next/server";

export async function GET(req, res) {
    const sharedata = await fsPromises.readFile(`public/uploaddata.json`)
    if (sharedata) {
        return NextResponse.json(JSON.parse(sharedata));
    } else {
        await fsPromises.writeFile(`public/uploaddata.json`, JSON.stringify({facebook:[],youtube:[]}))
        return NextResponse.json({facebook:[],youtube:[]})
    }
}