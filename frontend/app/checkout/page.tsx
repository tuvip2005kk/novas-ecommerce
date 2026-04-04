"use client";
import { API_URL } from '@/config';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { PaymentQR } from "@/components/PaymentQR";
import { ArrowLeft, CheckCircle2, Loader2, Tag } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

function CheckoutContent() {
    const searchParams = useSearchParams();
    const productId = searchParams.get("productId");
    const quantityParam = searchParams.get("quantity");
    const quantity = parseInt(quantityParam || "1");
    const isCartMode = searchParams.get("mode") === "cart";
    const { user, isLoading } = useAuth();
    const { items: cartItems, totalPrice: cartTotal, clearCart } = useCart();
    const router = useRouter();

    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState<any>(null);
    const [couponCode, setCouponCode] = useState("");
    const [couponInput, setCouponInput] = useState("");
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState("");
    const [discountAmount, setDiscountAmount] = useState(0);

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (productId && !isCartMode) {
            fetch(`${API_URL}/api/products/${productId}`)
                .then(res => res.json())
                .then(data => setProduct(data));
        }
    }, [productId, isCartMode]);

    if (isLoading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#21246b]"></div>
            </div>
        );
    }

    const subtotal = isCartMode ? cartTotal : (product?.price || 0) * quantity;
    const total = Math.max(0, subtotal - discountAmount);

    const applyCoupon = async () => {
        if (!couponInput.trim()) return;
        setCouponLoading(true);
        setCouponError("");
        try {
            const res = await fetch(`${API_URL}/api/sales/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponInput.trim(), orderTotal: subtotal }),
            });
            const data = await res.json();
            if (data.valid) {
                setCouponCode(couponInput.trim().toUpperCase());
                setDiscountAmount(data.sale.discountAmount);
            } else {
                setCouponError(data.error || "Mã giảm giá không hợp lệ");
                setCouponCode("");
                setDiscountAmount(0);
            }
        } catch {
            setCouponError("Lỗi kết nối. Vui lòng thử lại.");
        } finally {
            setCouponLoading(false);
        }
    };

    const removeCoupon = () => {
        setCouponCode("");
        setCouponInput("");
        setDiscountAmount(0);
        setCouponError("");
    };

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const orderItems = isCartMode
                ? cartItems.map(item => ({ productId: item.id, quantity: item.quantity }))
                : [{ productId: parseInt(productId as string), quantity }];

            const res = await fetch(`${API_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: orderItems,
                    customerName: (e.target as any).name.value,
                    customerPhone: (e.target as any).phone.value,
                    customerAddress: (e.target as any).address.value,
                    note: (e.target as any).note.value,
                    userId: user?.id || null,
                    saleCode: couponCode || null,
                    discount: discountAmount,
                }),
            });
            const data = await res.json();
            setOrder(data);
            if (isCartMode) clearCart();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (order) {
        return (
            <>
                <Header />
                <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 pt-24 pb-12">
                    <div className="container mx-auto px-4 max-w-lg">
                        <PaymentQR
                            orderId={order.id}
                            onPaymentSuccess={() => {}}
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

                    {/* Coupon Input */}
                    <div className="mb-6 p-4 bg-white rounded-lg border">
                        {couponCode ? (
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                                <span className="text-slate-700">Mã <strong className="font-mono text-[#21246b]">{couponCode}</strong> đã áp dụng</span>
                                <span className="ml-auto text-red-600 font-semibold">-{new Intl.NumberFormat('vi-VN').format(discountAmount)}đ</span>
                                <button onClick={removeCoupon} className="text-slate-400 hover:text-red-500 text-sm ml-2">Xóa</button>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                <Tag className="w-5 h-5 text-slate-400 flex-shrink-0 hidden sm:block" />
                                <span className="text-slate-600 text-sm whitespace-nowrap">Bạn có mã giảm giá?</span>
                                <div className="flex gap-2 flex-1 w-full">
                                    <input
                                        value={couponInput}
                                        onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                                        onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                                        placeholder="Nhập mã giảm giá"
                                        className="flex-1 h-10 px-4 border text-sm rounded"
                                    />
                                    <Button onClick={applyCoupon} variant="outline" disabled={couponLoading} className="whitespace-nowrap">
                                        {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Áp dụng'}
                                    </Button>
                                </div>
                                {couponError && <p className="text-red-500 text-sm w-full sm:pl-10">{couponError}</p>}
                            </div>
                        )}
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
                                            <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)}đ</span>
                                        </div>
                                    ))
                                ) : product && (
                                    <div className="flex justify-between text-sm pb-4 border-b border-slate-300">
                                        <span className="flex-1 pr-4">{product.name} <span className="text-[#21246b]">× {quantity}</span></span>
                                        <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(subtotal)}đ</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-sm py-3 border-b border-slate-300">
                                    <span>Tạm tính</span>
                                    <span>{new Intl.NumberFormat('vi-VN').format(subtotal)}đ</span>
                                </div>

                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-sm py-3 border-b border-slate-300 text-red-600">
                                        <span className="flex items-center gap-1">
                                            <Tag className="w-3.5 h-3.5" />
                                            Giảm giá ({couponCode})
                                        </span>
                                        <span className="font-semibold">-{new Intl.NumberFormat('vi-VN').format(discountAmount)}đ</span>
                                    </div>
                                )}

                                <div className="flex justify-between font-bold py-3 border-b border-slate-300">
                                    <span>Tổng cộng</span>
                                    <span className="text-[#21246b]">{new Intl.NumberFormat('vi-VN').format(total)}đ</span>
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

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#21246b]"></div></div>}>
            <CheckoutContent />
        </Suspense>
    );
}
