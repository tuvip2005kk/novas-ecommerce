"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/context/CartContext";
import { ArrowLeft, CheckCircle2, Loader2, ShoppingBag, Smartphone } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function CartCheckoutPage() {
    const { items, totalPrice, clearCart } = useCart();
    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState<any>(null);

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('http://localhost:3005/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: items.map(item => ({ productId: item.id, quantity: item.quantity })),
                    customerName: (e.target as any).name.value,
                    customerPhone: (e.target as any).phone.value,
                }),
            });
            const data = await res.json();
            setOrder(data);
            clearCart(); // Clear cart after successful order
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (order) {
        // Payment Step
        const qrUrl = `https://qr.sepay.vn/img?acc=0348868647&bank=MBBank&amount=${Math.round(order.total * 23000)}&des=${order.paymentContent}`;

        return (
            <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 py-20 flex items-center justify-center">
                <Card className="w-full max-w-lg shadow-2xl border-0">
                    <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg py-8">
                        <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                            <Smartphone className="h-8 w-8" />
                        </div>
                        <CardTitle className="text-2xl">Quét mã để thanh toán</CardTitle>
                        <p className="text-blue-100 mt-2">Mã đơn hàng: <span className="font-bold">{order.paymentContent}</span></p>
                    </CardHeader>
                    <CardContent className="space-y-6 p-8">
                        <div className="bg-white p-4 rounded-2xl shadow-inner mx-auto w-fit">
                            <img src={qrUrl} alt="SePay QR" className="w-56 h-56" />
                        </div>

                        <div className="text-center space-y-2">
                            <p className="text-3xl font-bold text-blue-600">{Math.round(order.total * 23000).toLocaleString('vi-VN')} VNĐ</p>
                            <p className="text-slate-500">(${order.total} USD)</p>
                        </div>

                        <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <div>
                                    <p className="font-semibold text-green-800">Đặt hàng thành công!</p>
                                    <p className="text-sm text-green-600">Quét mã QR để hoàn tất thanh toán</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm">
                            <p className="font-semibold text-slate-700">Hướng dẫn thanh toán:</p>
                            <ol className="list-decimal list-inside text-slate-600 space-y-1">
                                <li>Mở ứng dụng ngân hàng</li>
                                <li>Chọn "Quét QR" hoặc "Chuyển khoản"</li>
                                <li>Quét mã và xác nhận chuyển tiền</li>
                            </ol>
                        </div>

                        <Link href="/">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700">Về trang chủ</Button>
                        </Link>
                    </CardContent>
                </Card>
            </main>
        );
    }

    if (items.length === 0) {
        return (
            <main className="min-h-screen bg-slate-50 dark:bg-slate-950 py-20">
                <div className="container mx-auto px-4 text-center">
                    <ShoppingBag className="mx-auto h-24 w-24 text-slate-300 mb-6" />
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Giỏ hàng trống</h1>
                    <p className="text-slate-500 mb-8">Vui lòng thêm sản phẩm vào giỏ trước khi thanh toán.</p>
                    <Link href="/">
                        <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Tiếp tục mua sắm
                        </Button>
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 py-20">
            <div className="container mx-auto px-4 max-w-4xl">
                <Link href="/cart" className="inline-flex items-center text-slate-500 hover:text-blue-600 mb-8 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại giỏ hàng
                </Link>

                <div className="grid lg:grid-cols-5 gap-8">
                    {/* Order Items Summary */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Đơn hàng ({items.length} sản phẩm)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {items.map(item => (
                                    <div key={item.id} className="flex gap-4 items-center">
                                        <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                                            <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-sm truncate">{item.name}</h4>
                                            <p className="text-slate-500 text-sm">x{item.quantity}</p>
                                        </div>
                                        <p className="font-bold text-blue-600">${item.price * item.quantity}</p>
                                    </div>
                                ))}
                                <div className="pt-4 border-t flex justify-between items-center">
                                    <span className="font-semibold">Tổng cộng:</span>
                                    <span className="text-xl font-bold text-blue-600">${totalPrice}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Customer Info Form */}
                    <div className="lg:col-span-3">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                                    Thông tin giao hàng
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleCreateOrder} className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Họ và tên *</label>
                                            <input name="name" required className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" placeholder="Nguyễn Văn A" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Số điện thoại *</label>
                                            <input name="phone" required className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" placeholder="0909xxxxxx" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email</label>
                                        <input type="email" className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" placeholder="email@example.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Địa chỉ giao hàng</label>
                                        <textarea className="flex min-h-[100px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Ghi chú</label>
                                        <textarea className="flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none" placeholder="Ghi chú cho đơn hàng (tùy chọn)" />
                                    </div>

                                    <div className="pt-6 border-t space-y-4">
                                        <div className="flex justify-between items-center text-lg">
                                            <span className="font-semibold">Tổng thanh toán:</span>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-blue-600">{Math.round(totalPrice * 23000).toLocaleString('vi-VN')} VNĐ</p>
                                                <p className="text-sm text-slate-500">(${totalPrice} USD)</p>
                                            </div>
                                        </div>
                                        <Button type="submit" className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl" disabled={loading}>
                                            {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                                            Xác nhận đặt hàng
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </main>
    );
}
