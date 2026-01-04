"use client";

import { Image, FileText } from "lucide-react";
import Link from "next/link";

const designOptions = [
    {
        href: '/admin/design/banners',
        icon: Image,
        title: 'Banner',
        description: 'Quản lý banner trang chủ & danh mục'
    },
    {
        href: '/admin/design/footer',
        icon: FileText,
        title: 'Footer',
        description: 'Showrooms, liên hệ, liên kết'
    },
];

export default function AdminDesign() {
    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-xl font-bold text-slate-900">Thiết kế</h1>
                <p className="text-sm text-slate-500">Tùy chỉnh giao diện</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {designOptions.map((option, index) => (
                    <Link key={index} href={option.href}>
                        <div className="border border-slate-200 bg-white p-4 hover:border-slate-400 transition-colors">
                            <div className="flex items-center gap-3">
                                <option.icon className="w-5 h-5 text-slate-600" />
                                <div>
                                    <h3 className="font-medium text-slate-900">{option.title}</h3>
                                    <p className="text-xs text-slate-500">{option.description}</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
