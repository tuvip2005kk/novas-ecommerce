"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, ArrowLeft, Package, Truck, Home, RotateCcw, Clock } from "lucide-react";
import Link from "next/link";
import { API_URL } from "@/config";

interface OrderItem {
    id: number;
    quantity: number;
    price: number;
    product: { id: number; name: string; image: string; price: number };
}

interface Order {
    id: number;
    total: number;
    status: string;
    paymentContent: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    note: string;
    discount: number;
    createdAt: string;
    items: OrderItem[];
}

const ORDER_STATUSES = [
    { key: "Chờ thanh toán", label: "Chờ thanh toán", icon: Clock },
    { key: "Đã thanh toán", label: "Đã thanh toán", icon: CheckCircle2 },
    { key: "Đang chuẩn bị", label: "Đang chuẩn bị", icon: Package },
    { key: "Đang giao", label: "Đang giao", icon: Truck },
    { key: "Đã giao", label: "Đã giao thành công", icon: Home },
    { key: "Hoàn hàng", label: "Hoàn hàng", icon: RotateCcw },
];

function OrderContent({ orderId }: { orderId: string }) {
    const searchParams = useSearchParams();
    const paymentStatus = searchParams.get("payment");
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState<Order | null>(null);

    useEffect(() => {
        const loadOrder = async () => {
            if (paymentStatus === "success") {
                await fetch(`${API_URL}/api/orders/${orderId}/status`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "Đã thanh toán" })
                });
            }

            try {
                const res = await fetch(`${API_URL}/api/orders/${orderId}`);
                const data = await res.json();
                setOrder(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadOrder();
    }, [orderId, paymentStatus]);

    const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';
    const formatDate = (date: string) => new Date(date).toLocaleString('vi-VN');

    if (loading) {
        return (
            <main className="min-h-screen bg-white pt-24 pb-12 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </main>
        );
    }

    if (!order) {
        return (
            <main className="min-h-screen bg-white pt-24 pb-12">
                <div className="max-w-2xl mx-auto px-4 text-center">
                    <p>Không tìm thấy đơn hàng</p>
                    <Link href="/"><Button className="mt-4">Về trang chủ</Button></Link>
                </div>
            </main>
        );
    }

    // Get current status index
    const currentStatusIndex = ORDER_STATUSES.findIndex(s => s.key === order.status);

    return (
        <main className="min-h-screen bg-white pt-20 pb-12">
            <div className="max-w-2xl mx-auto px-4">
                <Link href="/profile" className="inline-flex items-center text-gray-600 mb-6">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
                </Link>

                <h1 className="text-xl font-bold mb-6">Đơn hàng #{order.paymentContent}</h1>

                {/* Trạng thái đơn hàng */}
                <div className="border p-6 rounded mb-6">
                    <h2 className="font-bold mb-4">Trạng thái đơn hàng</h2>
                    <div className="flex items-center justify-between">
                        {ORDER_STATUSES.slice(0, 5).map((status, index) => {
                            const Icon = status.icon;
                            const isActive = order.status === status.key;
                            const isPast = currentStatusIndex >= index;
                            return (
                                <div key={status.key} className="flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-blue-600 text-white' :
                                            isPast ? 'bg-green-500 text-white' : 'bg-gray-200'
                                        }`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <p className={`text-xs mt-2 text-center ${isActive ? 'text-blue-600' : ''}`}>
                                        {status.label}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                    {order.status === "Hoàn hàng" && (
                        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded text-center">
                            Đơn hàng đã được hoàn trả
                        </div>
                    )}
                </div>

                {/* Thông tin khách hàng */}
                <div className="border p-6 rounded mb-6">
                    <h2 className="font-bold mb-4">Thông tin giao hàng</h2>
                    <div className="space-y-3">
                        <div>
                            <p className="text-gray-500 text-sm">Họ tên</p>
                            <p>{order.customerName || 'Không có'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Số điện thoại</p>
                            <p>{order.customerPhone || 'Không có'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Địa chỉ</p>
                            <p>{order.customerAddress || 'Không có'}</p>
                        </div>
                        {order.note && (
                            <div>
                                <p className="text-gray-500 text-sm">Ghi chú</p>
                                <p>{order.note}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sản phẩm */}
                <div className="border p-6 rounded mb-6">
                    <h2 className="font-bold mb-4">Sản phẩm ({order.items.length})</h2>
                    <div className="divide-y">
                        {order.items.map(item => (
                            <div key={item.id} className="py-3 flex justify-between">
                                <div>
                                    <p>{item.product.name}</p>
                                    <p className="text-gray-500 text-sm">Số lượng: {item.quantity}</p>
                                </div>
                                <p>{formatPrice(item.product.price * item.quantity)}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tổng tiền */}
                <div className="border p-6 rounded">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Ngày đặt</span>
                            <span>{formatDate(order.createdAt)}</span>
                        </div>
                        {order.discount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Giảm giá</span>
                                <span className="text-green-600">-{formatPrice(order.discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between pt-2 border-t">
                            <span className="font-bold">Tổng cộng</span>
                            <span className="font-bold text-lg">{formatPrice(order.total)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function OrderDetailPage({ params }: { params: { orderId: string } }) {
    return (
        <>
            <Header />
            <Suspense fallback={
                <main className="min-h-screen bg-white pt-24 pb-12 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </main>
            }>
                <OrderContent orderId={params.orderId} />
            </Suspense>
            <Footer />
        </>
    );
}
