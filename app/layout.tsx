import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });
const body = Figtree({ subsets: ["latin"], variable: "--font-body" });
const thai = Noto_Sans_Thai({ subsets: ["thai"], variable: "--font-thai" });

export const metadata: Metadata = {
  title: "The Quantum Todo List — จัดการงานก่อนกลายเป็นบอส",
  description: "To-do list ที่ทำให้งานค้างค่อยๆ กลายร่างเป็นมอนสเตอร์ จัดการงานทีละชิ้นก่อนมันโตเป็นบอส",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${display.variable} ${body.variable} ${thai.variable}`}>
      <body>{children}</body>
    </html>
  );
}
