"use client";

import Link from "next/link";
import { CartIcon } from "./CartIcon";
import { UserMenu } from "./UserMenu";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, Heart } from "lucide-react";

export function Header() {
    const { user } = useAuth();

    return (
        <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 dark:bg-slate-950/80">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                    LUXURY SANITARY
                </Link>
                <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <Link href="/#products" className="hover:text-blue-600 transition-colors">Products</Link>
                    <Link href="/likes" className="hover:text-blue-600 transition-colors flex items-center gap-1">
                        <Heart className="h-4 w-4" /> Yêu thích
                    </Link>
                    <Link href="#" className="hover:text-blue-600 transition-colors">About</Link>
                </div>
                <div className="flex items-center gap-4">
                    {user?.role === 'ADMIN' && (
                        <Link
                            href="/admin"
                            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-medium rounded-full hover:shadow-lg transition-all"
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Admin
                        </Link>
                    )}
                    {user && (
                        <Link href="/likes" className="relative p-2 hover:bg-slate-100 rounded-full transition-colors" title="Yêu thích">
                            <Heart className="h-5 w-5 text-slate-600 hover:text-red-500" />
                        </Link>
                    )}
                    <CartIcon />
                    <UserMenu />
                </div>
            </div>
        </nav>
    );
}

