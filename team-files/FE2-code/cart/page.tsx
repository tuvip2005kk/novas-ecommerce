"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";

export default function CartPage() {
    const { items, updateQuantity, removeItem, totalPrice, clearCart } = useCart();

    if (items.length === 0) {
        return (
            <main className="min-h-screen bg-white dark:bg-slate-950 py-20">
                <div className="container mx-auto px-4 text-center">
                    <ShoppingCart className="mx-auto h-24 w-24 text-slate-300 mb-6" />
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Giỏ hàng trống</h1>
                    <p className="text-slate-500 mb-8">Bạn chưa có sản phẩm nào trong giỏ hàng.</p>
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
            <div className="container mx-auto px-4">
                <Link href="/" className="inline-flex items-center text-slate-500 hover:text-blue-600 mb-8 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Tiếp tục mua sắm
                </Link>

                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Giỏ hàng của bạn</h1>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {items.map(item => (
                            <div key={item.id} className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm flex items-center gap-6">
                                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                                    <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-slate-900 dark:text-white">{item.name}</h3>
                                    <p className="text-blue-600 font-bold">${item.price}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button variant="outline" size="icon" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                                    <Button variant="outline" size="icon" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeItem(item.id)}>
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm h-fit sticky top-8">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Tóm tắt đơn hàng</h2>
                        <div className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
                            {items.map(item => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">{item.name} x{item.quantity}</span>
                                    <span className="font-medium">${item.price * item.quantity}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between text-lg font-bold mb-6">
                            <span>Tổng cộng</span>
                            <span className="text-blue-600">${totalPrice}</span>
                        </div>
                        <Link href="/checkout/cart">
                            <Button size="lg" className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700">
                                Thanh toán
                            </Button>
                        </Link>
                        <Button variant="ghost" className="w-full mt-2 text-red-500 hover:text-red-700" onClick={clearCart}>
                            Xóa giỏ hàng
                        </Button>
                    </div>
                </div>
            </div>
        </main>
    );
}
