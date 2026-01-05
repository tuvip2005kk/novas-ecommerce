"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Plus, Trash2, Edit, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    stock: number;
}

export default function AdminProducts() {
    const { token } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '',
        description: '',
        price: '',
        image: '',
        category: '',
        stock: ''
    });

    useEffect(() => { fetchProducts(); }, []);

    const fetchProducts = async () => {
        const res = await fetch('http://localhost:3005/api/products');
        const data = await res.json();
        setProducts(data);
        setLoading(false);
    };

    const openAddModal = () => {
        setEditingProduct(null);
        setForm({ name: '', description: '', price: '', image: '', category: '', stock: '' });
        setShowModal(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setForm({
            name: product.name,
            description: product.description,
            price: product.price.toString(),
            image: product.image,
            category: product.category,
            stock: product.stock.toString()
        });
        setShowModal(true);
    };

    const deleteProduct = async (id: number) => {
        if (!confirm('Xác nhận xóa sản phẩm này?')) return;
        await fetch(`http://localhost:3005/api/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchProducts();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingProduct
                ? `http://localhost:3005/api/products/${editingProduct.id}`
                : 'http://localhost:3005/api/products';

            await fetch(url, {
                method: editingProduct ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: form.name,
                    description: form.description,
                    price: parseFloat(form.price),
                    image: form.image || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500',
                    category: form.category,
                    stock: parseInt(form.stock)
                })
            });
            setShowModal(false);
            setEditingProduct(null);
            fetchProducts();
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Quản lý sản phẩm</h1>
                    <p className="text-slate-500">Thêm, sửa, xóa sản phẩm trong kho</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={openAddModal}>
                    <Plus className="h-4 w-4 mr-2" /> Thêm sản phẩm
                </Button>
            </div>

            {/* Add/Edit Product Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-lg mx-4">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Tên sản phẩm *</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full mt-1 px-4 py-2 border rounded-lg"
                                        placeholder="VD: Smart Toilet Pro"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Mô tả *</label>
                                    <textarea
                                        required
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        className="w-full mt-1 px-4 py-2 border rounded-lg h-20"
                                        placeholder="Mô tả chi tiết sản phẩm..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Giá ($) *</label>
                                        <input
                                            type="number"
                                            required
                                            value={form.price}
                                            onChange={(e) => setForm({ ...form, price: e.target.value })}
                                            className="w-full mt-1 px-4 py-2 border rounded-lg"
                                            placeholder="VD: 450"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Tồn kho *</label>
                                        <input
                                            type="number"
                                            required
                                            value={form.stock}
                                            onChange={(e) => setForm({ ...form, stock: e.target.value })}
                                            className="w-full mt-1 px-4 py-2 border rounded-lg"
                                            placeholder="VD: 100"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Danh mục *</label>
                                    <select
                                        required
                                        value={form.category}
                                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                                        className="w-full mt-1 px-4 py-2 border rounded-lg"
                                    >
                                        <option value="">Chọn danh mục</option>
                                        <option value="Toilets">Toilets</option>
                                        <option value="Showers">Showers</option>
                                        <option value="Bathtubs">Bathtubs</option>
                                        <option value="Faucets">Faucets</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">URL Hình ảnh</label>
                                    <input
                                        type="url"
                                        value={form.image}
                                        onChange={(e) => setForm({ ...form, image: e.target.value })}
                                        className="w-full mt-1 px-4 py-2 border rounded-lg"
                                        placeholder="https://..."
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={saving}>
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : editingProduct ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                    {saving ? 'Đang lưu...' : editingProduct ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card>
                <CardContent className="pt-6">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b text-left text-sm text-slate-500">
                                <th className="pb-3">Sản phẩm</th>
                                <th className="pb-3">Danh mục</th>
                                <th className="pb-3">Giá</th>
                                <th className="pb-3">Tồn kho</th>
                                <th className="pb-3">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(p => (
                                <tr key={p.id} className="border-b hover:bg-slate-50">
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-100 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${p.image})` }} />
                                            <div>
                                                <span className="font-medium">{p.name}</span>
                                                <p className="text-xs text-slate-500 truncate max-w-[200px]">{p.description}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 text-slate-500">{p.category}</td>
                                    <td className="py-4 font-medium">${p.price}</td>
                                    <td className="py-4">{p.stock}</td>
                                    <td className="py-4">
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="icon" onClick={() => openEditModal(p)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="icon" className="text-red-600" onClick={() => deleteProduct(p.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}
