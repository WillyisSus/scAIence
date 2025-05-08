import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
    try {
        const { videoId, accessToken } = await req.json();

        const apiRes = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
            params: {
                part: "statistics",
                id: videoId,
            },
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const video = apiRes.data.items?.[0];
        if (!video) {
            return NextResponse.json(
                { error: "Không tìm thấy video hoặc accessToken không hợp lệ" },
                { status: 404 }
            );
        }

        const stats = video.statistics;

        return NextResponse.json({
            success: true,
            videoId,
            viewCount: Number(stats.viewCount),
            likeCount: Number(stats.likeCount || 0),
        });
    } catch (error: any) {
        console.error("Lỗi lấy thông tin video:", error.response?.data || error.message);
        return NextResponse.json(
            {
                error: error.response?.data?.error?.message || "Lỗi server khi lấy thông tin video",
                details: error.response?.data,
            },
            { status: 500 }
        );
    }
}
