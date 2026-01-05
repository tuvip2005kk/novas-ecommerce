"use client";
import { API_URL } from '@/config';
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Loader2, Save, X, Edit2, Package, Clock } from "lucide-react";
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
    const [saving, setSaving] = useState(false);

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
                    setProfile(data);
                    setEditName(data.name || '');
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
                body: JSON.stringify({ name: editName })
            });
            setProfile(prev => prev ? { ...prev, name: editName } : null);
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

    const paidOrders = orders.filter(o => o.status === 'Đã thanh toán' || o.status === 'Đang chuẩn bị' || o.status === 'Đang giao' || o.status === 'Đã giao');
    const totalSpent = paidOrders.reduce((sum, o) => sum + o.total, 0);

    return (
        <>
            <Header />
            <main className="min-h-screen bg-white pt-20 pb-12">
                <div className="max-w-2xl mx-auto px-4">
                    <Link href="/" className="inline-flex items-center text-gray-600 mb-6">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Về trang chủ
                    </Link>

                    {/* Thống kê */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="border p-4 rounded">
                            <p className="text-gray-500 text-sm">Tổng tiền đã chi</p>
                            <p className="text-lg font-normal">{formatPrice(totalSpent)}</p>
                        </div>
                        <div className="border p-4 rounded">
                            <p className="text-gray-500 text-sm">Số đơn hàng</p>
                            <p className="text-lg font-normal">{orders.length} đơn</p>
                        </div>
                    </div>

                    {/* Hồ sơ */}
                    <div className="border p-6 rounded mb-6">
                        <div className="flex justify-between mb-4">
                            <h2 className="font-bold">Hồ sơ cá nhân</h2>
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

                        <div className="space-y-3">
                            <div>
                                <p className="text-gray-500 text-sm">Email</p>
                                <p className="font-normal">{user.email}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Họ và tên</p>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        className="w-full border rounded px-3 py-2"
                                        placeholder="Nhập họ tên"
                                    />
                                ) : (
                                    <p className="font-normal">{profile?.name || 'Chưa cập nhật'}</p>
                                )}
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Ngày đăng ký</p>
                                <p className="font-normal">{profile?.createdAt ? formatDate(profile.createdAt) : 'N/A'}</p>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t">
                            <Button variant="outline" onClick={logout} className="text-red-600">
                                Đăng xuất
                            </Button>
                        </div>
                    </div>

                    {/* Lịch sử đơn hàng */}
                    <div className="border p-6 rounded">
                        <h2 className="font-bold mb-4 flex items-center gap-2">
                            <Package className="h-5 w-5" /> Lịch sử đơn hàng ({orders.length})
                        </h2>

                        {orders.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">Bạn chưa có đơn hàng nào</p>
                        ) : (
                            <div className="divide-y">
                                {orders.map(order => (
                                    <div key={order.id} className="py-3 flex justify-between items-center">
                                        <div>
                                            <Link
                                                href={`/order/${order.id}`}
                                                className="hover:underline"
                                            >
                                                #{order.paymentContent}
                                            </Link>
                                            <p className="text-gray-500 text-sm flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> {formatDate(order.createdAt)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-normal">{formatPrice(order.total)}</p>
                                            <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#21246b', color: 'white' }}>
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
            <Footer />
        </>
    );
}
