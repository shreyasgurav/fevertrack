import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FeverTrack — Ward temperature & discharge",
  description:
    "Ward temperature recording and discharge management prototype for nurses, doctors and admins.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
