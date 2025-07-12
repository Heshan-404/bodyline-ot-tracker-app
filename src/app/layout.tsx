import type {Metadata} from "next";
import {Inter} from "next/font/google";
import {AntdRegistry} from '@ant-design/nextjs-registry';
import AuthProvider from '../components/auth/AuthProvider';
import "../../global.css";

const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
    title: "Receipt Tracker System",
    description: "Track receipts through an approval workflow.",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body className={inter.className}>
        <AuthProvider>
            <AntdRegistry>{children}</AntdRegistry>
        </AuthProvider>
        </body>
        </html>
    );
}
