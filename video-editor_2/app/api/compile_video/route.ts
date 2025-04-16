import {NextResponse} from "next/server";
import fsPromises from "fs/promises";
import ffmpeg from 'fluent-ffmpeg';
const ffmpeg_static = require('ffmpeg-static');

// ffmpeg.setFfmpegPath(ffmpeg_static);

// import ffmpegPath from "@ffmpeg-installer/ffmpeg";
// import ffprobePath from "@ffprobe-installer/ffprobe";
//
// ffmpeg.setFfmpegPath(ffmpegPath.path);
// ffmpeg.setFfprobePath(ffprobePath.path);

export async function GET(req: any, res: any)  {
    // try {
    // console.log("Starting...")

    ffmpeg()
        .input('./public/images/generated_image_%1d.png')
        .frames(3)
        .outputFPS(0.1)
        // .on('error', () => {
        //     console.log("Error occured");
        // })
        .on('start', () => {
            console.log("Compiling...");
        })
        .on('end', () => {
            console.log("Done");
        })
        .outputOptions('-pix_fmt yuv420p')
        .output('./public/output_video.avi').run();

        return NextResponse.json({output: "we good"})
    // }
    // catch (error) {
    //     return NextResponse.json({output: "we aint good"})
    // }
}