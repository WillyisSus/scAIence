import {NextResponse} from "next/server";
import fsPromises, {readdir, unlink} from "fs/promises";
import ffmpeg from 'fluent-ffmpeg';
import path from "node:path";
import { error } from "node:console";
const ffmpeg_static = require('ffmpeg-static');
const fluent_ffmpeg = require('fluent-ffmpeg');

// ffmpeg.setFfmpegPath(ffmpeg_static);

// import ffmpegPath from "@ffmpeg-installer/ffmpeg";
// import ffprobePath from "@ffprobe-installer/ffprobe";
//
// ffmpeg.setFfmpegPath(ffmpegPath.path);
// ffmpeg.setFfprobePath(ffprobePath.path);

export async function POST(req: { json: () => any; }, res: any) {
    // settings
    const { resX = 1920, resY = 1080,
            videoEncode = "libx264", audioEncode = "aac",
            fps = 24, sampleRate = 48000,
            crf = 23, preset = "medium",
            outputURL = "output_video.mp4" } = await req.json()
    let xfadeExt = 0
    const xfadeDuration = 1
    // const resX = 1920
    // const resY = 1080
    // const videoEncode = "libx264" // H.264
    // const audioEncode = "aac"
    // const fps = 15 // vid tĩnh nên cũng không quan trọng lắm
    // const sampleRate = 24000 // audio frequency (Hz)
    // const crf = 40 // 0-51 với 0 là lossless, 23 mặc định, 51 tệ nhất / số càng nhỏ file càng nặng, xử lý lâu, chất lượng tốt
    // const preset = "ultrafast" // ultrafast, superfast, veryfast, faster, fast, medium (mặc định), slow, slower, veryslow / ảnh hưởng đến tốc độ nén, càng chậm file càng nhỏ (chất lượng tốt hơn?)
    // const outputURL = "output_video.mp4";

    const appdata = await fsPromises.readFile(`public/appdata.json`);
    const appdatajson = await JSON.parse(appdata);
    const project_name = appdatajson.current_project;
    const timeline_data = await fsPromises.readFile(`public/${project_name}/timeline_data.json`)
    const timeline_datajson = JSON.parse(timeline_data)

    const image_list = timeline_datajson.find(item => item.type === "image").items
    const audio_list = timeline_datajson.find(item => item.type === "audio").items
    let imagesCount = image_list.length
    const audiosCount = audio_list.length
    if (imagesCount > 0)
        image_list[imagesCount-1].xfadeTransition = ""
    let filters = []
    let imageConcat: {
        filter: string
        options: { n: number; v: number; a: number }
        inputs: string[]
        outputs: string
    } = {
        filter: "concat",
        options: { n: imagesCount, v: 1, a: 0 },
        inputs: [],
        outputs: "v"
    }
    let audioConcat: {
        filter: string
        options: { n: number; v: number; a: number }
        inputs: string[]
        outputs: string
    } = {
        filter: "concat",
        options: { n: audiosCount, v: 0, a: 1 },
        inputs: [],
        outputs: "a"
    }
    const ff = ffmpeg()
    image_list.forEach((image, index) => {
        filters.push({
            filter: "scale",
            options: {w: resX, h: resY, force_original_aspect_ratio: "decrease"},
            inputs: `${index}:v`,
            outputs: `v${index}_scale`
        })
        filters.push({
            filter: "pad",
            options: {w: resX, h: resY, x: "(ow-iw)/2", y: "(oh-ih)/2", color: "black"},
            inputs: `v${index}_scale`,
            outputs: `v${index}_pad`
        })
        filters.push({
            filter: "setsar",
            options: "1",
            inputs: `v${index}_pad`,
            outputs: `v${index}_sar`
        })
        let xfade = false
        if (xfadeExt > 0) {
            filters.push({
                filter: "xfade",
                options: {
                    transition: image_list[index-1].xfadeTransition,
                    duration: xfadeDuration,
                    offset: image_list[index-1].duration - xfadeDuration
                },
                inputs: [`v${index-1}`, `v${index}_sar`],
                outputs: `v${index}`
            })
            xfade = true
        } else {
            filters.push({
                filter: "copy",
                inputs: `v${index}_sar`,
                outputs: `v${index}`
            })
        }
        if (image.xfadeTransition.length > 0) {
            xfadeExt += 1
        } else {
            imageConcat.inputs.push(`v${index}`)
        }
        ff.input(`public/${image.source}`)
            .inputOption(["-loop 1", `-t ${image.duration+xfadeExt*xfadeDuration/2}`])
        if (xfade) {
            image_list[index].duration =  image_list[index-1].duration + image.duration + xfadeExt * xfadeDuration / 2 - xfadeDuration
        } else {
            image_list[index].duration =  image.duration + xfadeExt * xfadeDuration / 2
        }
        if (index > 0 && image_list[index-1].xfadeTransition.length > 0) {
            xfadeExt -= 1
        }
    })
    console.log(imageConcat)
    imageConcat.options.n = imageConcat.inputs.length
    audio_list.forEach((audio, index) => {
        filters.push({
            filter: "atrim",
            options: {
                start: audio.trim_start,
                end: audio.trim_end,
            },
            inputs: `${index+imagesCount}:a`,
            outputs: `a${index+imagesCount}_trim`,
        })
        filters.push({
            filter: "asetpts",
            options: 'PTS-STARTPTS',
            inputs: `a${index+imagesCount}_trim`,
            outputs: `a${index+imagesCount}_pts`,
        })
        filters.push({
            filter: 'aresample',
            options: 'async=1',
            inputs: `a${index+imagesCount}_pts`,
            outputs: `a${index+imagesCount}`
        })
        audioConcat.inputs.push(`a${index+imagesCount}`)
        ff.input(`public/${audio.source}`)
    })
    filters.push(imageConcat)
    filters.push(audioConcat)
    await new Promise<void>((resolve, reject) => {
        ff.complexFilter(filters)
            .outputOptions(['-map [v]', '-map [a]', '-pix_fmt yuv420p', `-crf ${crf}`, `-preset ${preset}`])
            .output(`./public/${project_name}/exports/${outputURL}`)
            .videoCodec(videoEncode)
            .audioCodec(audioEncode)
            .fps(fps)
            .audioFrequency(sampleRate)
            .on('start', () => {
                console.log("Compiling...")
            })
            .on('end', () => {
                console.log(`Done `)
                resolve()
            })
            .on('error', (err) => {
                console.log(`Error occurred `, err)
                reject(err)
            })
            .run()
    })
    return NextResponse.json({output: `${project_name}/exports/${outputURL}`})
}
