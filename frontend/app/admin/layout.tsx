"use client";

import { useAuth } from "@/context/AuthContext";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, ShieldAlert, Menu, X } from "lucide-react";
import Link from "next/link";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-900" />
            </div>
        );
    }

    if (!user || user.role !== 'ADMIN') {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="border border-slate-200 p-6 max-w-sm w-full text-center">
                    <ShieldAlert className="h-8 w-8 text-red-600 mx-auto mb-3" />
                    <h2 className="text-lg font-bold text-slate-900 mb-1">Truy cập bị từ chối</h2>
                    <p className="text-sm text-slate-500 font-normal mb-4">Bạn không có quyền truy cập trang Admin.</p>
                    <Link href="/" className="text-sm text-blue-600 hover:underline">
                        Về trang chủ
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 p-3 flex items-center justify-between z-50">
                <h1 className="text-sm font-bold">Admin</h1>
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1">
                    {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Overlay */}
            {sidebarOpen && (
                <div className="lg:hidden fixed inset-0 bg-black/30 z-40" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <div className={`lg:block ${sidebarOpen ? 'block' : 'hidden'}`}>
                <AdminSidebar onClose={() => setSidebarOpen(false)} />
            </div>

            {/* Main content */}
            <main className="lg:ml-48 p-4 pt-16 lg:pt-4">
                {children}
            </main>
        </div>
    );
}

