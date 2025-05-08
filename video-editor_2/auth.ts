import NextAuth from "next-auth"
import Facebook from "next-auth/providers/facebook"
import Google from "next-auth/providers/google"
import axios from "axios";

export const { handlers, auth } = NextAuth({
    providers: [
        Facebook({ authorization: { params: { scope: "email, public_profile, publish_video, pages_show_list, business_management, instagram_basic, instagram_manage_insights, instagram_content_publish, pages_read_engagement, pages_manage_posts, read_insights" } } }),
        Google({ authorization: { params: { scope: "openid email profile https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/yt-analytics.readonly" } } }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 60 * 60, // 1 giờ
    },
    callbacks: {
        async jwt({ token, user, account }) {
            if (account) {
                if (account.provider === "facebook") {
                    token.facebookAccessToken = account.access_token
                    token.facebookUserId = user?.id
                    const pagesResponse = await axios.get(
                        `https://graph.facebook.com/v22.0/me/accounts`,
                        {
                            params: { access_token: token.facebookAccessToken }
                        }
                    )
                    token.pages  = pagesResponse.data?.data;
                }
                if (account.provider === "google") {
                    token.googleAccessToken = account.access_token
                    token.googleUserId = user?.id
                }
            }
            return token
        },
        async session({ session, token }) {
            session.facebookAccessToken = token.facebookAccessToken
            session.facebookUserId = token.facebookUserId
            session.pages = token.pages || []
            session.googleAccessToken = token.googleAccessToken
            session.googleUserId = token.googleUserId
            return session
        },
    },
})