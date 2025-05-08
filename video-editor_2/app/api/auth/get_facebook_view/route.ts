import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
    try {
        const { videoId, pageAccessToken } = await req.json();

        const response = await axios.get(
            `https://graph.facebook.com/v19.0/${videoId}`,
            {
                params: {
                    fields: "video_insights.metric(total_video_views),likes.summary(true)",
                    access_token: pageAccessToken,
                },
            }
        );

        const insights = response.data.video_insights?.data || [];
        const totalViews = insights.find((item: any) => item.name === "total_video_views")?.values[0]?.value || 0;
        const likeCount = response.data.likes?.summary?.total_count || 0;

        return NextResponse.json({
            success: true,
            videoId,
            viewCount: totalViews,
            likeCount,
        });
    } catch (error: any) {
        console.error("Lỗi khi lấy số view/like:", error.response?.data || error.message);
        return NextResponse.json(
            {
                error: error.response?.data?.error?.message || "Lỗi server nội bộ",
                details: error.response?.data,
            },
            { status: 500 }
        );
    }
}
