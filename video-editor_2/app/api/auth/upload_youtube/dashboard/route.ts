import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import fsPromises from "fs/promises";

export async function POST(req: NextRequest) {
    try {
        // const appdata = await fsPromises.readFile(`public/appdata.json`, "utf-8");
        // const appdatajson = JSON.parse(appdata);
        // const project_name = appdatajson.current_project;

        const { channelId, accessToken, channel, title, description, privacyStatus = "public", filename} = await req.json();
        
        // const videoPath = `./public/${project_name}/exports/${filename}`
        const videoPath = filename
        const videoSize = fs.statSync(videoPath).size;

        const metadata = {
            snippet: {
                title,
                description,
            },
            status: {
                privacyStatus, // "public" | "private" | "unlisted"
            },
        };

        const uploadRes = await axios.post(
            "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
            metadata,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                    "X-Upload-Content-Length": videoSize,
                    "X-Upload-Content-Type": "video/*",
                },
                maxBodyLength: Infinity,
            }
        );

        const uploadUrl = uploadRes.headers.location;

        if (!uploadUrl) throw new Error("Không lấy được resumable upload URL từ YouTube");

        const videoStream = fs.createReadStream(videoPath);

        const finalUpload = await axios.put(uploadUrl, videoStream, {
            headers: {
                "Content-Length": videoSize,
                "Content-Type": "video/*",
            },
            maxBodyLength: Infinity,
        });

        try {
            const sharedata = await fsPromises.readFile(`public/uploaddata.json`)
            const sharedatajson = await JSON.parse(sharedata.toString())
            const pageIndex = sharedatajson.youtube.findIndex(page => page.pageID === channelId)
            if (pageIndex != -1) {
                sharedatajson.youtube[pageIndex].video.push({
                    local_path: videoPath,
                    upload_id: finalUpload.data.id,
                    title: title,
                    description: description
                })
            } else {
                sharedatajson.youtube.push({
                    pageID: channelId,
                    pageName: channel,
                    video: [{
                        local_path: videoPath,
                        upload_id: finalUpload.data.id,
                        title: title,
                        description: description
                    }]
                })
            }
            await fsPromises.writeFile(`public/uploaddata.json`, JSON.stringify(sharedatajson));
        } catch (err) {
            await fsPromises.writeFile(`public/uploaddata.json`, JSON.stringify({facebook:[],youtube:[{pageID:channelId, pageName: channel,video:[{local_path:videoPath,upload_id:finalUpload.data.id, title: title, description: description}]}]}))
        }

        return NextResponse.json({
            success: true,
            videoId: finalUpload.data.id,
            channelId: channelId
        });
    } catch (error: any) {
        console.error("Lỗi upload YouTube:", error.response?.data || error.message);
        return NextResponse.json(
            {
                error: error.response?.data?.error?.message || "Upload YouTube thất bại",
                details: error.response?.data,
            },
            { status: 500 }
        );
    }
}
