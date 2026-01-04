"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    Settings,
    BarChart3,
    Bell,
    Tag,
    LogOut,
    ChevronLeft
} from "lucide-react";

const sidebarItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', description: 'Tổng quan' },
    { href: '/admin/products', icon: Package, label: 'Sản phẩm', description: 'Quản lý kho' },
    { href: '/admin/orders', icon: ShoppingCart, label: 'Đơn hàng', description: 'Xử lý đơn' },
    { href: '/admin/users', icon: Users, label: 'Người dùng', description: 'Quản lý tài khoản' },
    { href: '/admin/analytics', icon: BarChart3, label: 'Thống kê', description: 'Phân tích' },
    { href: '/admin/promotions', icon: Tag, label: 'Khuyến mãi', description: 'Mã giảm giá' },
    { href: '/admin/notifications', icon: Bell, label: 'Thông báo', description: 'Gửi thông báo' },
    { href: '/admin/settings', icon: Settings, label: 'Cài đặt', description: 'Hệ thống' },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white flex flex-col z-50">
            {/* Logo */}
            <div className="p-6 border-b border-slate-700">
                <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-4">
                    <ChevronLeft className="h-4 w-4" />
                    Về trang chủ
                </Link>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    🔒 Admin Panel
                </h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1 px-3">
                    {sidebarItems.map(item => {
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                            ? 'bg-blue-600 text-white'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <div>
                                        <p className="font-medium">{item.label}</p>
                                        <p className="text-xs opacity-70">{item.description}</p>
                                    </div>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* User Info */}
            <div className="p-4 border-t border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                        {user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{user?.name || 'Admin'}</p>
                        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors text-sm"
                >
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                </button>
            </div>
        </aside>
    );
}
