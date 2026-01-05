"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { API_URL } from "@/config";

function OrderContent({ orderId }: { orderId: string }) {
    const searchParams = useSearchParams();
    const paymentStatus = searchParams.get("payment");
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState<any>(null);

    useEffect(() => {
        const loadOrder = async () => {
            // If payment success, update order status FIRST
            if (paymentStatus === "success") {
                await fetch(`${API_URL}/api/orders/${orderId}/status`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "Đã thanh toán" })
                });
            }

            // THEN fetch order details
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

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-50 pt-24 pb-12 flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-24 pb-12">
            <div className="container mx-auto px-4 max-w-lg">
                {paymentStatus === "success" ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                        <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-green-800 mb-2">Thanh toán thành công!</h3>
                        <p className="text-green-600 mb-4">Đơn hàng #{orderId} đã được xác nhận</p>
                        <div className="flex gap-4">
                            <Link href="/" className="flex-1">
                                <Button variant="outline" className="w-full">Về trang chủ</Button>
                            </Link>
                            <Link href="/profile" className="flex-1">
                                <Button className="w-full bg-green-600 hover:bg-green-700">Đơn hàng của tôi</Button>
                            </Link>
                        </div>
                    </div>
                ) : paymentStatus === "error" ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                        <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-red-800 mb-2">Thanh toán thất bại!</h3>
                        <p className="text-red-600 mb-4">Đã xảy ra lỗi khi xử lý thanh toán cho đơn hàng #{orderId}</p>
                        <Button onClick={() => window.history.back()} variant="outline">
                            Thử lại
                        </Button>
                    </div>
                ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
                        <XCircle className="h-16 w-16 text-amber-600 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-amber-800 mb-2">Thanh toán bị hủy!</h3>
                        <p className="text-amber-600 mb-4">Bạn đã hủy thanh toán cho đơn hàng #{orderId}</p>
                        <div className="flex gap-4">
                            <Link href="/" className="flex-1">
                                <Button variant="outline" className="w-full">Về trang chủ</Button>
                            </Link>
                            <Button onClick={() => window.history.back()} className="flex-1 bg-amber-600 hover:bg-amber-700">
                                Thử lại
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

export default function OrderPaymentResultPage({ params }: { params: { orderId: string } }) {
    return (
        <>
            <Header />
            <Suspense fallback={
                <main className="min-h-screen bg-slate-50 pt-24 pb-12 flex items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                </main>
            }>
                <OrderContent orderId={params.orderId} />
            </Suspense>
            <Footer />
        </>
    );
}
