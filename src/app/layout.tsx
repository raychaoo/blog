import type { Metadata } from "next";
import BlogThemeProvider from "@/components/theme/theme-provider";
import Header from "@/components/nav/header";
import Footer from "@/components/nav/footer";
import ProgressBar from "@/components/mdx/progress-bar";
import Live2dMascot from "@/components/live2d/live2d-mascot";
import "../styles/globals.css";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: {
    default: "VibeCoding Blog",
    template: "%s | VibeCoding Blog",
  },
  description: "个人技术博客，分享编程与技术思考",
  icons: "https://github.com/raychaoo.png",
  openGraph: {
    title: "VibeCoding Blog",
    description: "个人技术博客，分享编程与技术思考",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem("blog-theme");if(t&&["light","dark","sepia","ocean","lavender","midnight"].includes(t)){document.documentElement.setAttribute("data-theme",t);return}var d=window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light";document.documentElement.setAttribute("data-theme",d)}catch(e){}})()`
        }} />
      </head>
      <body className="flex min-h-screen flex-col antialiased" style={{ background: "var(--bg-color)", color: "var(--fg-color)" }}>
        <BlogThemeProvider>
          <ProgressBar />
          <Header />
          <Live2dMascot />
          <main className="flex-1">{children}</main>
          <Footer />
        </BlogThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
