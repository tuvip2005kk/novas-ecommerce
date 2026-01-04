"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { PaymentQR } from "@/components/PaymentQR";
import { ArrowLeft, CheckCircle2, CreditCard, Loader2, Smartphone, Tag } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

export default function CheckoutPage() {
    const searchParams = useSearchParams();
    const productId = searchParams.get("productId");
    const quantityParam = searchParams.get("quantity");
    const quantity = parseInt(quantityParam || "1");
    const isCartMode = searchParams.get("mode") === "cart";
    const { user } = useAuth();
    const { items: cartItems, totalPrice: cartTotal, clearCart } = useCart();

    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState<any>(null);
    const [discountCode, setDiscountCode] = useState("");
    const [discount, setDiscount] = useState(0);

    useEffect(() => {
        if (productId && !isCartMode) {
            fetch(`http://localhost:3005/api/products/${productId}`)
                .then(res => res.json())
                .then(data => setProduct(data));
        }
    }, [productId, isCartMode]);

    const applyDiscount = () => {
        if (discountCode.toUpperCase() === "GIAM10") {
            setDiscount(10);
        } else if (discountCode.toUpperCase() === "GIAM20") {
            setDiscount(20);
        } else {
            alert("Mã giảm giá không hợp lệ!");
            setDiscount(0);
        }
    };

    // Calculate totals based on mode
    const subtotal = isCartMode ? cartTotal : (product?.price || 0) * quantity;
    const discountAmount = subtotal * discount / 100;
    const total = subtotal - discountAmount;

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Build items array based on mode
            const orderItems = isCartMode
                ? cartItems.map(item => ({ productId: item.id, quantity: item.quantity }))
                : [{ productId: parseInt(productId as string), quantity }];

            const res = await fetch('http://localhost:3005/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: orderItems,
                    customerName: (e.target as any).name.value,
                    customerPhone: (e.target as any).phone.value,
                    customerAddress: (e.target as any).address.value,
                    note: (e.target as any).note.value,
                    userId: user?.id || null,
                    saleCode: discountCode || null,
                    discount: discountAmount,
                }),
            });
            const data = await res.json();
            setOrder(data);

            // Clear cart if in cart mode
            if (isCartMode) {
                clearCart();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (order) {
        // Payment Step - Using PaymentQR Component
        return (
            <>
                <Header />
                <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 pt-24 pb-12">
                    <div className="container mx-auto px-4 max-w-lg">
                        <PaymentQR
                            orderId={order.id}
                            onPaymentSuccess={() => {
                                // Có thể redirect hoặc hiển thị thông báo
                            }}
                        />

                        <div className="mt-6 flex gap-4">
                            <Link href="/" className="flex-1">
                                <Button variant="outline" className="w-full">Về trang chủ</Button>
                            </Link>
                            <Link href="/profile" className="flex-1">
                                <Button variant="outline" className="w-full">Đơn hàng của tôi</Button>
                            </Link>
                        </div>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <main className="min-h-screen bg-slate-50 pt-20 pb-12">
                <div className="max-w-[1200px] mx-auto px-4">
                    <Link href="/" className="inline-flex items-center text-slate-500 hover:text-blue-600 mb-6">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Tiếp tục mua sắm
                    </Link>

                    {/* Discount Code Banner */}
                    <div className="mb-6 p-4 bg-white rounded-lg border flex items-center gap-4">
                        <span className="text-slate-600">Bạn có mã giảm giá?</span>
                        <input
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value)}
                            placeholder="Nhập mã giảm giá"
                            className="flex-1 h-10 px-4 border text-sm"
                        />
                        <Button onClick={applyDiscount} variant="outline">Áp dụng</Button>
                        {discount > 0 && <span className="text-green-600 font-medium">-{discount}%</span>}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        {/* Left: Customer Form */}
                        <div className="lg:col-span-3">
                            <h2 className="text-lg font-bold text-[#21246b] uppercase mb-4">Thông tin mua hàng</h2>
                            <form onSubmit={handleCreateOrder} id="checkout-form" className="space-y-4">
                                <input name="name" required placeholder="Họ tên của bạn" className="w-full h-12 px-4 border border-slate-300" />
                                <input name="phone" required placeholder="Số điện thoại của bạn" className="w-full h-12 px-4 border border-slate-300" />
                                <input name="address" required placeholder="Số nhà, tên đường" className="w-full h-12 px-4 border border-slate-300" />
                                <div className="pt-4">
                                    <h4 className="font-bold text-[#21246b] mb-2">GHI CHÚ ĐƠN HÀNG</h4>
                                    <textarea name="note" className="w-full h-32 px-4 py-3 border border-slate-300 resize-none" />
                                </div>
                            </form>
                        </div>

                        {/* Right: Order Summary */}
                        <div className="lg:col-span-2">
                            <div className="bg-white p-6 border-2 border-[#21246b]">
                                <h2 className="text-lg font-bold text-[#21246b] uppercase mb-4">Đơn hàng của bạn</h2>

                                <div className="flex justify-between text-sm font-bold border-b border-slate-300 pb-2 mb-4">
                                    <span>SẢN PHẨM</span>
                                    <span>TẠM TÍNH</span>
                                </div>

                                {isCartMode ? (
                                    cartItems.map(item => (
                                        <div key={item.id} className="flex justify-between text-sm pb-2">
                                            <span className="flex-1 pr-4">{item.name} <span className="text-[#21246b]">× {item.quantity}</span></span>
                                            <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)} đ</span>
                                        </div>
                                    ))
                                ) : product && (
                                    <div className="flex justify-between text-sm pb-4 border-b border-slate-300">
                                        <span className="flex-1 pr-4">{product.name} <span className="text-[#21246b]">× {quantity}</span></span>
                                        <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(subtotal)} đ</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-sm py-3 border-b border-slate-300">
                                    <span>Tạm tính</span>
                                    <span>{new Intl.NumberFormat('vi-VN').format(subtotal)} đ</span>
                                </div>

                                <div className="flex justify-between font-bold py-3 border-b border-slate-300">
                                    <span>Tổng cộng</span>
                                    <span className="text-[#21246b]">{new Intl.NumberFormat('vi-VN').format(total)} đ</span>
                                </div>

                                <div className="py-4 text-sm">
                                    <p className="font-medium text-[#21246b]">Thanh toán khi nhận hàng (COD)</p>
                                    <p className="text-slate-500">Nhận hàng - Kiểm tra - Thanh toán</p>
                                </div>

                                <Button
                                    type="submit"
                                    form="checkout-form"
                                    className="w-full h-12 text-lg bg-[#21246b] hover:bg-blue-800"
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                                    ĐẶT HÀNG
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}

