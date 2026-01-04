"use client";

import { useCart } from "@/context/CartContext";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Minus, Plus, ShoppingCart, Trash2, ArrowLeft, Tag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function CartPage() {
    const { items, updateQuantity, removeItem, totalPrice } = useCart();
    const [saleCode, setSaleCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [discountPercent, setDiscountPercent] = useState(0);

    const applyDiscount = () => {
        if (saleCode.toUpperCase() === 'GIAM10') {
            setDiscountPercent(10);
            setDiscount(totalPrice * 0.1);
        } else if (saleCode.toUpperCase() === 'GIAM20') {
            setDiscountPercent(20);
            setDiscount(totalPrice * 0.2);
        } else {
            alert('Mã giảm giá không hợp lệ!');
            setDiscount(0);
            setDiscountPercent(0);
        }
    };

    const finalTotal = totalPrice - discount;

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-white">
                <Header />
                <div className="max-w-[1200px] mx-auto px-4 py-20 text-center">
                    <ShoppingCart className="mx-auto h-24 w-24 text-slate-300 mb-6" />
                    <h1 className="text-2xl font-bold text-slate-900 mb-4">Giỏ hàng trống</h1>
                    <p className="text-slate-500 mb-8">Bạn chưa có sản phẩm nào trong giỏ hàng.</p>
                    <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-[#21246b] text-white font-medium hover:bg-blue-800">
                        <ArrowLeft className="w-4 h-4" /> Tiếp tục mua hàng
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-white">
                <Header />

                <div className="max-w-[1200px] mx-auto px-4 py-8 pt-24">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left: Cart Items Table */}
                        <div className="lg:col-span-2">
                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-4 pb-4 border-b-2 border-[#21246b] text-sm font-bold text-slate-700 uppercase">
                                <div className="col-span-5">Sản phẩm</div>
                                <div className="col-span-2 text-center">Giá</div>
                                <div className="col-span-2 text-center">Số lượng</div>
                                <div className="col-span-2 text-center">Tổng cộng</div>
                                <div className="col-span-1"></div>
                            </div>

                            {/* Cart Items */}
                            {items.map(item => (
                                <div key={item.id} className="grid grid-cols-12 gap-4 py-4 border-b items-center">
                                    {/* Product */}
                                    <div className="col-span-5 flex items-center gap-3">
                                        <div className="w-16 h-16 bg-slate-100 flex-shrink-0">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-800">{item.name}</span>
                                    </div>

                                    {/* Price */}
                                    <div className="col-span-2 text-center text-sm">
                                        {new Intl.NumberFormat('vi-VN').format(item.price)}đ
                                    </div>

                                    {/* Quantity */}
                                    <div className="col-span-2 flex items-center justify-center">
                                        <div className="flex items-center border">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="px-2 py-1 text-slate-600 hover:bg-slate-100"
                                            >-</button>
                                            <span className="px-3 py-1 min-w-[40px] text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="px-2 py-1 text-slate-600 hover:bg-slate-100"
                                            >+</button>
                                        </div>
                                    </div>

                                    {/* Total */}
                                    <div className="col-span-2 text-center text-sm font-medium">
                                        {new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)}đ
                                    </div>

                                    {/* Delete */}
                                    <div className="col-span-1 text-center">
                                        <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Continue Shopping */}
                            <div className="mt-6">
                                <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-[#21246b] text-white text-sm font-medium hover:bg-blue-800">
                                    <ArrowLeft className="w-4 h-4" /> TIẾP TỤC MUA HÀNG
                                </Link>
                            </div>
                        </div>

                        {/* Right: Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="border-2 border-[#21246b] p-6">
                                <h2 className="text-lg font-bold text-[#21246b] mb-4 uppercase">Tổng giỏ hàng</h2>

                                <div className="space-y-3 pb-4 border-b">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Tạm tính</span>
                                        <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(totalPrice)}đ</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Giảm giá ({discountPercent}%)</span>
                                            <span>-{new Intl.NumberFormat('vi-VN').format(discount)}đ</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between py-4 border-b">
                                    <span className="font-bold">Tổng cộng</span>
                                    <span className="font-bold text-[#21246b]">{new Intl.NumberFormat('vi-VN').format(finalTotal)}đ</span>
                                </div>

                                {/* Checkout Button */}
                                <Link href="/checkout?mode=cart" className="block w-full mt-3">
                                    <button className="w-full py-2 bg-[#21246b] text-white text-sm font-bold uppercase hover:bg-blue-800">
                                        ĐẶT HÀNG
                                    </button>
                                </Link>

                                {/* Discount Code */}
                                <div className="mt-4">
                                    <div className="flex items-center gap-2 mb-2 text-[#21246b] text-sm font-medium">
                                        <Tag className="w-3 h-3" />
                                        <span>Mã giảm giá</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={saleCode}
                                        onChange={(e) => setSaleCode(e.target.value)}
                                        placeholder="Nhập mã giảm giá"
                                        className="w-full px-3 py-1.5 border text-sm mb-2"
                                    />
                                    <button
                                        onClick={applyDiscount}
                                        className="w-full py-1.5 border border-[#21246b] text-[#21246b] text-sm font-medium hover:bg-[#21246b] hover:text-white transition-colors"
                                    >
                                        Áp dụng
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}
