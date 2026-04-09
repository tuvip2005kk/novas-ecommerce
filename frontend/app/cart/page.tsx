"use client";


import { useCart } from "@/context/CartContext";
import { API_URL } from '@/config';
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Minus, Plus, ShoppingCart, Trash2, ArrowLeft, Tag, CheckSquare, Square } from "lucide-react";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";

export default function CartPage() {
    const { items, updateQuantity, removeItem, totalPrice } = useCart();
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [saleCode, setSaleCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [discountPercent, setDiscountPercent] = useState(0);

    const [isApplying, setIsApplying] = useState(false);

    // Initialize selectedIds with all items when cart loads or items change
    useEffect(() => {
        // Only initialize if selectedIds is empty and we have items
        if (selectedIds.length === 0 && items.length > 0) {
            setSelectedIds(items.map(item => item.id));
        }
    }, [items]);

    const toggleSelection = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const toggleAll = () => {
        if (selectedIds.length === items.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(items.map(item => item.id));
        }
    };

    const selectedItems = useMemo(() => {
        return items.filter(item => selectedIds.includes(item.id));
    }, [items, selectedIds]);

    const selectedSubtotal = useMemo(() => {
        return selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }, [selectedItems]);

    const applyDiscount = async () => {
        if (!saleCode.trim()) return;
        setIsApplying(true);
        try {
            const res = await fetch(`${API_URL}/api/sales/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: saleCode.trim(), orderTotal: selectedSubtotal }),
            });
            const data = await res.json();
            if (data.valid) {
                const discountVal = data.sale.discountAmount;
                const percent = Math.round((discountVal / selectedSubtotal) * 100);
                setDiscount(discountVal);
                setDiscountPercent(percent);
            } else {
                alert(data.error || 'Mã giảm giá không hợp lệ!');
                setDiscount(0);
                setDiscountPercent(0);
            }
        } catch (error) {
            alert('Lỗi kết nối khi áp dụng mã giảm giá.');
        } finally {
            setIsApplying(false);
        }
    };

    const finalTotal = selectedSubtotal - discount;

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
                                <div className="col-span-1 flex items-center justify-center">
                                    <button onClick={toggleAll} className="text-[#21246b]">
                                        {selectedIds.length === items.length ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                    </button>
                                </div>
                                <div className="col-span-4">Sản phẩm</div>
                                <div className="col-span-2 text-center">Giá</div>
                                <div className="col-span-2 text-center">Số lượng</div>
                                <div className="col-span-2 text-center">Tổng cộng</div>
                                <div className="col-span-1"></div>
                            </div>

                            {/* Cart Items */}
                            {items.map(item => (
                                <div key={item.id} className={`grid grid-cols-12 gap-4 py-4 border-b items-center ${selectedIds.includes(item.id) ? 'bg-blue-50/30' : 'opacity-60'}`}>
                                    {/* Checkbox */}
                                    <div className="col-span-1 flex items-center justify-center">
                                        <button onClick={() => toggleSelection(item.id)} className="text-[#21246b]">
                                            {selectedIds.includes(item.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                        </button>
                                    </div>

                                    {/* Product */}
                                    <div className="col-span-4 flex items-center gap-3">
                                        <div className="w-16 h-16 bg-slate-100 flex-shrink-0">
                                            <img
                                                src={item.image?.startsWith('http') ? item.image : `${API_URL}${item.image}`}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <span className="text-sm font-medium text-slate-800">{item.name}</span>
                                    </div>

                                    {/* Price */}
                                    <div className="col-span-2 text-center text-sm">
                                        {new Intl.NumberFormat('vi-VN').format(item.price)}đ
                                    </div>

                                    {/* Quantity */}
                                    <div className="col-span-2 flex items-center justify-center">
                                        <div className="flex items-center border bg-white">
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
                            <div className="border-2 border-[#21246b] p-6 bg-white">
                                <h2 className="text-lg font-bold text-[#21246b] mb-4 uppercase">Tổng giỏ hàng</h2>
                                
                                {selectedItems.length > 0 && (
                                    <div className="mb-4 pb-4 border-b">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Sản phẩm đã chọn:</p>
                                        <ul className="space-y-1">
                                            {selectedItems.map(item => (
                                                <li key={item.id} className="text-sm font-medium text-[#21246b] flex items-center gap-2">
                                                    <div className="w-1 h-1 bg-blue-400 rounded-full" />
                                                    {item.name}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="space-y-3 pb-4 border-b">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Tạm tính ({selectedIds.length} món)</span>
                                        <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(selectedSubtotal)}đ</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-red-600 font-medium">
                                            <span>Giảm giá ({discountPercent}%)</span>
                                            <span>-{new Intl.NumberFormat('vi-VN').format(discount)}đ</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between py-4 border-b">
                                    <span className="font-bold">Tổng cộng</span>
                                    <span className="font-bold text-[#21246b] text-xl">{new Intl.NumberFormat('vi-VN').format(finalTotal)}đ</span>
                                </div>

                                {/* Checkout Button */}
                                <Link 
                                    href={selectedIds.length > 0 ? `/checkout?mode=cart&ids=${selectedIds.join(',')}${discount > 0 && saleCode ? `&coupon=${saleCode.trim()}` : ''}` : '#'} 
                                    className={`block w-full mt-3 ${selectedIds.length === 0 ? 'pointer-events-none opacity-50' : ''}`}
                                >
                                    <button 
                                        disabled={selectedIds.length === 0}
                                        className="w-full py-3 bg-[#21246b] text-white text-sm font-bold uppercase hover:bg-blue-800 disabled:bg-slate-300"
                                    >
                                        ĐẶT HÀNG ({selectedIds.length})
                                    </button>
                                </Link>

                                {/* Discount Code */}
                                <div className="mt-6 pt-6 border-t border-dashed border-slate-200">
                                    <div className="flex items-center gap-2 mb-2 text-[#21246b] text-sm font-medium">
                                        <Tag className="w-3 h-3" />
                                        <span>Mã giảm giá</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={saleCode}
                                            onChange={(e) => setSaleCode(e.target.value)}
                                            disabled={isApplying || selectedIds.length === 0}
                                            placeholder="Nhập mã giảm giá"
                                            className="flex-1 px-3 py-2 border text-sm disabled:bg-slate-100"
                                        />
                                        <button
                                            onClick={applyDiscount}
                                            disabled={isApplying || selectedIds.length === 0 || !saleCode.trim()}
                                            className="px-4 py-2 bg-slate-100 text-[#21246b] text-sm font-bold border border-[#21246b] hover:bg-[#21246b] hover:text-white transition-colors disabled:opacity-50"
                                        >
                                            {isApplying ? '...' : 'Áp dụng'}
                                        </button>
                                    </div>
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
