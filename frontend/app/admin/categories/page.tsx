"use client";
import { API_URL } from '@/config';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Plus, Trash2, Edit, Loader2, X, FolderTree, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

interface Subcategory {
    id: number;
    name: string;
    slug: string;
    image: string | null;
    _count?: { products: number };
}

interface Category {
    id: number;
    name: string;
    slug: string;
    image: string | null;
    description: string | null;
    subcategories: Subcategory[];
}

export default function AdminCategories() {
    const { token } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'category' | 'subcategory'>('category');
    const [editingItem, setEditingItem] = useState<any>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '',
        slug: '',
        image: '',
        description: ''
    });

    useEffect(() => { fetchCategories(); }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${API_URL}/api/categories`);
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (error) {
            console.error('Failed to fetch categories', error);
        } finally {
            setLoading(false);
        }
    };

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

    const openAddCategoryModal = () => {
        setEditingItem(null);
        setModalType('category');
        setForm({ name: '', slug: '', image: '', description: '' });
        setShowModal(true);
    };

    const openAddSubcategoryModal = (categoryId: number) => {
        setEditingItem(null);
        setModalType('subcategory');
        setSelectedCategoryId(categoryId);
        setForm({ name: '', slug: '', image: '', description: '' });
        setShowModal(true);
    };

    const openEditCategoryModal = (category: Category) => {
        setEditingItem(category);
        setModalType('category');
        setForm({
            name: category.name,
            slug: category.slug,
            image: category.image || '',
            description: category.description || ''
        });
        setShowModal(true);
    };

    const openEditSubcategoryModal = (subcategory: Subcategory, categoryId: number) => {
        setEditingItem(subcategory);
        setModalType('subcategory');
        setSelectedCategoryId(categoryId);
        setForm({
            name: subcategory.name,
            slug: subcategory.slug,
            image: subcategory.image || '',
            description: ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const slug = form.slug || generateSlug(form.name);

            if (modalType === 'category') {
                const url = editingItem
                    ? `${API_URL}/api/categories/${editingItem.id}`
                    : `${API_URL}/api/categories`;

                await fetch(url, {
                    method: editingItem ? 'PATCH' : 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: form.name,
                        slug,
                        image: form.image || null,
                        description: form.description || null
                    })
                });
                console.log('Category payload:', { name: form.name, slug, image: form.image || null, description: form.description || null });
            } else {
                const url = editingItem
                    ? `${API_URL}/api/subcategories/${editingItem.id}`
                    : `${API_URL}/api/subcategories`;

                await fetch(url, {
                    method: editingItem ? 'PATCH' : 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: form.name,
                        slug,
                        image: form.image || null,
                        categoryId: selectedCategoryId
                    })
                });
                console.log('Subcategory payload:', { name: form.name, slug, image: form.image || null, categoryId: selectedCategoryId });
            }

            setShowModal(false);
            fetchCategories();
        } catch (error) {
            console.error('Failed to save', error);
        } finally {
            setSaving(false);
        }
    };

    const deleteCategory = async (id: number) => {
        if (!confirm('Xóa danh mục này sẽ xóa tất cả danh mục con. Tiếp tục?')) return;
        await fetch(`${API_URL}/api/categories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchCategories();
    };

    const deleteSubcategory = async (id: number) => {
        if (!confirm('Xóa danh mục con này?')) return;
        await fetch(`${API_URL}/api/subcategories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchCategories();
    };

    const handleNameChange = (name: string) => {
        setForm(prev => ({
            ...prev,
            name,
            slug: editingItem ? prev.slug : generateSlug(name)
        }));
    };

    const [activeTab, setActiveTab] = useState<'main' | 'sub'>('main');

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    // Get all subcategories
    const allSubcategories = categories.flatMap(cat =>
        cat.subcategories.map(sub => ({ ...sub, categoryName: cat.name, categoryId: cat.id }))
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Quản lý danh mục</h1>
                    <p className="text-slate-500 font-normal">Thêm, sửa, xóa danh mục và danh mục con</p>
                </div>
                <Button className="bg-[#21246b] hover:bg-[#1a1d55]" onClick={activeTab === 'main' ? openAddCategoryModal : () => categories.length > 0 && openAddSubcategoryModal(categories[0].id)}>
                    <Plus className="h-4 w-4 mr-2" /> Thêm {activeTab === 'main' ? 'danh mục' : 'danh mục phụ'}
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b">
                <button
                    onClick={() => setActiveTab('main')}
                    className={`px-6 py-3 font-medium transition-colors ${activeTab === 'main'
                        ? 'text-[#21246b] border-b-2 border-[#21246b]'
                        : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Danh mục chính ({categories.length})
                </button>
                <button
                    onClick={() => setActiveTab('sub')}
                    className={`px-6 py-3 font-medium transition-colors ${activeTab === 'sub'
                        ? 'text-[#21246b] border-b-2 border-[#21246b]'
                        : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Danh mục phụ ({allSubcategories.length})
                </button>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <FolderTree className="h-5 w-5" />
                                {editingItem ? 'Sửa' : 'Thêm'} {modalType === 'category' ? 'danh mục chính' : 'danh mục phụ'}
                            </CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Tên {modalType === 'category' ? 'danh mục chính' : 'danh mục phụ'} *</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.name}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#21246b] font-normal"
                                        placeholder="VD: Bồn Cầu"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Slug (URL)</label>
                                    <input
                                        type="text"
                                        value={form.slug}
                                        onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                                        className="w-full mt-1 px-4 py-2 border rounded-lg bg-slate-50 font-normal"
                                        placeholder="bon-cau"
                                    />
                                </div>
                                {modalType === 'category' && (
                                    <div>
                                        <label className="text-sm font-medium">Mô tả</label>
                                        <textarea
                                            value={form.description}
                                            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                                            className="w-full mt-1 px-4 py-2 border rounded-lg h-20 font-normal"
                                            placeholder="Mô tả ngắn về danh mục..."
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="text-sm font-medium">Hình ảnh</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            try {
                                                const formData = new FormData();
                                                formData.append('file', file);
                                                const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: formData });
                                                if (!res.ok) {
                                                    alert('Upload failed: ' + res.statusText);
                                                    return;
                                                }
                                                const data = await res.json();
                                                console.log('Upload response:', data);
                                                setForm(prev => ({ ...prev, image: data.url }));
                                                console.log('Form updated with image:', data.url);
                                                alert('✅ Ảnh đã upload thành công!\nURL: ' + data.url + '\n\nNhớ click "Thêm mới" để lưu!');
                                            } catch (error) {
                                                console.error('Upload error:', error);
                                                alert('Upload failed: ' + error);
                                            }
                                        }}
                                        className="w-full mt-1 px-4 py-2 border rounded-lg font-normal"
                                    />
                                    {form.image && (
                                        <img src={`${API_URL}${form.image}`} alt="Preview" className="mt-2 h-16 w-16 object-cover rounded" />
                                    )}
                                </div>
                                <Button type="submit" className="w-full bg-[#21246b] hover:bg-[#1a1d55]" disabled={saving}>
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                    {saving ? 'Đang lưu...' : editingItem ? 'Cập nhật' : 'Thêm mới'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Main Categories Tab */}
            {activeTab === 'main' && (
                <div className="space-y-4">
                    {categories.length === 0 ? (
                        <Card>
                            <CardContent className="py-10 text-center text-slate-500 font-normal">
                                Chưa có danh mục nào. Nhấn &quot;Thêm danh mục&quot; để bắt đầu.
                            </CardContent>
                        </Card>
                    ) : (
                        categories.map((category) => (
                            <Card key={category.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-[#21246b]/20 rounded-lg flex items-center justify-center">
                                                <FolderTree className="h-6 w-6 text-[#21246b]" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{category.name}</CardTitle>
                                                <p className="text-sm text-slate-500 font-normal">/{category.slug} • {category.subcategories.length} danh mục phụ</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => openAddSubcategoryModal(category.id)}>
                                                <Plus className="h-4 w-4 mr-1" /> Thêm phụ
                                            </Button>
                                            <Button variant="outline" size="icon" onClick={() => openEditCategoryModal(category)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="icon" className="text-red-600 hover:bg-red-50" onClick={() => deleteCategory(category.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                {category.subcategories.length > 0 && (
                                    <CardContent>
                                        <div className="pl-6 border-l-2 border-slate-200 space-y-2">
                                            {category.subcategories.map((sub) => (
                                                <div key={sub.id} className="flex items-center justify-between py-2 px-4 bg-slate-50 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <ChevronRight className="h-4 w-4 text-slate-400 font-normal" />
                                                        <span className="font-medium">{sub.name}</span>
                                                        <span className="text-xs text-slate-400 font-normal">/{sub.slug}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => openEditSubcategoryModal(sub, category.id)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-red-600" onClick={() => deleteSubcategory(sub.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* Subcategories Tab */}
            {activeTab === 'sub' && (
                <Card>
                    <CardContent className="pt-6">
                        {allSubcategories.length === 0 ? (
                            <p className="text-center text-slate-500 font-normal py-10">Chưa có danh mục phụ nào</p>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b text-left text-sm text-slate-500 font-normal">
                                        <th className="pb-3">ID</th>
                                        <th className="pb-3">Tên</th>
                                        <th className="pb-3">Slug</th>
                                        <th className="pb-3">Danh mục chính</th>
                                        <th className="pb-3">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allSubcategories.map(sub => (
                                        <tr key={sub.id} className="border-b">
                                            <td className="py-3 text-sm">{sub.id}</td>
                                            <td className="py-3 text-sm font-medium">{sub.name}</td>
                                            <td className="py-3 text-sm text-slate-500 font-normal">/{sub.slug}</td>
                                            <td className="py-3 text-sm">{sub.categoryName}</td>
                                            <td className="py-3">
                                                <div className="flex gap-2">
                                                    <button onClick={() => openEditSubcategoryModal(sub, sub.categoryId)} className="p-2 hover:bg-slate-100 rounded">
                                                        <Edit className="h-4 w-4 text-slate-600" />
                                                    </button>
                                                    <button onClick={() => deleteSubcategory(sub.id)} className="p-2 hover:bg-red-50 rounded">
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

