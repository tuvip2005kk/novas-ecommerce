"use client";
import { API_URL } from '@/config';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Plus, Trash2, Edit, Loader2, X, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast, ToastContainer } from "@/components/Toast";
import DynamicSpecs from "@/components/admin/DynamicSpecs";

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
    const { toasts, showToast, removeToast } = useToast();
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
        specs: [{ title: '', value: '' }] as { title: string; value: string }[]
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

    // Specs template management per subcategory
    const getSpecsTemplate = (subcategoryId: string) => {
        if (!subcategoryId) return null;
        try {
            const saved = localStorage.getItem(`specs_template_${subcategoryId}`);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) { console.error('Error loading specs template', e); }
        return null;
    };

    const saveSpecsTemplate = (subcategoryId: string, specs: { title: string; value: string }[]) => {
        if (!subcategoryId) return;
        // Filter out empty specs
        const validSpecs = specs.filter(s => s.title.trim() || s.value.trim());
        if (validSpecs.length > 0) {
            // Save template with just titles (values will be different per product)
            const template = validSpecs.map(s => ({ title: s.title, value: '' }));
            localStorage.setItem(`specs_template_${subcategoryId}`, JSON.stringify(template));
        } else {
            // Remove template if all specs are empty
            localStorage.removeItem(`specs_template_${subcategoryId}`);
        }
    };

    // Load specs template when subcategory changes (only in add mode)
    const handleSubcategoryChange = (newSubcategoryId: string) => {
        setForm(prev => {
            const newForm = { ...prev, subcategoryId: newSubcategoryId };
            if (!editingProduct && newSubcategoryId) {
                const template = getSpecsTemplate(newSubcategoryId);
                if (template) {
                    newForm.specs = template;
                }
            }
            return newForm;
        });
    };


    const openAddModal = () => {
        setEditingProduct(null);
        setForm({
            name: '', slug: '', description: '', price: '', image: '',
            images: [''], categorySlug: '', subcategoryId: '', stock: '',
            specs: [{ title: '', value: '' }]
        });
        setShowModal(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        const categorySlug = product.subcategory?.category?.slug || '';
        const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : [''];
        const rawSpecs = (product as any).specs || {};
        let specsArray: { title: string; value: string }[] = [];
        if (Array.isArray(rawSpecs)) { specsArray = rawSpecs; }
        else if (typeof rawSpecs === 'object') {
            specsArray = Object.entries(rawSpecs).filter(([_, v]) => v && String(v).trim() !== '').map(([k, v]) => ({ title: k, value: String(v) }));
        }
        if (specsArray.length === 0) specsArray = [{ title: '', value: '' }];
        setForm({
            name: product.name, slug: product.slug || '', description: product.description,
            price: product.price.toString(), image: product.image, images: images,
            categorySlug: categorySlug, subcategoryId: product.subcategoryId?.toString() || '',
            stock: product.stock.toString(), specs: specsArray
        });
        setShowModal(true);
    };

    const deleteProduct = async (id: number) => {
        try {
            const res = await fetch(`${API_URL}/api/products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                showToast('Đã xóa sản phẩm thành công', 'success');
                fetchProducts();
            } else {
                showToast('Không thể xóa sản phẩm', 'error');
            }
        } catch (error) {
            showToast('Lỗi kết nối', 'error');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate image
        if (!form.image) {
            showToast("Vui lòng chọn ảnh chính cho sản phẩm!", "error");
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
            showToast("Đã có lỗi khi lưu sản phẩm", "error");
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
                    <p className="text-slate-500 font-normal">Thêm, sửa, xóa sản phẩm trong kho • Tổng: {products.length} sản phẩm</p>
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
                                            onChange={(e) => handleSubcategoryChange(e.target.value)}
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


                                {/* Product Specifications - Dynamic */}
                                <DynamicSpecs
                                    specs={form.specs}
                                    onChange={(specs) => setForm({ ...form, specs })}
                                />


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
                            <tr className="border-b text-left text-sm text-slate-500 font-normal">
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
                                                <p className="text-xs text-slate-500 font-normal font-normal">{p.subcategory?.name}</p>
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
                        <div className="text-center py-10 text-slate-500 font-normal">
                            Không có sản phẩm nào trong danh mục này
                        </div>
                    )}
                </CardContent>
            </Card>
            <ToastContainer toasts={toasts} onClose={removeToast} />
        </div>
    );
}







