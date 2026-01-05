"use client";
import { API_URL } from '@/config';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Plus, Trash2, Edit, Loader2, X, Package } from "lucide-react";
import { useEffect, useState } from "react";

interface Subcategory {
    id: number;
    name: string;
    slug: string;
}

interface Category {
    id: number;
    name: string;
    slug: string;
    subcategories: Subcategory[];
}

interface Product {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    image: string;
    images: string[];
    subcategoryId: number | null;
    subcategory: { id: number; name: string; category: { slug: string; name: string } } | null;
    stock: number;
    soldCount: number;
}

// Generate slug from name
const generateSlug = (name: string) => {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
};

export default function AdminProducts() {
    const { token } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [saving, setSaving] = useState(false);
    const [filterCategory, setFilterCategory] = useState('');
    const [form, setForm] = useState({
        name: '',
        slug: '',
        description: '',
        price: '',
        image: '',
        images: [''] as string[],
        categorySlug: '',
        subcategoryId: '',
        stock: '',
        specs: {
            // Bồn cầu
            kichThuoc: '',
            tienIch: '',
            dungTich: '',
            phuongPhapXa: '',
            chatLieuThan: '',
            chatLieuNutXa: '',
            chatLieuNapBe: '',
            tamHo: '',
            khoangCachTamHo: '',
            taiTrong: '',
            // Bồn tắm (additional)
            thongSoLapDat: '',
            luuYLapDat: '',
            // Lavabo
            tinhChat: '',
            canNang: '',
            // Phụ kiện + Vòi chậu + Vòi sen
            tinhNang: '',
            phuongPhapMa: '',
            lapDat: '',
            canNangCuSen: '',
            // Phụ kiện combo
            comboOptions: '' // JSON string for combo items
        }
    });

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        const res = await fetch(`${API_URL}/api/products`);
        const data = await res.json();
        setProducts(data);
        setLoading(false);
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${API_URL}/api/categories`);
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (error) {
            console.error('Failed to fetch categories', error);
        }
    };

    const openAddModal = () => {
        setEditingProduct(null);
        setForm({
            name: '', slug: '', description: '', price: '', image: '',
            images: [''], categorySlug: '', subcategoryId: '', stock: '',
            specs: { kichThuoc: '', tienIch: '', dungTich: '', phuongPhapXa: '', chatLieuThan: '', chatLieuNutXa: '', chatLieuNapBe: '', tamHo: '', khoangCachTamHo: '', taiTrong: '', thongSoLapDat: '', luuYLapDat: '', tinhChat: '', canNang: '', tinhNang: '', phuongPhapMa: '', lapDat: '', canNangCuSen: '', comboOptions: '' }
        });
        setShowModal(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        const categorySlug = product.subcategory?.category?.slug || '';
        const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : [''];
        const specs = (product as any).specs || {};
        setForm({
            name: product.name,
            slug: product.slug || '',
            description: product.description,
            price: product.price.toString(),
            image: product.image,
            images: images,
            categorySlug: categorySlug,
            subcategoryId: product.subcategoryId?.toString() || '',
            stock: product.stock.toString(),
            specs: {
                kichThuoc: specs.kichThuoc || '',
                tienIch: specs.tienIch || '',
                dungTich: specs.dungTich || '',
                phuongPhapXa: specs.phuongPhapXa || '',
                chatLieuThan: specs.chatLieuThan || '',
                chatLieuNutXa: specs.chatLieuNutXa || '',
                chatLieuNapBe: specs.chatLieuNapBe || '',
                tamHo: specs.tamHo || '',
                khoangCachTamHo: specs.khoangCachTamHo || '',
                taiTrong: specs.taiTrong || '',
                thongSoLapDat: specs.thongSoLapDat || '',
                luuYLapDat: specs.luuYLapDat || '',
                tinhChat: specs.tinhChat || '',
                canNang: specs.canNang || '',
                tinhNang: specs.tinhNang || '',
                phuongPhapMa: specs.phuongPhapMa || '',
                lapDat: specs.lapDat || '',
                canNangCuSen: specs.canNangCuSen || '',
                comboOptions: specs.comboOptions || ''
            }
        });
        setShowModal(true);
    };

    const deleteProduct = async (id: number) => {
        if (!confirm('Xác nhận xóa sản phẩm này?')) return;
        await fetch(`${API_URL}/api/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchProducts();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate image
        if (!form.image) {
            alert("Vui lòng chọn ảnh chính cho sản phẩm!");
            return;
        }

        setSaving(true);
        try {
            const url = editingProduct
                ? `${API_URL}/api/products/${editingProduct.id}`
                : `${API_URL}/api/products`;

            const slug = form.slug || generateSlug(form.name);

            await fetch(url, {
                method: editingProduct ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: form.name,
                    slug: slug,
                    description: form.description,
                    price: parseFloat(form.price),
                    image: form.image, // Use the uploaded image URL directly
                    images: form.images.filter(img => img.trim() !== ''),
                    subcategoryId: form.subcategoryId ? parseInt(form.subcategoryId) : null,
                    stock: parseInt(form.stock),
                    specs: form.specs
                })
            });
            setShowModal(false);
            setEditingProduct(null);
            fetchProducts();
        } catch (error) {
            console.error("Error saving product:", error);
            alert("Có lỗi xảy ra khi lưu sản phẩm");
        } finally {
            setSaving(false);
        }
    };

    // Auto-generate slug when name changes
    const handleNameChange = (name: string) => {
        setForm({
            ...form,
            name,
            slug: editingProduct ? form.slug : generateSlug(name)
        });
    };

    // Get subcategories for selected category
    const selectedCategory = categories.find(c => c.slug === form.categorySlug);
    const subcategories = selectedCategory?.subcategories || [];

    // Filter products by category
    const filteredProducts = filterCategory
        ? products.filter(p => p.subcategory?.category?.slug === filterCategory)
        : products;

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Quản lý sản phẩm</h1>
                    <p className="text-slate-500">Thêm, sửa, xóa sản phẩm trong kho • Tổng: {products.length} sản phẩm</p>
                </div>
                <Button className="bg-[#21246b] hover:bg-[#1a1d55]" onClick={openAddModal}>
                    <Plus className="h-4 w-4 mr-2" /> Thêm sản phẩm
                </Button>
            </div>

            {/* Filter by category */}
            <div className="flex gap-2 flex-wrap">
                <Button
                    variant={filterCategory === '' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterCategory('')}
                >
                    Tất cả
                </Button>
                {categories.map((cat) => (
                    <Button
                        key={cat.id}
                        variant={filterCategory === cat.slug ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterCategory(cat.slug)}
                    >
                        {cat.name}
                    </Button>
                ))}
            </div>

            {/* Add/Edit Product Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white z-10">
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                {editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
                            </CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-sm font-medium">Tên sản phẩm *</label>
                                        <input
                                            type="text"
                                            required
                                            value={form.name}
                                            onChange={(e) => handleNameChange(e.target.value)}
                                            className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#21246b] focus:border-[#21246b]"
                                            placeholder="VD: Bồn cầu thông minh Novas K1"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-sm font-medium">Slug (URL) - Tự động tạo</label>
                                        <input
                                            type="text"
                                            value={form.slug}
                                            onChange={(e) => setForm({ ...form, slug: e.target.value })}
                                            className="w-full mt-1 px-4 py-2 border rounded-lg bg-slate-50"
                                            placeholder="bon-cau-thong-minh-novas-k1"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Mô tả *</label>
                                    <textarea
                                        required
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        className="w-full mt-1 px-4 py-2 border rounded-lg h-24 focus:ring-2 focus:ring-[#21246b]"
                                        placeholder="Mô tả chi tiết sản phẩm..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Giá (VNĐ) *</label>
                                        <input
                                            type="number"
                                            required
                                            value={form.price}
                                            onChange={(e) => setForm({ ...form, price: e.target.value })}
                                            className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#21246b]"
                                            placeholder="VD: 25000000"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Tồn kho *</label>
                                        <input
                                            type="number"
                                            required
                                            value={form.stock}
                                            onChange={(e) => setForm({ ...form, stock: e.target.value })}
                                            className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#21246b]"
                                            placeholder="VD: 100"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Danh mục *</label>
                                        <select
                                            required
                                            value={form.categorySlug}
                                            onChange={(e) => setForm({ ...form, categorySlug: e.target.value, subcategoryId: '' })}
                                            className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#21246b]"
                                        >
                                            <option value="">Chọn danh mục</option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.slug}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Danh mục con</label>
                                        <select
                                            value={form.subcategoryId}
                                            onChange={(e) => setForm({ ...form, subcategoryId: e.target.value })}
                                            className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#21246b]"
                                            disabled={!form.categorySlug}
                                        >
                                            <option value="">Chọn danh mục con</option>
                                            {subcategories.map(sub => (
                                                <option key={sub.id} value={sub.id}>{sub.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Hình ảnh chính</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const formData = new FormData();
                                            formData.append('file', file);
                                            try {
                                                const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: formData });
                                                if (res.ok) {
                                                    const data = await res.json();
                                                    // Save relative path to DB: /uploads/filename.jpg
                                                    setForm(prev => ({ ...prev, image: data.url }));
                                                }
                                            } catch (error) {
                                                console.error("Upload failed", error);
                                            }
                                        }}
                                        className="w-full mt-1 px-4 py-2 border rounded-lg"
                                    />
                                    {form.image && (
                                        <img
                                            src={form.image.startsWith('http') ? form.image : `${API_URL}${form.image}`}
                                            alt="Preview"
                                            className="mt-2 h-20 w-20 object-cover rounded"
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Ảnh phụ (hiển thị dưới ảnh chính)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={async (e) => {
                                            const files = e.target.files;
                                            if (!files || files.length === 0) return;
                                            const formData = new FormData();
                                            for (let i = 0; i < files.length; i++) {
                                                formData.append('files', files[i]);
                                            }
                                            try {
                                                const res = await fetch(`${API_URL}/api/upload/multiple`, { method: 'POST', body: formData });
                                                if (res.ok) {
                                                    const data = await res.json();
                                                    // Save relative paths
                                                    const newUrls = data.map((d: any) => d.url);
                                                    setForm(prev => ({ ...prev, images: [...prev.images.filter(i => i), ...newUrls] }));
                                                }
                                            } catch (error) {
                                                console.error("Upload multiple failed", error);
                                            }
                                        }}
                                        className="w-full mt-1 px-4 py-2 border rounded-lg"
                                    />
                                    <div className="flex gap-2 mt-2 flex-wrap">
                                        {form.images.filter(i => i).map((img, idx) => (
                                            <div key={idx} className="relative">
                                                <img
                                                    src={img.startsWith('http') ? img : `${API_URL}${img}`}
                                                    alt={`Preview ${idx}`}
                                                    className="h-16 w-16 object-cover rounded border"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setForm({ ...form, images: form.images.filter((_, i) => i !== idx) })}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                                                >×</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Product Specifications - Dynamic based on category */}
                                <div className="col-span-2 border-t pt-4 mt-2">
                                    <h3 className="font-semibold text-[#21246b] mb-3">Thông tin sản phẩm</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Bồn Cầu */}
                                        {form.categorySlug === 'bon-cau' && (
                                            <>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Kích thước (D*R*C)</label>
                                                    <input value={form.specs.kichThuoc} onChange={e => setForm({ ...form, specs: { ...form.specs, kichThuoc: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="680*400*740mm" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Tiện ích khác</label>
                                                    <input value={form.specs.tienIch} onChange={e => setForm({ ...form, specs: { ...form.specs, tienIch: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="Nắp thường" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Dung tích</label>
                                                    <input value={form.specs.dungTich} onChange={e => setForm({ ...form, specs: { ...form.specs, dungTich: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="8L" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Phương pháp xả</label>
                                                    <input value={form.specs.phuongPhapXa} onChange={e => setForm({ ...form, specs: { ...form.specs, phuongPhapXa: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="Xả xoáy" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Chất liệu thân</label>
                                                    <input value={form.specs.chatLieuThan} onChange={e => setForm({ ...form, specs: { ...form.specs, chatLieuThan: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="Gốm sứ Nano Bạc" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Chất liệu nút xả</label>
                                                    <input value={form.specs.chatLieuNutXa} onChange={e => setForm({ ...form, specs: { ...form.specs, chatLieuNutXa: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="Nhựa ABS" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Chất liệu nắp + bệ ngồi</label>
                                                    <input value={form.specs.chatLieuNapBe} onChange={e => setForm({ ...form, specs: { ...form.specs, chatLieuNapBe: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="Nhựa UF" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Tâm hố</label>
                                                    <input value={form.specs.tamHo} onChange={e => setForm({ ...form, specs: { ...form.specs, tamHo: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="90-114mm" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Khoảng cách tâm hố</label>
                                                    <input value={form.specs.khoangCachTamHo} onChange={e => setForm({ ...form, specs: { ...form.specs, khoangCachTamHo: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="200mm" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Tải trọng</label>
                                                    <input value={form.specs.taiTrong} onChange={e => setForm({ ...form, specs: { ...form.specs, taiTrong: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="300kg" />
                                                </div>
                                            </>
                                        )}

                                        {/* Bồn Tắm */}
                                        {form.categorySlug === 'bon-tam' && (
                                            <>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Kích thước</label>
                                                    <input value={form.specs.kichThuoc} onChange={e => setForm({ ...form, specs: { ...form.specs, kichThuoc: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="1700*800*600mm" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Dung tích</label>
                                                    <input value={form.specs.dungTich} onChange={e => setForm({ ...form, specs: { ...form.specs, dungTich: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="250L" />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="text-sm font-normal text-black">Tiện ích (mỗi dòng 1 thông số)</label>
                                                    <textarea value={form.specs.tienIch} onChange={e => setForm({ ...form, specs: { ...form.specs, tienIch: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal h-24" placeholder="Khả năng cách điện&#10;Thiết kế hiện đại&#10;Lỗ thoát nước chống tràn" />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="text-sm font-normal text-black">Chất liệu (mỗi dòng 1 thông số)</label>
                                                    <textarea value={form.specs.chatLieuThan} onChange={e => setForm({ ...form, specs: { ...form.specs, chatLieuThan: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal h-24" placeholder="Thân bồn: Nhựa Acrylic 4 lớp&#10;Chân khung: Inox 304&#10;Xiphong thoát nước: Nhựa PVC" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Thông số lắp đặt</label>
                                                    <input value={form.specs.thongSoLapDat} onChange={e => setForm({ ...form, specs: { ...form.specs, thongSoLapDat: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="Lắp đặt âm sàn" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Lưu ý lắp đặt</label>
                                                    <input value={form.specs.luuYLapDat} onChange={e => setForm({ ...form, specs: { ...form.specs, luuYLapDat: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="Cần không gian rộng" />
                                                </div>
                                            </>
                                        )}

                                        {/* Lavabo */}
                                        {form.categorySlug === 'lavabo' && (
                                            <>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Kích thước (D*R*C)</label>
                                                    <input value={form.specs.kichThuoc} onChange={e => setForm({ ...form, specs: { ...form.specs, kichThuoc: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="600*450*200mm" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Chất liệu</label>
                                                    <input value={form.specs.chatLieuThan} onChange={e => setForm({ ...form, specs: { ...form.specs, chatLieuThan: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="Gốm sứ cao cấp" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Tính chất</label>
                                                    <input value={form.specs.tinhChat} onChange={e => setForm({ ...form, specs: { ...form.specs, tinhChat: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="Chống bám bẩn, dễ vệ sinh" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Cân nặng</label>
                                                    <input value={form.specs.canNang} onChange={e => setForm({ ...form, specs: { ...form.specs, canNang: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="15kg" />
                                                </div>
                                            </>
                                        )}

                                        {/* Phụ Kiện */}
                                        {form.categorySlug === 'phu-kien' && (
                                            <>
                                                <div className="col-span-2">
                                                    <label className="text-sm font-normal text-black">Combo Options (JSON - ví dụ: ["Combo thân tròn", "Combo thân dẹp", "Hộp giấy"])</label>
                                                    <input value={form.specs.comboOptions} onChange={e => setForm({ ...form, specs: { ...form.specs, comboOptions: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder='["Combo thân tròn", "Combo thân dẹp"]' />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Tiện ích</label>
                                                    <input value={form.specs.tienIch} onChange={e => setForm({ ...form, specs: { ...form.specs, tienIch: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="Chống gỉ, bền bỉ" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Chất liệu</label>
                                                    <input value={form.specs.chatLieuThan} onChange={e => setForm({ ...form, specs: { ...form.specs, chatLieuThan: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="Inox 304" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Phương pháp mạ</label>
                                                    <input value={form.specs.phuongPhapMa} onChange={e => setForm({ ...form, specs: { ...form.specs, phuongPhapMa: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="Mạ chrome" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Lắp đặt</label>
                                                    <input value={form.specs.lapDat} onChange={e => setForm({ ...form, specs: { ...form.specs, lapDat: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="Khoan tường" />
                                                </div>
                                            </>
                                        )}

                                        {/* Vòi Chậu Lavabo */}
                                        {form.categorySlug === 'voi-chau-lavabo' && (
                                            <>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Tính năng</label>
                                                    <input value={form.specs.tinhNang} onChange={e => setForm({ ...form, specs: { ...form.specs, tinhNang: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="Nóng lạnh, xoay 360°" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Chất liệu</label>
                                                    <input value={form.specs.chatLieuThan} onChange={e => setForm({ ...form, specs: { ...form.specs, chatLieuThan: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="Đồng thau" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Phương pháp mạ</label>
                                                    <input value={form.specs.phuongPhapMa} onChange={e => setForm({ ...form, specs: { ...form.specs, phuongPhapMa: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="Mạ chrome 5 lớp" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Lắp đặt</label>
                                                    <input value={form.specs.lapDat} onChange={e => setForm({ ...form, specs: { ...form.specs, lapDat: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="Lắp trên chậu" />
                                                </div>
                                            </>
                                        )}

                                        {/* Vòi Sen */}
                                        {form.categorySlug === 'voi-sen' && (
                                            <>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Tính năng</label>
                                                    <input value={form.specs.tinhNang} onChange={e => setForm({ ...form, specs: { ...form.specs, tinhNang: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="Điều chỉnh nhiệt độ" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Tiện ích</label>
                                                    <input value={form.specs.tienIch} onChange={e => setForm({ ...form, specs: { ...form.specs, tienIch: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="3 chế độ phun" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Chất liệu</label>
                                                    <input value={form.specs.chatLieuThan} onChange={e => setForm({ ...form, specs: { ...form.specs, chatLieuThan: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="Đồng thau mạ chrome" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Phương pháp mạ</label>
                                                    <input value={form.specs.phuongPhapMa} onChange={e => setForm({ ...form, specs: { ...form.specs, phuongPhapMa: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="Mạ chrome 7 lớp" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Cân nặng củ sen</label>
                                                    <input value={form.specs.canNangCuSen} onChange={e => setForm({ ...form, specs: { ...form.specs, canNangCuSen: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="500g" />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-normal text-black">Lắp đặt</label>
                                                    <input value={form.specs.lapDat} onChange={e => setForm({ ...form, specs: { ...form.specs, lapDat: e.target.value } })} className="w-full px-3 py-2 border rounded text-slate-600 font-normal" placeholder="Âm tường hoặc nổi" />
                                                </div>
                                            </>
                                        )}

                                        {/* No category selected */}
                                        {!form.categorySlug && (
                                            <p className="col-span-2 text-slate-400 text-sm">Vui lòng chọn danh mục trước để nhập thông số kỹ thuật</p>
                                        )}
                                    </div>
                                </div>

                                <Button type="submit" className="w-full bg-[#21246b] hover:bg-[#1a1d55]" disabled={saving}>
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
                                <th className="pb-3">Đã bán</th>
                                <th className="pb-3">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map(p => (
                                <tr key={p.id} className="border-b hover:bg-slate-50">
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-100 bg-cover bg-center rounded border" style={{ backgroundImage: `url(${p.image.startsWith('http') ? p.image : `${API_URL}${p.image}`})` }} />
                                            <div>
                                                <span className="font-medium hover:text-[#21246b] cursor-pointer" onClick={() => openEditModal(p)}>{p.name}</span>
                                                <p className="text-xs text-slate-500">{p.subcategory?.name}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 text-sm">
                                        {p.subcategory?.category?.name || 'Chưa phân loại'}
                                    </td>
                                    <td className="py-4 text-sm">
                                        {new Intl.NumberFormat('vi-VN').format(p.price)}đ
                                    </td>
                                    <td className="py-4 text-sm">
                                        {p.stock}
                                    </td>
                                    <td className="py-4 text-sm">{p.soldCount || 0}</td>
                                    <td className="py-4">
                                        <div className="flex gap-2">
                                            <button onClick={() => openEditModal(p)} className="p-2 hover:bg-slate-100 rounded">
                                                <Edit className="h-4 w-4 text-slate-600" />
                                            </button>
                                            <button onClick={() => deleteProduct(p.id)} className="p-2 hover:bg-red-50 rounded">
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredProducts.length === 0 && (
                        <div className="text-center py-10 text-slate-500">
                            Không có sản phẩm nào trong danh mục này
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
