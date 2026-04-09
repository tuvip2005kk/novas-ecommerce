"use client";

import { useState, useEffect } from "react";
import { API_URL } from "@/config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast, ToastContainer } from "@/components/Toast";
import { Loader2 } from "lucide-react";

export default function AdminDiscountsPage() {
    const [targetType, setTargetType] = useState('category');
    const [targetId, setTargetId] = useState('');
    const [discountPercent, setDiscountPercent] = useState('10');
    
    const [categories, setCategories] = useState<any[]>([]);
    const [subcategories, setSubcategories] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    
    const [loading, setLoading] = useState(false);
    const { toasts, showToast, removeToast } = useToast();

    useEffect(() => {
        Promise.all([
            fetch(`${API_URL}/api/categories`).then(res => res.json()),
            fetch(`${API_URL}/api/subcategories`).then(res => res.json()),
            fetch(`${API_URL}/api/products`).then(res => res.json()),
        ]).then(([cats, subs, prods]) => {
            setCategories(cats);
            setSubcategories(subs);
            setProducts(prods);
        }).catch(err => console.error("Failed to load options", err));
    }, []);

    const handleSubmit = async (e: React.FormEvent, action: 'apply' | 'remove') => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/products/bulk-discount`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    targetType,
                    targetId: targetType === 'all' ? undefined : parseInt(targetId),
                    discountPercent: parseInt(discountPercent),
                    action
                })
            });

            const data = await res.json();
            if (res.ok) {
                showToast(data.message, 'success');
            } else {
                showToast(data.message || 'Lỗi áp dụng giảm giá', 'error');
            }
        } catch (error: any) {
            showToast(error.message || 'Có lỗi xảy ra', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 overflow-x-hidden pt-14 lg:pl-48">
            <main className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-3.5rem)] space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Giảm giá hàng loạt</h1>
                    <p className="text-slate-500 font-normal">Quản lý và áp dụng giảm giá phần trăm theo thiết lập tập trung</p>
                </div>
                
                <Card className="max-w-2xl shadow-sm">
                    <CardHeader>
                        <CardTitle>Công cụ Cập nhật Giá</CardTitle>
                        <CardDescription>
                            Chức năng này giúp bạn cập nhật giá hàng loạt.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Áp dụng cho:</label>
                                <select 
                                    className="w-full p-2 border rounded"
                                    value={targetType}
                                    onChange={(e) => {
                                        setTargetType(e.target.value);
                                        setTargetId('');
                                    }}
                                >
                                    <option value="category">Danh mục chính</option>
                                    <option value="subcategory">Danh mục con</option>
                                    <option value="product">Một Sản phẩm cụ thể</option>
                                </select>
                            </div>

                            {targetType !== 'all' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Chọn đối tượng:</label>
                                    <select 
                                        className="w-full p-2 border rounded"
                                        value={targetId}
                                        onChange={(e) => setTargetId(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Chọn --</option>
                                        {targetType === 'category' && categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        {targetType === 'subcategory' && subcategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        {targetType === 'product' && products.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1">Phần trăm giảm giá (%):</label>
                                <input 
                                    type="number"
                                    min="1"
                                    max="99"
                                    value={discountPercent}
                                    onChange={(e) => setDiscountPercent(e.target.value)}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-slate-100">
                                <Button 
                                    onClick={(e) => handleSubmit(e, 'apply')}
                                    disabled={loading || (!targetId && targetType !== 'all')}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                >
                                    {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                                    ÁP DỤNG GIẢM GIÁ
                                </Button>
                                <Button 
                                    onClick={(e) => handleSubmit(e, 'remove')}
                                    disabled={loading || (!targetId && targetType !== 'all')}
                                    variant="outline"
                                    className="flex-1 text-slate-700 hover:bg-red-50 hover:text-red-600 border-slate-300"
                                >
                                    {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                                    GỠ BỎ ÁP DỤNG
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
            <ToastContainer toasts={toasts} onClose={removeToast} />
        </div>
    );
}
