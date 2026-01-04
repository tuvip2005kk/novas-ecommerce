"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Mail, User, Calendar, ShoppingBag, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface UserDetail {
    id: number;
    email: string;
    name: string | null;
    role: string;
    createdAt: string;
    orders: { id: number; paymentContent: string; total: number; status: string; createdAt: string }[];
    likes: { product: { id: number; name: string; image: string } }[];
    _count: { orders: number; likes: number };
}

export default function UserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [user, setUser] = useState<UserDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUser();
    }, [params.id]);

    const fetchUser = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:3005/users/${params.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-20">
                <p className="text-slate-500">Không tìm thấy người dùng</p>
                <Link href="/admin/users" className="text-[#21246b] hover:underline mt-2 inline-block">
                    Quay lại danh sách
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.push("/admin/users")}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Chi tiết người dùng</h1>
                    <p className="text-slate-500 text-sm">ID: #{user.id}</p>
                </div>
            </div>

            {/* User Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardContent className="pt-6">
                        <h3 className="font-semibold mb-4">Thông tin cơ bản</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-slate-400" />
                                <div>
                                    <p className="text-sm text-slate-500">Email</p>
                                    <p className="font-medium">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <User className="h-5 w-5 text-slate-400" />
                                <div>
                                    <p className="text-sm text-slate-500">Họ tên</p>
                                    <p className="font-medium">{user.name || "-"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-slate-400" />
                                <div>
                                    <p className="text-sm text-slate-500">Ngày tạo</p>
                                    <p className="font-medium">{new Date(user.createdAt).toLocaleString("vi-VN")}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <h3 className="font-semibold mb-4">Vai trò</h3>
                        <span className={`px-3 py-1.5 rounded text-sm font-medium ${user.role === "ADMIN" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
                            }`}>
                            {user.role}
                        </span>

                        <div className="mt-6 pt-4 border-t">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Đơn hàng</span>
                                <span className="font-medium">{user._count?.orders || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm mt-2">
                                <span className="text-slate-500">Yêu thích</span>
                                <span className="font-medium">{user._count?.likes || 0}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Orders */}
            {user.orders && user.orders.length > 0 && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <ShoppingBag className="h-5 w-5 text-slate-400" />
                            <h3 className="font-semibold">Đơn hàng gần đây</h3>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-slate-500">
                                    <th className="pb-2">Mã đơn</th>
                                    <th className="pb-2">Trạng thái</th>
                                    <th className="pb-2">Tổng tiền</th>
                                    <th className="pb-2">Ngày tạo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {user.orders.map(order => (
                                    <tr key={order.id} className="border-b hover:bg-slate-50">
                                        <td className="py-2">
                                            <Link
                                                href={`/admin/orders/${order.id}`}
                                                className="text-[#21246b] hover:underline font-medium"
                                            >
                                                {order.paymentContent || `DH${order.id}`}
                                            </Link>
                                        </td>
                                        <td className="py-2">{order.status}</td>
                                        <td className="py-2">{new Intl.NumberFormat("vi-VN").format(order.total)}đ</td>
                                        <td className="py-2">{new Date(order.createdAt).toLocaleDateString("vi-VN")}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            {/* Liked Products */}
            {user.likes && user.likes.length > 0 && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Heart className="h-5 w-5 text-slate-400" />
                            <h3 className="font-semibold">Sản phẩm yêu thích</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {user.likes.map(like => (
                                <div key={like.product.id} className="text-center">
                                    <img
                                        src={like.product.image}
                                        alt={like.product.name}
                                        className="w-full aspect-square object-cover rounded-lg"
                                    />
                                    <p className="text-sm mt-2 line-clamp-2">{like.product.name}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
