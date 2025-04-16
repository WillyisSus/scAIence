import {NextResponse} from "next/server";
import fsPromises from "fs/promises";

import {FFmpeg} from "@ffmpeg/ffmpeg";
import {fetchFile} from "@ffmpeg/util";
const ffmpeg = new FFmpeg();
ffmpeg.on("log", () => {});
ffmpeg.on("progress", () => {});

export async function GET(req: any, res: any)  {
    try {
        await ffmpeg.load();

        await ffmpeg.exec(["-f", "image2", "-i", "./public/images/generated_image_%1d.png", "./public/output.mp4"]);

        ffmpeg.terminate();

        return NextResponse.json({output: "we good"})
    }
    catch (error) {
        return NextResponse.json({output: "we aint good"})
    }
}