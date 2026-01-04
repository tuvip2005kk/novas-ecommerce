"use client";
import { API_URL } from '@/config';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Package, User, Mail, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface OrderItem {
    id: number;
    quantity: number;
    price: number;
    product: {
        id: number;
        name: string;
        image: string;
        price: number;
    };
}

interface Order {
    id: number;
    total: number;
    status: string;
    paymentContent: string;
    createdAt: string;
    items: OrderItem[];
}

export default function ProfilePage() {
    const { user, token, isLoading, logout } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(true);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (token) {
            fetch(`${API_URL}/auth/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.orders) {
                        setOrders(data.orders);
                    }
                })
                .catch(console.error)
                .finally(() => setLoadingOrders(false));
        }
    }, [token]);

    if (isLoading) {
        return (
            <main className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </main>
        );
    }

    if (!user) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-green-100 text-green-800';
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'CANCELLED': return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'PAID': return 'Đã thanh toán';
            case 'PENDING': return 'Chờ thanh toán';
            case 'CANCELLED': return 'Đã hủy';
            default: return status;
        }
    };

    return (
        <>
            <Header />
            <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 pb-12">
                <div className="max-w-[1200px] mx-auto px-4 md:px-6">
                    <Link href="/" className="inline-flex items-center text-slate-500 hover:text-blue-600 mb-8 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Về trang chủ
                    </Link>

                    <div className="grid gap-8">
                        {/* User Info Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-blue-600" />
                                    Thông tin tài khoản
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                                        {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {user.name || 'Chưa cập nhật tên'}
                                        </h2>
                                        <p className="text-slate-500 flex items-center gap-2 mt-1">
                                            <Mail className="h-4 w-4" />
                                            {user.email}
                                        </p>
                                    </div>
                                    <Button variant="outline" onClick={logout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                        Đăng xuất
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Order History */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-blue-600" />
                                    Lịch sử đơn hàng ({orders.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loadingOrders ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                    </div>
                                ) : orders.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                                        <p className="text-slate-500">Bạn chưa có đơn hàng nào</p>
                                        <Link href="/">
                                            <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                                                Mua sắm ngay
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {orders.map(order => (
                                            <div key={order.id} className="border rounded-xl p-4 hover:border-blue-200 transition-colors">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold text-blue-600">#{order.paymentContent}</span>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                            {getStatusText(order.status)}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-lg">${order.total}</p>
                                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    {order.items.map(item => (
                                                        <div key={item.id} className="flex items-center gap-3 text-sm">
                                                            <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                                                                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${item.product.image})` }} />
                                                            </div>
                                                            <span className="flex-1 truncate">{item.product.name}</span>
                                                            <span className="text-slate-500">x{item.quantity}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
