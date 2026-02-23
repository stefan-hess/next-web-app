import type { Metadata } from "next";
import "../styles/tailwind.css";

export const metadata: Metadata = {
  icons: {
    icon: "/assets/icon/icon_v1.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
