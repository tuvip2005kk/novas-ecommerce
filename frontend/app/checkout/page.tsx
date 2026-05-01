"use client";
import { API_URL } from '@/config';

import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { PaymentQR } from "@/components/PaymentQR";
import { ArrowLeft, CheckCircle2, CreditCard, Landmark, Loader2, Tag } from "lucide-react";
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
    const { user, isLoading, updateUserLocally } = useAuth();
    const { items: allCartItems, totalPrice: allCartTotal, clearCart } = useCart();
    const router = useRouter();

    const selectedIdsParam = searchParams.get("ids");
    const selectedIds = selectedIdsParam ? selectedIdsParam.split(',').map(id => parseInt(id)) : [];

    const cartItems = isCartMode && selectedIds.length > 0 
        ? allCartItems.filter(item => selectedIds.includes(item.id))
        : allCartItems;
    
    const cartTotal = isCartMode && selectedIds.length > 0
        ? cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
        : allCartTotal;

    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState<any>(null);
    const [couponCode, setCouponCode] = useState("");
    const [couponInput, setCouponInput] = useState("");
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState("");
    const [discountAmount, setDiscountAmount] = useState(0);

    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const [customerNote, setCustomerNote] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("COD"); // 'COD' or 'ONLINE'
    const [onlinePaymentMethod, setOnlinePaymentMethod] = useState("BANK_TRANSFER"); // 'BANK_TRANSFER' or 'CARD'
    const [cardError, setCardError] = useState("");

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login');
        } else if (user) {
            // Pre-fill form if user has saved information
            if (user.name) setCustomerName(user.name);
            if (user.phone) setCustomerPhone(user.phone);
            if (user.address) setCustomerAddress(user.address);
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (productId && !isCartMode) {
            fetch(`${API_URL}/api/products/${productId}`)
                .then(res => res.json())
                .then(data => setProduct(data));
        }
    }, [productId, isCartMode]);

    const subtotal = isCartMode ? cartTotal : (product?.price || 0) * quantity;
    const total = Math.max(0, subtotal - discountAmount);

    useEffect(() => {
        const urlCoupon = searchParams.get("coupon");
        if (urlCoupon && subtotal > 0 && !couponCode) {
            setCouponInput(urlCoupon);
            fetch(`${API_URL}/api/sales/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: urlCoupon, orderTotal: subtotal }),
            })
            .then(res => res.json())
            .then(data => {
                if (data.valid) {
                    setCouponCode(urlCoupon.toUpperCase());
                    setDiscountAmount(data.sale.discountAmount);
                }
            });
        }
    }, [searchParams, subtotal, couponCode]);

    if (isLoading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#21246b]"></div>
            </div>
        );
    }

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

    const isCardPayment = paymentMethod === 'ONLINE' && onlinePaymentMethod === 'CARD';

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setCardError("");
        setLoading(true);
        
        // Lưu lại ngay ở Local để quay ra vẫn có
        if (user) {
            updateUserLocally({ name: customerName, phone: customerPhone, address: customerAddress });
        }

        try {
            const orderItems = isCartMode
                ? cartItems.map(item => ({ productId: item.id, quantity: item.quantity }))
                : [{ productId: parseInt(productId as string), quantity }];

            const finalNote = paymentMethod === 'COD'
                ? `[Thanh toán khi nhận hàng] ${customerNote}`
                : onlinePaymentMethod === 'CARD'
                    ? `[Thanh toán Online][Thanh toán bằng thẻ] ${customerNote}`
                    : `[Thanh toán Online][Chuyển khoản ngân hàng] ${customerNote}`;

            const res = await fetch(`${API_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: orderItems,
                    customerName,
                    customerPhone,
                    customerAddress,
                    note: finalNote,
                    userId: user?.id || null,
                    saleCode: couponCode || null,
                    discount: discountAmount,
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.message || "Không thể tạo đơn hàng.");
            }

            if (isCardPayment) {
                const checkoutRes = await fetch(`${API_URL}/api/card-payments/checkout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId: data.id }),
                });
                const checkoutData = await checkoutRes.json();

                if (!checkoutRes.ok || !checkoutData.checkoutUrl) {
                    throw new Error(checkoutData?.message || "Không thể tạo phiên thanh toán thẻ.");
                }

                if (isCartMode) clearCart();
                window.location.href = checkoutData.checkoutUrl;
                return;
            } else {
                setOrder(data);
            }

            if (isCartMode) clearCart();
        } catch (err) {
            console.error(err);
            if (isCardPayment) {
                setCardError(err instanceof Error
                    ? err.message
                    : "Không thể tạo thanh toán thẻ. Vui lòng kiểm tra cấu hình Stripe hoặc chọn chuyển khoản ngân hàng.");
            }
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
                        {paymentMethod === 'ONLINE' && onlinePaymentMethod === 'BANK_TRANSFER' ? (
                            <PaymentQR
                                orderId={order.id}
                                onPaymentSuccess={() => {}}
                            />
                        ) : (
                            <div className="bg-white p-8 rounded-xl shadow-xl text-center border-t-4 border-[#21246b]">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-[#21246b] mb-2">
                                    {isCardPayment ? 'Thanh toán thành công!' : 'Đặt hàng thành công!'}
                                </h2>
                                {isCardPayment ? (
                                    <p className="text-slate-600 mb-6">
                                        Đơn hàng <strong>#{order.paymentContent || order.id}</strong> đã được thanh toán bằng thẻ.
                                    </p>
                                ) : (
                                    <p className="text-slate-600 mb-6">
                                        Mã đơn hàng của bạn là <strong>#{order.id}</strong>.<br/><br/>
                                        Nhân viên sẽ gọi điện xác nhận đơn hàng của bạn qua số điện thoại <strong>{customerPhone}</strong> sớm nhất.
                                    </p>
                                )}
                            </div>
                        )}
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
                                <input 
                                    name="name" 
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    required 
                                    placeholder="Họ tên của bạn" 
                                    className="w-full h-12 px-4 border border-slate-300" 
                                />
                                <input 
                                    name="phone" 
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    required 
                                    placeholder="Số điện thoại của bạn" 
                                    className="w-full h-12 px-4 border border-slate-300" 
                                />
                                <input 
                                    name="address" 
                                    value={customerAddress}
                                    onChange={(e) => setCustomerAddress(e.target.value)}
                                    required 
                                    placeholder="Số nhà, tên đường" 
                                    className="w-full h-12 px-4 border border-slate-300" 
                                />
                                <div className="pt-4">
                                    <h4 className="font-bold text-[#21246b] mb-2">GHI CHÚ ĐƠN HÀNG</h4>
                                    <textarea 
                                        name="note" 
                                        value={customerNote}
                                        onChange={(e) => setCustomerNote(e.target.value)}
                                        className="w-full h-32 px-4 py-3 border border-slate-300 resize-none" 
                                    />
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

                                <div className="py-4 text-sm space-y-4">
                                    <div>
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="paymentMethod" 
                                                value="COD" 
                                                checked={paymentMethod === 'COD'}
                                                onChange={() => setPaymentMethod('COD')}
                                                className="w-4 h-4 mt-0.5 text-[#21246b] border-slate-300 focus:ring-[#21246b]"
                                            />
                                            <div>
                                                <p className="font-medium text-[#21246b]">Thanh toán khi nhận hàng (COD)</p>
                                                <p className="text-slate-500 text-xs mt-0.5">Nhận hàng - Kiểm tra - Thanh toán</p>
                                            </div>
                                        </label>
                                        {paymentMethod === 'COD' && (
                                            <div className="mt-3 ml-7 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-xs leading-relaxed">
                                                * <strong>Lưu ý:</strong> Quý khách vui lòng điền đúng và đầy đủ thông tin, sau đó để ý điện thoại nhân viên sẽ gọi xác nhận.
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="ONLINE"
                                                checked={paymentMethod === 'ONLINE'}
                                                onChange={() => setPaymentMethod('ONLINE')}
                                                className="w-4 h-4 mt-0.5 text-[#21246b] border-slate-300 focus:ring-[#21246b]"
                                            />
                                            <div>
                                                <p className="font-medium text-[#21246b]">Thanh toán trực tuyến</p>
                                                <p className="text-slate-500 text-xs mt-0.5">Chọn thanh toán bằng thẻ hoặc chuyển khoản ngân hàng</p>
                                            </div>
                                        </label>

                                        {paymentMethod === 'ONLINE' && (
                                            <div className="mt-3 ml-7 space-y-3">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setOnlinePaymentMethod('BANK_TRANSFER')}
                                                        className={`min-h-20 border px-3 py-3 text-left transition ${
                                                            onlinePaymentMethod === 'BANK_TRANSFER'
                                                                ? 'border-[#21246b] bg-[#21246b]/5 text-[#21246b]'
                                                                : 'border-slate-200 hover:border-slate-300'
                                                        }`}
                                                    >
                                                        <Landmark className="h-5 w-5 mb-2" />
                                                        <span className="block font-medium">CK ngân hàng</span>
                                                        <span className="block text-xs text-slate-500 mt-1">Quét mã QR</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setOnlinePaymentMethod('CARD')}
                                                        className={`min-h-20 border px-3 py-3 text-left transition ${
                                                            onlinePaymentMethod === 'CARD'
                                                                ? 'border-[#21246b] bg-[#21246b]/5 text-[#21246b]'
                                                                : 'border-slate-200 hover:border-slate-300'
                                                        }`}
                                                    >
                                                        <CreditCard className="h-5 w-5 mb-2" />
                                                        <span className="block font-medium">Thẻ</span>
                                                        <span className="block text-xs text-slate-500 mt-1">Visa/Mastercard</span>
                                                    </button>
                                                </div>

                                                {onlinePaymentMethod === 'BANK_TRANSFER' && (
                                                    <div className="p-3 bg-blue-50 border border-blue-100 rounded text-blue-800 text-xs leading-relaxed">
                                                        Sau khi đặt hàng, hệ thống sẽ hiển thị mã QR và thông tin chuyển khoản cho đơn hàng.
                                                    </div>
                                                )}

                                                {onlinePaymentMethod === 'CARD' && (
                                                    <div className="p-3 border border-slate-200 rounded bg-slate-50 space-y-3">
                                                        <div className="flex items-start gap-3 text-slate-700">
                                                            <CreditCard className="h-5 w-5 text-[#21246b] mt-0.5" />
                                                            <div>
                                                                <p className="font-medium text-[#21246b]">Thanh toán thẻ qua Stripe</p>
                                                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                                                    Sau khi bấm PAY, bạn sẽ được chuyển sang trang thanh toán bảo mật để nhập thông tin thẻ.
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {cardError && (
                                                            <p className="text-red-600 text-xs">{cardError}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    form="checkout-form"
                                    className="w-full h-12 text-lg bg-[#21246b] hover:bg-blue-800 mt-2"
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                                    {isCardPayment ? 'PAY' : 'ĐẶT HÀNG'}
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
