import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import FormData from "form-data";
import axios from "axios";
import fsPromises from "fs/promises";

export async function POST(req: NextRequest) {
    const appdata = await fsPromises.readFile(`public/appdata.json`);
    const appdatajson = await JSON.parse(appdata);
    const project_name = appdatajson.current_project;
    try {
        const { pageId, pageAccessToken, title, description } = await req.json();

        const videoPath = `./public/${project_name}/output_video.mp4`

        const videoStream = fs.createReadStream(videoPath);
        const formData = new FormData();
        formData.append("source", videoStream, {
            filename: "output_video.mp4",
            contentType: "video/mp4",
        });
        formData.append("title", title);
        formData.append("description", description);
        formData.append("published", "true");

        const uploadResponse = await axios.post(
            `https://graph-video.facebook.com/v22.0/${pageId}/videos`,
            formData,
            {
                params: {
                    access_token: pageAccessToken,
                },
                headers: {
                    ...formData.getHeaders(),
                },
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
            }
        );

        return NextResponse.json({
            success: true,
            videoId: uploadResponse.data.id,
            pageId: pageId,
        });
    } catch (error: any) {
        console.error("Lỗi server:", error.response?.data || error.message);
        return NextResponse.json(
            {
                error: error.response?.data?.error?.message || "Lỗi server nội bộ",
                details: error.response?.data,
            },
            { status: 500 }
        );
    }
}
