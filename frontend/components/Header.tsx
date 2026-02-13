"use client";

import Link from "next/link";
import { CartIcon } from "./CartIcon";
import { UserMenu } from "./UserMenu";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, Heart, Search, ChevronDown } from "lucide-react";

export function Header() {
    const { user } = useAuth();

    return (
        <nav className="fixed w-full z-50 bg-[#21246b] shadow-md">
            <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-[70px] flex items-center justify-between">
                {/* Left: Logo + Navigation */}
                <div className="flex items-center gap-8">
                    <Link href="/" className="text-3xl font-extrabold text-white hover:opacity-80 transition-opacity tracking-tight">
                        NOVAS
                    </Link>

                    <div className="hidden md:flex items-center space-x-6 text-sm font-bold text-white uppercase">
                        <Link href="/intro" className="hover:text-yellow-300 transition-colors">Giới thiệu</Link>

                        {/* Mega Menu */}
                        <div className="relative group h-16 flex items-center">
                            <span className="cursor-pointer hover:text-yellow-300 transition-colors flex items-center gap-1 py-4">
                                Thiết bị vệ sinh
                                <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
                            </span>

                            <div className="absolute top-full left-0 w-56 bg-white shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform translate-y-2 group-hover:translate-y-0">
                                <Link href="/bon-cau" className="block px-4 py-3 text-base text-[#21246b] hover:bg-[#21246b] hover:text-white transition-colors normal-case font-semibold">
                                    Bồn cầu
                                </Link>
                                <Link href="/lavabo" className="block px-4 py-3 text-base text-[#21246b] hover:bg-[#21246b] hover:text-white transition-colors normal-case font-semibold">
                                    Chậu Lavabo
                                </Link>
                                <Link href="/voi-sen" className="block px-4 py-3 text-base text-[#21246b] hover:bg-[#21246b] hover:text-white transition-colors normal-case font-semibold">
                                    Vòi Sen
                                </Link>
                                <Link href="/bon-tam" className="block px-4 py-3 text-base text-[#21246b] hover:bg-[#21246b] hover:text-white transition-colors normal-case font-semibold">
                                    Bồn Tắm
                                </Link>
                                <Link href="/phu-kien" className="block px-4 py-3 text-base text-[#21246b] hover:bg-[#21246b] hover:text-white transition-colors normal-case font-semibold">
                                    Phụ Kiện
                                </Link>
                            </div>
                        </div>

                        <Link href="/chinh-sach-bao-hanh" className="hover:text-yellow-300 transition-colors">Chính sách bảo hành</Link>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <Search className="h-6 w-6 text-white" />
                    </button>
                    {user && (
                        <Link href="/likes" className="relative p-2 hover:bg-white/20 rounded-full transition-colors" title="Yêu thích">
                            <Heart className="h-6 w-6 text-white hover:text-red-400" />
                        </Link>
                    )}
                    <CartIcon />
                    <UserMenu />
                </div>
            </div>
        </nav>
    );
}
