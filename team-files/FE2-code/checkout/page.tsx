"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { ArrowLeft, CheckCircle2, CreditCard, Loader2, Smartphone } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function CheckoutPage() {
    const searchParams = useSearchParams();
    const productId = searchParams.get("productId");

    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState<any>(null);

    useEffect(() => {
        if (productId) {
            fetch(`http://localhost:3005/api/products/${productId}`)
                .then(res => res.json())
                .then(data => setProduct(data));
        }
    }, [productId]);

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('http://localhost:3005/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: [{ productId: parseInt(productId as string), quantity: 1 }],
                    customerName: (e.target as any).name.value,
                    customerPhone: (e.target as any).phone.value,
                    customerAddress: (e.target as any).address.value,
                    note: (e.target as any).note.value,
                }),
            });
            const data = await res.json();
            setOrder(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (order) {
        // Payment Step - Beautiful QR Display
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

                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                            <div className="flex items-center gap-3">
                                <Loader2 className="h-5 w-5 text-amber-600 animate-spin" />
                                <div>
                                    <p className="font-semibold text-amber-800">Đang chờ thanh toán...</p>
                                    <p className="text-sm text-amber-600">Hệ thống sẽ tự động xác nhận sau khi bạn chuyển khoản</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm">
                            <p className="font-semibold text-slate-700">Hướng dẫn:</p>
                            <ol className="list-decimal list-inside text-slate-600 space-y-1">
                                <li>Mở ứng dụng ngân hàng trên điện thoại</li>
                                <li>Chọn "Quét QR" hoặc "Chuyển khoản"</li>
                                <li>Quét mã QR ở trên</li>
                                <li>Xác nhận thanh toán</li>
                            </ol>
                        </div>

                        <div className="flex gap-4">
                            <Link href="/" className="flex-1">
                                <Button variant="outline" className="w-full">Về trang chủ</Button>
                            </Link>
                            <Link href="/cart" className="flex-1">
                                <Button variant="outline" className="w-full">Xem giỏ hàng</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </main>
        )
    }

    return (
        <>
            <Header />
            <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 pb-12">
                <div className="container mx-auto px-4 max-w-2xl">
                    <Link href={productId ? `/products/${productId}` : "/"} className="inline-flex items-center text-slate-500 hover:text-blue-600 mb-8 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
                    </Link>

                    <div className="grid gap-8">
                        {product && (
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex gap-6 items-center">
                                        <div className="w-24 h-24 bg-slate-100 rounded-xl overflow-hidden">
                                            <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${product.image})` }} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg">{product.name}</h3>
                                            <p className="text-slate-500 text-sm line-clamp-1">{product.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-blue-600">${product.price}</p>
                                            <p className="text-sm text-slate-500">x1</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-blue-600" />
                                    Thông tin giao hàng
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleCreateOrder} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Họ và tên *</label>
                                        <input name="name" required className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" placeholder="Nguyễn Văn A" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Số điện thoại *</label>
                                        <input name="phone" required className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" placeholder="0909xxxxxx" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Địa chỉ giao hàng *</label>
                                        <textarea name="address" required className="flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Ghi chú</label>
                                        <textarea name="note" className="flex min-h-[60px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none" placeholder="Ghi chú thêm cho đơn hàng (tùy chọn)" />
                                    </div>

                                    <div className="pt-4 border-t">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-slate-600">Tổng thanh toán:</span>
                                            <span className="text-2xl font-bold text-blue-600">${product?.price || 0}</span>
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
            </main>
        </>
    );
}

