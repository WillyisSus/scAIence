import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import fsPromises from "fs/promises";

export async function POST(req: NextRequest) {
    try {
        const appdata = await fsPromises.readFile(`public/appdata.json`, "utf-8");
        const appdatajson = JSON.parse(appdata);
        const project_name = appdatajson.current_project;

        const { accessToken, title, description, privacyStatus = "public" } = await req.json();

        const videoPath = `./public/${project_name}/output_video.mp4`;
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

        return NextResponse.json({
            success: true,
            videoId: finalUpload.data.id,
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
