import {NextResponse} from "next/server";
import {readdir, unlink} from "fs/promises";
import ffmpeg from 'fluent-ffmpeg';
import path from "node:path";
const ffmpeg_static = require('ffmpeg-static');
const fluent_ffmpeg = require('fluent-ffmpeg');

// ffmpeg.setFfmpegPath(ffmpeg_static);

// import ffmpegPath from "@ffmpeg-installer/ffmpeg";
// import ffprobePath from "@ffprobe-installer/ffprobe";
//
// ffmpeg.setFfmpegPath(ffmpegPath.path);
// ffmpeg.setFfprobePath(ffprobePath.path);

export async function GET(req: any, res: any) {
    // settings
    let resX = 1920
    let resY = 1080
    let videoEncode = 'libx264' // H.264
    let audioEncode = 'aac'
    let fps = 15 // vid tĩnh nên cũng không quan trọng lắm
    let sampleRate = 24000 // audio frequency (Hz)
    let crf = 23 // 0-51 với 0 là lossless, 23 mặc định, 51 tệ nhất / số càng nhỏ file càng nặng, xử lý lâu, chất lượng tốt
    let preset = 'medium' // ultrafast, superfast, veryfast, faster, fast, medium (mặc định), slow, slower, veryslow / ảnh hưởng đến tốc độ nén, càng chậm file càng nhỏ (chất lượng tốt hơn?)

    // prepare
    const images = await readdir('./public/images')
    const imageCount = images.filter(image => /^generated_image_\d+\.png$/.test(image)).length
    const voices = await readdir('./public/sounds')
    const voiceCount = voices.filter(voice => /^generated_voice_\d+\.mp3$/.test(voice)).length
    let inputs: string[] = []
    let filters = []
    if (imageCount === 0 || voiceCount === 0 || imageCount != voiceCount) {
        return NextResponse.json({output: "we not good"})
    }

    for (let i = 0; i <= imageCount; i++) {
        if (i < imageCount) {
            await new Promise<void>((resolve, reject) => {
                ffmpeg()
                    .input(`./public/images/generated_image_${i}.png`)
                    .inputOption(['-loop 1'])
                    .input(`./public/sounds/generated_voice_${i}.mp3`)
                    .output(`./public/output_video_${i}.mp4`)
                    .outputOptions(['-pix_fmt yuv420p', `-crf ${crf}`, `-preset ${preset}`, '-shortest'])
                    .videoCodec(videoEncode)
                    .audioCodec(audioEncode)
                    .videoFilter(`scale=w=${resX}:h=${resY}:force_original_aspect_ratio=decrease,setsar=1,pad=${resX}:${resY}:(ow-iw)/2:(oh-ih)/2`)
                    .fps(fps)
                    .audioFrequency(sampleRate)
                    .on('start', () => {
                        console.log(`Compiling... ${i}`)
                    })
                    .on('end', () => {
                        console.log(`Done ${i}`)
                        resolve()
                    })
                    .on('error', () => {
                        console.log(`Error occured ${i}`)
                        reject()
                    })
                    .run()
            })
        } else {
            const publicList = await readdir('./public')
            const videos = publicList.filter(video => /^output_video_\d+\.mp4$/.test(video))
            const videoCount = videos.length
            if (videoCount === 0 || videoCount != imageCount) {
                console.log('no video found')
                return NextResponse.json({output: "we not good too"})
            }
            videos.forEach((video, index) => {
                inputs.push(`./public/${video}`)
                // filters.push({
                //     filter: 'scale',
                //     options: {w: resX, h: resY, force_original_aspect_ratio: 'decrease'},
                //     inputs: `${index}:v`,
                //     outputs: `v${index}_scaled`
                // })
                // filters.push({
                //     filter: 'pad',
                //     options: {w: resX, h: resY, x: '(ow-iw)/2', y: '(oh-ih)/2', color: 'black'},
                //     inputs: `v${index}_scaled`,
                //     outputs: `v${index}`
                // })
                // filters.push({
                //     filter: 'aresample',
                //     options: 'async=1',
                //     inputs: `${index}:a`,
                //     outputs: `a${index}`
                // });
            })
            let concatFilter: {
                filter: string;
                options: { n: number; v: number; a: number };
                inputs: string[];
                outputs: string[];
            } = {
                filter: 'concat',
                options: { n: videoCount, v: 1, a: 1 },
                inputs: [],
                outputs: ['v', 'a']
            }
            for (let i = 0; i < videoCount; i++) {
                concatFilter.inputs.push(`${i}:v`)
                concatFilter.inputs.push(`${i}:a`)
            }
            filters.push(concatFilter)
            await new Promise<void>((resolve, reject) => {
                const ff = ffmpeg()
                inputs.forEach((input) => {
                    ff.input(input)
                })
                ff
                    .complexFilter(filters)
                    .outputOptions(['-map [v]', '-map [a]', '-pix_fmt yuv420p', `-crf ${crf}`, `-preset ${preset}`])
                    .output('./public/output_video.mp4')
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
                    .on('error', () => {
                        console.log(`Error occured `)
                        reject()
                    })
                    .run()
            })
        }
    }
    for (const input of inputs) {
        try {
            await unlink(input)
            console.log(`File temp ${input} deleted`);
        } catch(e) {
            console.log('Error deleting files:', e);
        }
    }
    return NextResponse.json({output: "we good"})
}



//     await new Promise<void>((resolve, reject) => {
//         ffmpeg()
//             .input('./public/output_video_2.mp4')
//             .input('./public/output_video_0.mp4')
//             .complexFilter([
//                 // Scale và pad về cùng kích thước
//                 {
//                     filter: 'scale',
//                     options: { w: 1920, h: 1080, force_original_aspect_ratio: 'decrease' },
//                     inputs: '0:v',
//                     outputs: 'v0_scaled'
//                 },
//                 {
//                     filter: 'pad',
//                     options: { w: 1920, h: 1080, x: '(ow-iw)/2', y: '(oh-ih)/2', color: 'black' },
//                     inputs: 'v0_scaled',
//                     outputs: 'v0'
//                 },
//                 {
//                     filter: 'scale',
//                     options: { w: 1920, h: 1080, force_original_aspect_ratio: 'decrease' },
//                     inputs: '1:v',
//                     outputs: 'v1_scaled'
//                 },
//                 {
//                     filter: 'pad',
//                     options: { w: 1920, h: 1080, x: '(ow-iw)/2', y: '(oh-ih)/2', color: 'black' },
//                     inputs: 'v1_scaled',
//                     outputs: 'v1'
//                 },
//
//                 // Ghép audio nếu có
//                 { filter: 'aresample', options: 'async=1', inputs: '0:a', outputs: 'a0' },
//                 { filter: 'aresample', options: 'async=1', inputs: '1:a', outputs: 'a1' },
//
//                 // Ghép video và audio
//                 {
//                     filter: 'concat',
//                     options: { n: 2, v: 1, a: 1 },
//                     inputs: ['v0', 'a0', 'v1', 'a1'],
//                     outputs: ['outv', 'outa']
//                 }
//             ])
//             .outputOptions(['-map [outv]', '-map [outa]', '-preset veryfast', '-crf 23', '-pix_fmt yuv420p'])
//             .output(`./public/output_video.mp4`)
//             //.outputOptions(['-pix_fmt yuv420p', `-crf ${crf}`, `-preset ${preset}`])
//             //.videoCodec(videoEncode)
//             //.audioCodec(audioEncode)
//             //.videoFilter(`scale=w=${resX}:h=${resY}:force_original_aspect_ratio=decrease,pad=${resX}:${resY}:(ow-iw)/2:(oh-ih)/2`)
//             //.fps(fps)
//             //.audioFrequency(sampleRate)
//             .on('start', () => {
//                 console.log("Compiling...")
//             })
//             .on('end', () => {
//                 console.log(`Done `)
//                 resolve()
//             })
//             .on('error', (err, stdout, stderr) => {
//                 console.log(`Error occured `)
//                 console.error('Lỗi FFmpeg đầy đủ:', err);
//                 console.error('STDOUT:', stdout);
//                 console.error('STDERR:', stderr);
//                 reject()
//             })
//             .run()
//     })
//     return NextResponse.json({output: "we good"})
// }

