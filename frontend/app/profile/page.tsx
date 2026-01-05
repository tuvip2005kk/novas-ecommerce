"use client";
import { API_URL } from '@/config';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import {
    ArrowLeft, Package, User, Mail, Calendar, Loader2, Shield, Activity,
    CreditCard, ShoppingBag, Percent, Phone, Clock, Eye, X, Check
} from "lucide-react";
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
    discount?: number;
    items: OrderItem[];
}

interface ProfileData {
    id: number;
    email: string;
    name: string | null;
    phone?: string | null;
    role: string;
    createdAt: string;
    orders: Order[];
}

type TabType = 'info' | 'security' | 'activity';

export default function ProfilePage() {
    const { user, token, isLoading, logout } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('info');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Security toggles (UI only)
    const [otpEnabled, setOtpEnabled] = useState(false);
    const [totpEnabled, setTotpEnabled] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (token) {
            fetch(`${API_URL}/api/auth/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    setProfile(data);
                    if (data.orders) {
                        setOrders(data.orders);
                    }
                })
                .catch(console.error)
                .finally(() => setLoadingProfile(false));
        }
    }, [token]);

    if (isLoading || loadingProfile) {
        return (
            <main className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </main>
        );
    }

    if (!user) return null;

    // Calculate stats
    const paidOrders = orders.filter(o => o.status === 'Đã thanh toán');
    const totalSpent = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const totalProducts = paidOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);
    const totalDiscount = orders.reduce((sum, o) => sum + (o.discount || 0), 0);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Đã thanh toán': return 'bg-green-100 text-green-800';
            case 'Chờ thanh toán': return 'bg-yellow-100 text-yellow-800';
            case 'Đã hủy': return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';
    const formatDate = (date: string) => new Date(date).toLocaleDateString('vi-VN');
    const formatDateTime = (date: string) => new Date(date).toLocaleString('vi-VN');

    const tabs = [
        { id: 'info' as TabType, label: 'Thông tin cá nhân', icon: User },
        { id: 'security' as TabType, label: 'Bảo mật', icon: Shield },
        { id: 'activity' as TabType, label: 'Nhật ký hoạt động', icon: Activity },
    ];

    return (
        <>
            <Header />
            <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 pb-12">
                <div className="max-w-[1200px] mx-auto px-4 md:px-6">
                    <Link href="/" className="inline-flex items-center text-slate-500 hover:text-blue-600 mb-6 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Về trang chủ
                    </Link>

                    {/* Profile Header */}
                    <Card className="mb-6">
                        <CardContent className="py-6">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
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

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 border-b border-slate-200">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${activeTab === tab.id
                                    ? 'text-blue-600 border-blue-600'
                                    : 'text-slate-500 border-transparent hover:text-slate-700'
                                    }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'info' && (
                        <div className="space-y-6">
                            {/* Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                                    <CardContent className="py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white/20 rounded-xl">
                                                <CreditCard className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-blue-100 text-sm">Tổng tiền đã chi</p>
                                                <p className="text-2xl font-bold">{formatPrice(totalSpent)}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                                    <CardContent className="py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white/20 rounded-xl">
                                                <ShoppingBag className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-green-100 text-sm">Sản phẩm đã mua</p>
                                                <p className="text-2xl font-bold">{totalProducts} sản phẩm</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                                    <CardContent className="py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white/20 rounded-xl">
                                                <Percent className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-orange-100 text-sm">Đã tiết kiệm</p>
                                                <p className="text-2xl font-bold">{formatPrice(totalDiscount)}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Profile Details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-blue-600" />
                                        Hồ sơ cá nhân
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                                            <Mail className="h-5 w-5 text-slate-400" />
                                            <div>
                                                <p className="text-sm text-slate-500">Địa chỉ Email</p>
                                                <p className="font-medium">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                                            <Phone className="h-5 w-5 text-slate-400" />
                                            <div>
                                                <p className="text-sm text-slate-500">Số điện thoại</p>
                                                <p className="font-medium">{profile?.phone || 'Chưa cập nhật'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                                            <User className="h-5 w-5 text-slate-400" />
                                            <div>
                                                <p className="text-sm text-slate-500">Họ và Tên</p>
                                                <p className="font-medium">{user.name || 'Chưa cập nhật'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                                            <Calendar className="h-5 w-5 text-slate-400" />
                                            <div>
                                                <p className="text-sm text-slate-500">Đăng ký vào lúc</p>
                                                <p className="font-medium">{profile?.createdAt ? formatDateTime(profile.createdAt) : 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-blue-600" />
                                    Cài đặt bảo mật
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* OTP Email */}
                                <div className="flex items-center justify-between p-4 border rounded-xl hover:border-blue-200 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-100 rounded-xl">
                                            <Mail className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Xác minh đăng nhập bằng OTP Email</p>
                                            <p className="text-sm text-slate-500">Nhận mã OTP qua email mỗi lần đăng nhập</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setOtpEnabled(!otpEnabled)}
                                        className={`relative w-14 h-7 rounded-full transition-colors ${otpEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                                    >
                                        <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${otpEnabled ? 'right-1' : 'left-1'}`} />
                                    </button>
                                </div>

                                {/* Google Authenticator */}
                                <div className="flex items-center justify-between p-4 border rounded-xl hover:border-blue-200 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-green-100 rounded-xl">
                                            <Shield className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Xác minh bằng Google Authenticator</p>
                                            <p className="text-sm text-slate-500">Sử dụng ứng dụng Authenticator để xác thực 2 bước</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setTotpEnabled(!totpEnabled)}
                                        className={`relative w-14 h-7 rounded-full transition-colors ${totpEnabled ? 'bg-green-600' : 'bg-slate-300'}`}
                                    >
                                        <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${totpEnabled ? 'right-1' : 'left-1'}`} />
                                    </button>
                                </div>

                                <p className="text-sm text-slate-400 text-center pt-4">
                                    * Tính năng bảo mật nâng cao đang được phát triển
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'activity' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-blue-600" />
                                    Nhật ký hoạt động ({orders.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {orders.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                                        <p className="text-slate-500">Bạn chưa có hoạt động nào</p>
                                        <Link href="/">
                                            <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                                                Mua sắm ngay
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b text-left">
                                                    <th className="pb-3 font-medium text-slate-600">Thời gian</th>
                                                    <th className="pb-3 font-medium text-slate-600">Mã đơn</th>
                                                    <th className="pb-3 font-medium text-slate-600">Thao tác</th>
                                                    <th className="pb-3 font-medium text-slate-600">Trạng thái</th>
                                                    <th className="pb-3 font-medium text-slate-600 text-right">Tổng tiền</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orders.map(order => (
                                                    <tr key={order.id} className="border-b last:border-0 hover:bg-slate-50">
                                                        <td className="py-4 text-sm text-slate-600">
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="h-4 w-4 text-slate-400" />
                                                                {formatDateTime(order.createdAt)}
                                                            </div>
                                                        </td>
                                                        <td className="py-4">
                                                            <button
                                                                onClick={() => setSelectedOrder(order)}
                                                                className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                                                            >
                                                                #{order.paymentContent}
                                                                <Eye className="h-3 w-3" />
                                                            </button>
                                                        </td>
                                                        <td className="py-4 text-sm">
                                                            Mua {order.items.length} sản phẩm
                                                        </td>
                                                        <td className="py-4">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                                {order.status}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 text-right font-medium">
                                                            {formatPrice(order.total)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
                            <h3 className="text-lg font-bold">Chi tiết đơn hàng #{selectedOrder.paymentContent}</h3>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-slate-100 rounded-full">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600">Trạng thái</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                                    {selectedOrder.status}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600">Ngày đặt</span>
                                <span className="font-medium">{formatDateTime(selectedOrder.createdAt)}</span>
                            </div>
                            <hr />
                            <div className="space-y-3">
                                <p className="font-medium">Sản phẩm</p>
                                {selectedOrder.items.map(item => (
                                    <div key={item.id} className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                                            <div
                                                className="w-full h-full bg-cover bg-center"
                                                style={{ backgroundImage: `url(${item.product.image?.startsWith('http') ? item.product.image : `${API_URL}${item.product.image?.startsWith('/') ? '' : '/'}${item.product.image}`})` }}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{item.product.name}</p>
                                            <p className="text-slate-500 text-sm">x{item.quantity}</p>
                                        </div>
                                        <p className="font-medium">{formatPrice(item.product.price * item.quantity)}</p>
                                    </div>
                                ))}
                            </div>
                            <hr />
                            {(selectedOrder.discount ?? 0) > 0 && (
                                <div className="flex justify-between items-center text-green-600">
                                    <span>Giảm giá</span>
                                    <span>-{formatPrice(selectedOrder.discount ?? 0)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-lg font-bold">
                                <span>Tổng cộng</span>
                                <span className="text-blue-600">{formatPrice(selectedOrder.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
}
