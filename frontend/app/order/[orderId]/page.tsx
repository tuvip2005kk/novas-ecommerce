"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, ArrowLeft, Package, Truck, Home, RotateCcw, Clock } from "lucide-react";
import Link from "next/link";
import { API_URL } from "@/config";
import { PaymentQR } from "@/components/PaymentQR";

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
                            let isActive = order.status === status.key;
                            let isPast = currentStatusIndex >= index;
                            
                            // Nếu đơn hàng đã hủy thì reset màu
                            if (order.status === "Đã hủy" || order.status === "Hoàn hàng") {
                                isActive = false;
                                isPast = false;
                            }

                            return (
                                <div key={status.key} className="flex flex-col items-center relative z-10 w-1/5">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm"
                                        style={{
                                            backgroundColor: isActive || isPast ? '#21246b' : '#f3f4f6',
                                            color: isActive || isPast ? 'white' : '#9ca3af'
                                        }}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <p className="text-xs mt-2 text-center font-medium" style={{ color: isActive ? '#21246b' : undefined }}>
                                        {status.label}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                    
                    {order.status === "Hoàn hàng" && (
                        <div className="mt-6 p-4 bg-red-50 text-red-600 rounded text-center font-medium border border-red-100 flex items-center justify-center gap-2">
                            <RotateCcw className="w-5 h-5" /> Đơn hàng đã được hoàn trả
                        </div>
                    )}
                    {order.status === "Đã hủy" && (
                        <div className="mt-6 p-4 bg-gray-100 text-gray-600 rounded text-center font-medium border border-gray-200 flex items-center justify-center gap-2">
                            <XCircle className="w-5 h-5" /> Đơn hàng đã bị hủy
                        </div>
                    )}

                    {order.status === "Chờ thanh toán" && (
                        <div className="mt-6 pt-6 border-t flex flex-col items-center">
                            {order.note?.includes('[Thanh toán Online]') ? (
                                <div className="text-center w-full">
                                    <p className="text-sm text-slate-600 mb-4">Bạn chưa hoàn tất thanh toán trực tuyến cho đơn hàng này.</p>
                                    <PaymentQR orderId={order.id} onPaymentSuccess={() => { window.location.href = `/order/${order.paymentContent}?payment=success` }} />
                                    <Button 
                                        variant="outline"
                                        className="mt-4 text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={async () => {
                                            if (confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) {
                                                setLoading(true);
                                                await fetch(`${API_URL}/api/orders/${order.id}/status`, {
                                                    method: "PATCH",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ status: "Đã hủy" })
                                                });
                                                window.location.reload();
                                            }
                                        }}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" /> Hủy bỏ đơn hàng này
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center w-full">
                                    <div className="p-4 bg-gray-100 text-gray-700 rounded mb-4 font-medium border border-gray-200">
                                        Đơn hàng đang chờ nhân viên gọi điện xác nhận. Bạn sẽ thanh toán khi nhận được hàng.
                                    </div>
                                    <Button 
                                        variant="outline"
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={async () => {
                                            if (confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) {
                                                setLoading(true);
                                                await fetch(`${API_URL}/api/orders/${order.id}/status`, {
                                                    method: "PATCH",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ status: "Đã hủy" })
                                                });
                                                window.location.reload();
                                            }
                                        }}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" /> Hủy bỏ đơn hàng
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Thông tin khách hàng */}
                <div className="border p-6 rounded mb-6">
                    <h2 className="font-bold mb-4">Thông tin giao hàng</h2>
                    <div className="space-y-3">
                        <div>
                            <p className="text-gray-500 text-sm">Họ tên</p>
                            <p className="font-normal">{order.customerName || 'Không có'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Số điện thoại</p>
                            <p className="font-normal">{order.customerPhone || 'Không có'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Địa chỉ</p>
                            <p className="font-normal">{order.customerAddress || 'Không có'}</p>
                        </div>
                        {order.note && (
                            <div>
                                <p className="text-gray-500 text-sm">Ghi chú</p>
                                <p className="font-normal">{order.note}</p>
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
                                    <p className="font-normal">{item.product.name}</p>
                                    <p className="text-gray-500 text-sm">Số lượng: {item.quantity}</p>
                                </div>
                                <p className="font-normal">{formatPrice(item.product.price * item.quantity)}</p>
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
                                <span className="font-normal">-{formatPrice(order.discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between pt-2 border-t">
                            <span className="font-bold">Tổng cộng</span>
                            <span className="font-normal text-lg">{formatPrice(order.total)}</span>
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
