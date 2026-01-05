"use client";
import { API_URL } from '@/config';
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Loader2, Save, X, Edit2, Package, Clock, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface OrderItem {
    id: number;
    quantity: number;
    price: number;
    product: { id: number; name: string; image: string; price: number; };
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
    createdAt: string;
    orders: Order[];
}

export default function ProfilePage() {
    const { user, token, isLoading, logout } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [saving, setSaving] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    useEffect(() => {
        if (!isLoading && !user) router.push('/login');
    }, [user, isLoading, router]);

    useEffect(() => {
        if (token) {
            fetch(`${API_URL}/api/auth/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    console.log('Profile data:', data); // Debug
                    setProfile(data);
                    setEditName(data.name || '');
                    setEditPhone(data.phone || '');
                    if (data.orders && Array.isArray(data.orders)) {
                        setOrders(data.orders);
                    }
                })
                .catch(console.error)
                .finally(() => setLoadingProfile(false));
        }
    }, [token]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch(`${API_URL}/api/auth/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: editName, phone: editPhone })
            });
            setProfile(prev => prev ? { ...prev, name: editName, phone: editPhone } : null);
            setIsEditing(false);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (isLoading || loadingProfile) {
        return (
            <main className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
            </main>
        );
    }

    if (!user) return null;

    const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';
    const formatDate = (date: string) => new Date(date).toLocaleDateString('vi-VN');

    // Tính toán thống kê
    const paidOrders = orders.filter(o => o.status === 'Đã thanh toán');
    const totalSpent = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;

    return (
        <>
            <Header />
            <main className="min-h-screen bg-gray-50 pt-20 pb-12">
                <div className="max-w-3xl mx-auto px-4">
                    <Link href="/" className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-6">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Về trang chủ
                    </Link>

                    {/* Thống kê */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-white border rounded-lg p-4">
                            <p className="text-sm text-gray-500">Tổng tiền đã chi</p>
                            <p className="text-xl font-bold text-blue-600">{formatPrice(totalSpent)}</p>
                        </div>
                        <div className="bg-white border rounded-lg p-4">
                            <p className="text-sm text-gray-500">Số đơn hàng</p>
                            <p className="text-xl font-bold">{totalOrders} đơn</p>
                        </div>
                    </div>

                    {/* Hồ sơ cá nhân */}
                    <div className="bg-white border rounded-lg p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Hồ sơ cá nhân</h2>
                            {!isEditing ? (
                                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                    <Edit2 className="h-4 w-4 mr-1" /> Chỉnh sửa
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={handleSave} disabled={saving}>
                                        <Save className="h-4 w-4 mr-1" /> {saving ? 'Đang lưu...' : 'Lưu'}
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-500">Email</label>
                                <p className="font-medium">{user.email}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Họ và tên</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        className="w-full border rounded px-3 py-2 mt-1"
                                        placeholder="Nhập họ tên"
                                    />
                                ) : (
                                    <p className="font-medium">{profile?.name || 'Chưa cập nhật'}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Số điện thoại</label>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        value={editPhone}
                                        onChange={e => setEditPhone(e.target.value)}
                                        className="w-full border rounded px-3 py-2 mt-1"
                                        placeholder="Nhập số điện thoại"
                                    />
                                ) : (
                                    <p className="font-medium">{profile?.phone || 'Chưa cập nhật'}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Ngày đăng ký</label>
                                <p className="font-medium">{profile?.createdAt ? formatDate(profile.createdAt) : 'N/A'}</p>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t">
                            <Button variant="outline" onClick={logout} className="text-red-600 hover:bg-red-50">
                                Đăng xuất
                            </Button>
                        </div>
                    </div>

                    {/* Lịch sử đơn hàng */}
                    <div className="bg-white border rounded-lg p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Package className="h-5 w-5" /> Lịch sử đơn hàng ({orders.length})
                        </h2>

                        {orders.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">Bạn chưa có đơn hàng nào</p>
                        ) : (
                            <div className="divide-y">
                                {orders.map(order => (
                                    <div key={order.id} className="py-4 flex items-center justify-between">
                                        <div>
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                                            >
                                                #{order.paymentContent} <Eye className="h-3 w-3" />
                                            </button>
                                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                <Clock className="h-3 w-3" /> {formatDate(order.createdAt)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">{formatPrice(order.total)}</p>
                                            <span className={`text-xs px-2 py-1 rounded ${order.status === 'Đã thanh toán' ? 'bg-green-100 text-green-700' :
                                                    order.status === 'Đã hủy' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Modal chi tiết đơn hàng */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
                    <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-semibold">Đơn hàng #{selectedOrder.paymentContent}</h3>
                            <button onClick={() => setSelectedOrder(null)} className="p-1 hover:bg-gray-100 rounded">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Trạng thái</span>
                                <span className={`px-2 py-0.5 rounded text-xs ${selectedOrder.status === 'Đã thanh toán' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>{selectedOrder.status}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Ngày đặt</span>
                                <span>{formatDate(selectedOrder.createdAt)}</span>
                            </div>
                            <hr />
                            <div className="space-y-2">
                                {selectedOrder.items.map(item => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span>{item.product.name} x{item.quantity}</span>
                                        <span>{formatPrice(item.product.price * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>
                            <hr />
                            <div className="flex justify-between font-semibold">
                                <span>Tổng cộng</span>
                                <span>{formatPrice(selectedOrder.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
}
