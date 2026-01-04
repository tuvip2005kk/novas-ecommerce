"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Package, User, Phone, MapPin, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface OrderDetail {
    id: number;
    paymentContent: string;
    total: number;
    status: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    note: string;
    createdAt: string;
    user: { id: number; email: string; name: string } | null;
    items: { id: number; quantity: number; price: number; product: { id: number; name: string; image: string; price: number } }[];
}

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrder();
    }, [params.id]);

    const fetchOrder = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:3005/orders/${params.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOrder(data);
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

    if (!order) {
        return (
            <div className="text-center py-20">
                <p className="text-slate-500">Không tìm thấy đơn hàng</p>
                <Button variant="link" onClick={() => router.back()}>Quay lại</Button>
            </div>
        );
    }

    const statusColors: Record<string, string> = {
        PENDING: "bg-yellow-100 text-yellow-800",
        PAID: "bg-green-100 text-green-800",
        SHIPPED: "bg-blue-100 text-blue-800",
        COMPLETED: "bg-emerald-100 text-emerald-800",
        CANCELLED: "bg-red-100 text-red-800",
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Chi tiết đơn hàng</h1>
                    <p className="text-slate-500 text-sm">Mã đơn: {order.paymentContent || `DH${order.id}`}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Order Info */}
                <Card className="md:col-span-2">
                    <CardContent className="pt-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Package className="h-5 w-5 text-slate-400" /> Sản phẩm
                        </h3>
                        <div className="space-y-4">
                            {order.items.map(item => (
                                <div key={item.id} className="flex gap-4 p-3 bg-slate-50 rounded-lg">
                                    <img src={item.product.image} alt={item.product.name} className="w-16 h-16 object-cover rounded" />
                                    <div className="flex-1">
                                        <p className="font-medium">{item.product.name}</p>
                                        <p className="text-sm text-slate-500">Số lượng: {item.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">{new Intl.NumberFormat("vi-VN").format(item.product.price * item.quantity)}đ</p>
                                        <p className="text-sm text-slate-500">{new Intl.NumberFormat("vi-VN").format(item.product.price)}đ/sp</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="border-t mt-4 pt-4 flex justify-between">
                            <span className="font-semibold">Tổng cộng:</span>
                            <span className="text-xl font-bold text-[#21246b]">{new Intl.NumberFormat("vi-VN").format(order.total)}đ</span>
                        </div>

                        {/* Payment Section */}
                        <div className="border-t mt-4 pt-4">
                            <h4 className="font-semibold mb-3">Thanh toán</h4>
                            <div className={`p-4 rounded-lg ${order.status === "PAID" || order.status === "COMPLETED" ? "bg-green-50" : "bg-yellow-50"}`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className={`font-medium ${order.status === "PAID" || order.status === "COMPLETED" ? "text-green-700" : "text-yellow-700"}`}>
                                            {order.status === "PAID" || order.status === "COMPLETED" ? "✓ Đã thanh toán" : "⏳ Chờ thanh toán"}
                                        </p>
                                        <p className="text-sm text-slate-500 mt-1">Nội dung CK: {order.paymentContent || `DH${order.id}`}</p>
                                    </div>
                                    {order.status === "PENDING" && (
                                        <img
                                            src={`https://qr.sepay.vn/img?acc=0348868647&bank=MBBank&amount=${Math.round(order.total)}&des=${order.paymentContent || `DH${order.id}`}`}
                                            alt="QR Code"
                                            className="w-24 h-24 rounded"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Customer Info */}
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <h3 className="font-semibold">Thông tin khách hàng</h3>

                        {order.user && (
                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                <User className="h-5 w-5 text-blue-500" />
                                <div>
                                    <p className="text-sm text-[#21246b]">Tài khoản</p>
                                    <p className="font-medium">{order.user.email}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-slate-400" />
                            <div>
                                <p className="text-sm text-slate-500">Họ tên</p>
                                <p className="font-medium">{order.customerName || "-"}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-slate-400" />
                            <div>
                                <p className="text-sm text-slate-500">Số điện thoại</p>
                                <p className="font-medium">{order.customerPhone || "-"}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-slate-400" />
                            <div>
                                <p className="text-sm text-slate-500">Địa chỉ</p>
                                <p className="font-medium">{order.customerAddress || "-"}</p>
                            </div>
                        </div>

                        {order.note && (
                            <div className="flex items-start gap-3">
                                <FileText className="h-5 w-5 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-slate-500">Ghi chú</p>
                                    <p className="font-medium">{order.note}</p>
                                </div>
                            </div>
                        )}

                        <div className="border-t pt-4 text-sm text-slate-500">
                            Ngày tạo: {new Date(order.createdAt).toLocaleString("vi-VN")}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
