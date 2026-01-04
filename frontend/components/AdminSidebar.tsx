"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import {
    LayoutDashboard,
    Palette,
    Package,
    ShoppingCart,
    Users,
    Settings,
    BarChart3,
    Bell,
    Tag,
    LogOut,
    ChevronDown,
    ChevronRight,
    FolderTree,
    Star,
    Image,
    FileText,
} from "lucide-react";

const mainItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
];

const designSubItems = [
    { href: '/admin/design/banners', icon: Image, label: 'Banner' },
    { href: '/admin/design/footer', icon: FileText, label: 'Footer' },
];

const otherItems = [
    { href: '/admin/categories', icon: FolderTree, label: 'Danh mục' },
    { href: '/admin/products', icon: Package, label: 'Sản phẩm' },
    { href: '/admin/orders', icon: ShoppingCart, label: 'Đơn hàng' },
    { href: '/admin/users', icon: Users, label: 'Người dùng' },
    { href: '/admin/reviews', icon: Star, label: 'Đánh giá' },
    { href: '/admin/analytics', icon: BarChart3, label: 'Thống kê' },
    { href: '/admin/promotions', icon: Tag, label: 'Khuyến mãi' },
    { href: '/admin/notifications', icon: Bell, label: 'Thông báo' },
    { href: '/admin/settings', icon: Settings, label: 'Cài đặt' },
];

export function AdminSidebar({ onClose }: { onClose?: () => void }) {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [designOpen, setDesignOpen] = useState(pathname.startsWith('/admin/design'));

    const handleClick = () => {
        if (onClose) onClose();
    };

    const isDesignActive = pathname.startsWith('/admin/design');

    return (
        <aside className="fixed left-0 top-0 h-screen w-48 bg-white border-r border-slate-200 flex flex-col z-50">
            {/* Logo */}
            <div className="p-3 border-b border-slate-200">
                <Link href="/" className="text-xs text-slate-500 hover:text-slate-900 mb-1 block">
                    ← Trang chủ
                </Link>
                <h1 className="text-sm font-bold text-slate-900">Admin Panel</h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-2">
                <ul className="space-y-0.5 px-2">
                    {/* Dashboard */}
                    {mainItems.map(item => {
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    onClick={handleClick}
                                    className={`flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${isActive
                                        ? 'bg-slate-900 text-white'
                                        : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}

                    {/* Thiết kế - Expandable */}
                    <li>
                        <button
                            onClick={() => setDesignOpen(!designOpen)}
                            className={`w-full flex items-center justify-between px-3 py-1.5 text-sm transition-colors ${isDesignActive
                                ? 'bg-slate-900 text-white'
                                : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Palette className="h-4 w-4" />
                                <span>Thiết kế</span>
                            </div>
                            {designOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        </button>

                        {designOpen && (
                            <ul className="ml-4 border-l border-slate-200">
                                {designSubItems.map(item => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                onClick={handleClick}
                                                className={`flex items-center gap-2 px-3 py-1 text-xs transition-colors ${isActive
                                                    ? 'text-slate-900 font-medium bg-slate-100'
                                                    : 'text-slate-500 hover:text-slate-900'
                                                    }`}
                                            >
                                                <item.icon className="h-3 w-3" />
                                                {item.label}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </li>

                    {/* Other items */}
                    {otherItems.map(item => {
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    onClick={handleClick}
                                    className={`flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${isActive
                                        ? 'bg-slate-900 text-white'
                                        : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* User Info */}
            <div className="p-3 border-t border-slate-200">
                <div className="mb-2">
                    <p className="text-xs font-medium truncate">{user?.name || 'Admin'}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center gap-1 text-red-600 text-xs hover:underline"
                >
                    <LogOut className="h-3 w-3" />
                    Đăng xuất
                </button>
            </div>
        </aside>
    );
}
