"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User, LogIn, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export function UserMenu() {
    const { user, logout, isLoading } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (isLoading) {
        return <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" />;
    }

    if (!user) {
        return (
            <Link href="/login">
                <Button variant="outline" size="sm" className="gap-2">
                    <LogIn className="h-4 w-4" />
                    Đăng nhập
                </Button>
            </Link>
        );
    }

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                    {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                </div>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                            {user.name || "Người dùng"}
                        </p>
                        <p className="text-sm text-slate-500 truncate">{user.email}</p>
                    </div>
                    <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        <User className="h-4 w-4" />
                        Tài khoản của tôi
                    </Link>
                    {user.role === 'ADMIN' && (
                        <Link
                            href="/admin"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#21246b] font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Quản trị hệ thống
                        </Link>
                    )}
                    <button
                        onClick={() => {
                            logout();
                            setIsOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
                    >
                        <LogOut className="h-4 w-4" />
                        Đăng xuất
                    </button>
                </div>
            )}
        </div>
    );
}
