"use client";
import { API_URL } from '@/config';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Plus, Trash2, Loader2, X, Tag, Percent } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast, ToastContainer } from "@/components/Toast";

interface Sale {
    id: number;
    code: string;
    discount: number;
    type: string;
    minOrder: number;
    maxDiscount: number | null;
    usageLimit: number;
    usedCount: number;
    expiresAt: string | null;
    isActive: boolean;
}

export default function AdminSales() {
    const { token } = useAuth();
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        code: '',
        discount: '',
        type: 'PERCENT',
        minOrder: '',
        maxDiscount: '',
        usageLimit: '100',
        expiresAt: ''
    });

    // Bulk Discount State
    const [bulkTargetType, setBulkTargetType] = useState('category');
    const [bulkTargetId, setBulkTargetId] = useState('');
    const [bulkDiscountPercent, setBulkDiscountPercent] = useState('10');
    const [categories, setCategories] = useState<any[]>([]);
    const [subcategories, setSubcategories] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [bulkLoading, setBulkLoading] = useState(false);

    const { toasts, showToast, removeToast } = useToast();

    useEffect(() => {
        fetchSales();
        // Fetch lookup lists
        Promise.all([
            fetch(`${API_URL}/api/categories`).then(res => res.json()),
            fetch(`${API_URL}/api/subcategories`).then(res => res.json()),
            fetch(`${API_URL}/api/products`).then(res => res.json()),
        ]).then(([cats, subs, prods]) => {
            setCategories(cats);
            setSubcategories(subs);
            setProducts(prods);
        }).catch(err => console.error("Failed to load options", err));
    }, [token]);

    const fetchSales = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/sales`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setSales(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await fetch(`${API_URL}/api/sales`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    code: form.code,
                    discount: parseFloat(form.discount),
                    type: form.type,
                    minOrder: parseFloat(form.minOrder) || 0,
                    maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
                    usageLimit: parseInt(form.usageLimit),
                    expiresAt: (() => {
                        if (!form.expiresAt) return null;
                        const parts = form.expiresAt.split('/');
                        if (parts.length === 3) {
                            return new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T00:00:00`).toISOString();
                        }
                        return null;
                    })()
                })
            });
            setShowModal(false);
            setForm({ code: '', discount: '', type: 'PERCENT', minOrder: '', maxDiscount: '', usageLimit: '100', expiresAt: '' });
            fetchSales();
        } finally {
            setSaving(false);
        }
    };

    const handleBulkSubmit = async (e: React.FormEvent, action: 'apply' | 'remove') => {
        e.preventDefault();
        setBulkLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/products/bulk-discount`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    targetType: bulkTargetType,
                    targetId: bulkTargetType === 'all' ? undefined : parseInt(bulkTargetId),
                    discountPercent: parseInt(bulkDiscountPercent),
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
            setBulkLoading(false);
        }
    };

    const deleteSale = async (id: number) => {
        if (!confirm('Xác nhận xóa mã giảm giá này?')) return;
        await fetch(`${API_URL}/api/sales/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchSales();
    };

    const toggleActive = async (id: number, isActive: boolean) => {
        await fetch(`${API_URL}/api/sales/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ isActive: !isActive })
        });
        fetchSales();
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Khuyến mãi</h1>
                </div>
                <Button className="bg-[#21246b] hover:bg-[#1a1d55]" onClick={() => setShowModal(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Thêm mã giảm giá
                </Button>
            </div>

            {/* Add Sale Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-lg mx-4">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Tag className="h-5 w-5 text-[#21246b]" />
                                Thêm mã giảm giá mới
                            </CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Mã code *</label>
                                        <input
                                            type="text" required
                                            value={form.code}
                                            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                            className="w-full mt-1 px-4 py-2 border rounded-lg uppercase"
                                            placeholder="VD: SALE50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Loại giảm giá *</label>
                                        <select
                                            value={form.type}
                                            onChange={(e) => setForm({ ...form, type: e.target.value })}
                                            className="w-full mt-1 px-4 py-2 border rounded-lg"
                                        >
                                            <option value="PERCENT">Phần trăm (%)</option>
                                            <option value="FIXED">Số tiền cố định (đ)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Giá trị giảm *</label>
                                        <input
                                            type="number" required
                                            value={form.discount}
                                            onChange={(e) => setForm({ ...form, discount: e.target.value })}
                                            className="w-full mt-1 px-4 py-2 border rounded-lg"
                                            placeholder={form.type === 'PERCENT' ? 'VD: 10' : 'VD: 50'}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Giảm tối đa (đ)</label>
                                        <input
                                            type="number"
                                            value={form.maxDiscount}
                                            onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                                            className="w-full mt-1 px-4 py-2 border rounded-lg"
                                            placeholder="VD: 100"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Đơn tối thiểu (đ)</label>
                                        <input
                                            type="number"
                                            value={form.minOrder}
                                            onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
                                            className="w-full mt-1 px-4 py-2 border rounded-lg"
                                            placeholder="VD: 100"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Số lần sử dụng</label>
                                        <input
                                            type="number"
                                            value={form.usageLimit}
                                            onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                                            className="w-full mt-1 px-4 py-2 border rounded-lg"
                                            placeholder="VD: 100"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Ngày hết hạn (Tuỳ chọn)</label>
                                    <input
                                        type="text"
                                        placeholder="dd/mm/yyyy"
                                        value={form.expiresAt}
                                        onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                                        className="w-full mt-1 px-4 py-2 border rounded-lg"
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-[#21246b] hover:bg-[#1a1d55]" disabled={saving}>
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                    {saving ? 'Đang lưu...' : 'Thêm mã giảm giá'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 xl:col-span-8">
                    <Card>
                        <CardContent className="pt-6">
                            {sales.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 font-normal">
                                    <Tag className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                                    <p>Chưa có mã giảm giá nào</p>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b text-left text-sm text-slate-500 font-normal">
                                            <th className="pb-3">Mã code</th>
                                            <th className="pb-3">Giảm giá</th>
                                            <th className="pb-3">Điều kiện</th>
                                            <th className="pb-3">Sử dụng</th>
                                            <th className="pb-3">Trạng thái</th>
                                            <th className="pb-3">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sales.map(s => (
                                            <tr key={s.id} className="border-b hover:bg-slate-50">
                                                <td className="py-4">
                                                    <span className="font-mono font-bold text-[#21246b] bg-[#21246b]/10 px-2 py-1 rounded">{s.code}</span>
                                                </td>
                                                <td className="py-4">
                                                    <span className="flex items-center gap-1">
                                                        {s.type === 'PERCENT' ? <Percent className="h-4 w-4" /> : null}
                                                        {s.type === 'PERCENT'
                                                            ? `${s.discount}%`
                                                            : `${new Intl.NumberFormat('vi-VN').format(s.discount)}đ`}
                                                    </span>
                                                    {s.maxDiscount && <span className="text-xs text-slate-500 font-normal">Tối đa {new Intl.NumberFormat('vi-VN').format(s.maxDiscount)}đ</span>}
                                                </td>
                                                <td className="py-4 text-sm text-slate-500 font-normal">
                                                    {s.minOrder > 0 && <p>Đơn tối thiểu: {new Intl.NumberFormat('vi-VN').format(s.minOrder)}đ</p>}
                                                    {s.expiresAt && <p>Hết hạn: {new Date(s.expiresAt).toLocaleDateString('vi-VN')}</p>}
                                                </td>
                                                <td className="py-4">{s.usedCount}/{s.usageLimit}</td>
                                                <td className="py-4">
                                                    <button
                                                        onClick={() => toggleActive(s.id, s.isActive)}
                                                        className={`text-sm font-medium ${s.isActive ? 'text-green-600' : 'text-slate-400'}`}
                                                    >
                                                        {s.isActive ? 'Hoạt động' : 'Tắt'}
                                                    </button>
                                                </td>
                                                <td className="py-4">
                                                    <Button variant="outline" size="icon" className="text-red-600" onClick={() => deleteSale(s.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Bulk Discounts Section */}
                <div className="lg:col-span-5 xl:col-span-4">
                    <Card className="shadow-sm border-[#21246b]/20 border-t-4 border-t-[#21246b]">
                        <CardHeader>
                            <CardTitle className="text-[#21246b]">Giảm Giá Tổng Thể</CardTitle>
                            <p className="text-sm text-slate-500">
                                Giảm danh mục hoặc toàn bộ sản phẩm
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Áp dụng cho:</label>
                                    <select
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-[#21246b]"
                                        value={bulkTargetType}
                                        onChange={(e) => {
                                            setBulkTargetType(e.target.value);
                                            setBulkTargetId('');
                                        }}
                                    >
                                        <option value="category">Danh mục chính</option>
                                        <option value="subcategory">Danh mục phụ</option>
                                        <option value="product">Sản phẩm</option>
                                    </select>
                                </div>

                                {bulkTargetType !== 'all' && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Chọn đối tượng:</label>
                                        <select
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-[#21246b]"
                                            value={bulkTargetId}
                                            onChange={(e) => setBulkTargetId(e.target.value)}
                                            required
                                        >
                                            <option value="">-- Chọn --</option>
                                            {bulkTargetType === 'category' && categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            {bulkTargetType === 'subcategory' && subcategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            {bulkTargetType === 'product' && products.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium mb-1">Phần trăm giảm giá (%):</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="99"
                                        value={bulkDiscountPercent}
                                        onChange={(e) => setBulkDiscountPercent(e.target.value)}
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-[#21246b]"
                                        required
                                    />
                                </div>

                                <div className="flex gap-4 pt-4 border-t border-slate-100">
                                    <Button
                                        onClick={(e) => handleBulkSubmit(e, 'apply')}
                                        disabled={bulkLoading || (!bulkTargetId && bulkTargetType !== 'all')}
                                        className="flex-1 bg-[#21246b] hover:bg-[#1a1d55] text-white"
                                    >
                                        {bulkLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                                        ÁP DỤNG GIẢM GIÁ
                                    </Button>
                                    <Button
                                        onClick={(e) => handleBulkSubmit(e, 'remove')}
                                        disabled={bulkLoading || (!bulkTargetId && bulkTargetType !== 'all')}
                                        variant="outline"
                                        className="flex-1 text-slate-700 hover:bg-red-50 hover:text-red-600 border-slate-300"
                                    >
                                        {bulkLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                                        GỠ BỎ ÁP DỤNG
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ToastContainer toasts={toasts} onClose={removeToast} />
        </div>
    );
}
