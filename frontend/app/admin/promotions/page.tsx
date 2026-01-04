"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Plus, Trash2, Loader2, X, Tag, Percent } from "lucide-react";
import { useEffect, useState } from "react";

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

    useEffect(() => { fetchSales(); }, [token]);

    const fetchSales = async () => {
        if (!token) return;
        try {
            const res = await fetch('http://localhost:3005/sales', {
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
            await fetch('http://localhost:3005/sales', {
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
                    expiresAt: form.expiresAt || null
                })
            });
            setShowModal(false);
            setForm({ code: '', discount: '', type: 'PERCENT', minOrder: '', maxDiscount: '', usageLimit: '100', expiresAt: '' });
            fetchSales();
        } finally {
            setSaving(false);
        }
    };

    const deleteSale = async (id: number) => {
        if (!confirm('Xác nhận xóa mã giảm giá này?')) return;
        await fetch(`http://localhost:3005/sales/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchSales();
    };

    const toggleActive = async (id: number, isActive: boolean) => {
        await fetch(`http://localhost:3005/sales/${id}`, {
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
                    <h1 className="text-3xl font-bold text-slate-900">Khuyến mãi (Sales)</h1>
                    <p className="text-slate-500">Quản lý mã giảm giá - Dữ liệu thật từ database</p>
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
                                            <option value="FIXED">Số tiền cố định ($)</option>
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
                                        <label className="text-sm font-medium">Giảm tối đa ($)</label>
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
                                        <label className="text-sm font-medium">Đơn tối thiểu ($)</label>
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
                                    <label className="text-sm font-medium">Ngày hết hạn</label>
                                    <input
                                        type="date"
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

            <Card>
                <CardContent className="pt-6">
                    {sales.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Tag className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                            <p>Chưa có mã giảm giá nào</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-left text-sm text-slate-500">
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
                                                {s.type === 'PERCENT' ? <Percent className="h-4 w-4" /> : '$'}
                                                {s.discount}{s.type === 'PERCENT' ? '%' : ''}
                                            </span>
                                            {s.maxDiscount && <span className="text-xs text-slate-500">Tối đa ${s.maxDiscount}</span>}
                                        </td>
                                        <td className="py-4 text-sm text-slate-500">
                                            {s.minOrder > 0 && <p>Đơn tối thiểu: ${s.minOrder}</p>}
                                            {s.expiresAt && <p>Hết hạn: {new Date(s.expiresAt).toLocaleDateString('vi-VN')}</p>}
                                        </td>
                                        <td className="py-4">{s.usedCount}/{s.usageLimit}</td>
                                        <td className="py-4">
                                            <button
                                                onClick={() => toggleActive(s.id, s.isActive)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}
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
    );
}
