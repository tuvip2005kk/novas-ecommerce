"use client";
import { API_URL } from '@/config';

import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, X, ArrowUp, ArrowDown, Eye, Loader2, Upload } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Banner {
    id: number;
    image: string;
    title: string;
    description: string;
    link: string;
    cta: string;
    pageType: string;
    categorySlug: string | null;
    sortOrder: number;
    isActive: boolean;
}

interface Category {
    id: number;
    name: string;
    slug: string;
}

export default function AdminBanners() {
    const [pageType, setPageType] = useState<'homepage' | 'category'>('homepage');
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [formData, setFormData] = useState({ image: '', title: '', description: '', link: '', cta: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch(`${API_URL}/api/categories`)
            .then(res => res.json())
            .then(data => {
                setCategories(data);
                if (data.length > 0) setSelectedCategory(data[0].slug);
            });
    }, []);

    useEffect(() => {
        fetchBanners();
    }, [pageType, selectedCategory]);

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/banners/all`);
            const data = await res.json();
            let filtered = data.filter((b: Banner) => b.pageType === pageType);
            if (pageType === 'category' && selectedCategory) {
                filtered = filtered.filter((b: Banner) => b.categorySlug === selectedCategory);
            }
            setBanners(filtered);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            const res = await fetch(`${API_URL}/api/upload`, {
                method: 'POST',
                body: formDataUpload,
            });

            if (res.ok) {
                const data = await res.json();
                setFormData(prev => ({ ...prev, image: data.url }));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setUploading(false);
        }
    };

    const openAddModal = () => {
        setEditingBanner(null);
        setFormData({ image: '', title: '', description: '', link: '', cta: 'Xem Chi Tiết' });
        setShowModal(true);
    };

    const openEditModal = (banner: Banner) => {
        setEditingBanner(banner);
        setFormData({ image: banner.image, title: banner.title, description: banner.description || '', link: banner.link || '', cta: banner.cta || '' });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...formData,
                pageType,
                categorySlug: pageType === 'category' ? selectedCategory : null,
                sortOrder: banners.length,
                isActive: true,
            };

            if (editingBanner) {
                await fetch(`${API_URL}/api/banners/${editingBanner.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            } else {
                await fetch(`${API_URL}/api/banners`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            }
            fetchBanners();
            setShowModal(false);
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const deleteBanner = async (id: number) => {
        if (!confirm('Xóa banner này?')) return;
        await fetch(`${API_URL}/api/banners/${id}`, { method: 'DELETE' });
        fetchBanners();
    };

    const toggleActive = async (banner: Banner) => {
        await fetch(`${API_URL}/api/banners/${banner.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: !banner.isActive }),
        });
        fetchBanners();
    };

    const updateOrder = async (bannerId: number, newOrder: number) => {
        await fetch(`${API_URL}/api/banners/${bannerId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sortOrder: newOrder }),
        });
    };

    const moveUp = async (i: number) => {
        if (i === 0) return;
        await updateOrder(banners[i].id, i - 1);
        await updateOrder(banners[i - 1].id, i);
        fetchBanners();
    };

    const moveDown = async (i: number) => {
        if (i === banners.length - 1) return;
        await updateOrder(banners[i].id, i + 1);
        await updateOrder(banners[i + 1].id, i);
        fetchBanners();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/admin/design" className="text-xs text-slate-500 hover:text-slate-900">← Thiết kế</Link>
                    <h1 className="text-xl font-bold text-slate-900">Banner</h1>
                </div>
                <Button onClick={openAddModal} size="sm" className="bg-slate-900 hover:bg-slate-800 text-xs">
                    <Plus className="h-3 w-3 mr-1" /> Thêm
                </Button>
            </div>

            <div className="flex items-center gap-4 border border-slate-200 bg-white p-3">
                <span className="text-sm text-slate-500">Chọn trang:</span>
                <select
                    value={pageType}
                    onChange={(e) => setPageType(e.target.value as 'homepage' | 'category')}
                    className="px-3 py-1.5 border border-slate-200 text-sm"
                >
                    <option value="homepage">Trang chủ</option>
                    <option value="category">Trang danh mục</option>
                </select>

                {pageType === 'category' && (
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-1.5 border border-slate-200 text-sm"
                    >
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.slug}>{cat.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
                <div className="border border-slate-200 bg-white divide-y divide-slate-200">
                    {banners.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-sm text-slate-500">Chưa có banner</p>
                            <button onClick={openAddModal} className="mt-2 text-xs text-blue-600 hover:underline">+ Thêm banner</button>
                        </div>
                    ) : (
                        banners.map((banner, index) => (
                            <div key={banner.id} className={`p-3 flex gap-3 ${!banner.isActive ? 'opacity-50' : ''}`}>
                                <div className="w-32 h-20 bg-slate-100 bg-cover bg-center flex-shrink-0" style={{ backgroundImage: `url(${banner.image.startsWith('/uploads') ? '${API_URL}' + banner.image : banner.image})` }} />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-sm">{banner.title}</h3>
                                    <p className="text-xs text-slate-500 truncate">{banner.description}</p>
                                    <p className="text-xs text-slate-400 mt-1">Link: {banner.link}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => moveUp(index)} disabled={index === 0} className="p-1.5 hover:bg-slate-100 disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button>
                                    <button onClick={() => moveDown(index)} disabled={index === banners.length - 1} className="p-1.5 hover:bg-slate-100 disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button>
                                    <button onClick={() => toggleActive(banner)} className="p-1.5 hover:bg-slate-100"><Eye className={`h-3 w-3 ${banner.isActive ? 'text-green-600' : 'text-slate-400'}`} /></button>
                                    <button onClick={() => openEditModal(banner)} className="p-1.5 hover:bg-slate-100 text-blue-600"><Edit className="h-3 w-3" /></button>
                                    <button onClick={() => deleteBanner(banner.id)} className="p-1.5 hover:bg-slate-100 text-red-600"><Trash2 className="h-3 w-3" /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white border border-slate-200 p-4 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold">{editingBanner ? 'Sửa Banner' : 'Thêm Banner'}</h2>
                            <button onClick={() => setShowModal(false)}><X className="h-4 w-4" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label className="text-xs font-medium">Hình ảnh</label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <div className="mt-1 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 text-sm hover:bg-slate-50"
                                    >
                                        {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                                        {uploading ? 'Đang tải...' : 'Chọn ảnh'}
                                    </button>
                                    {formData.image && (
                                        <div className="w-16 h-10 bg-slate-100 bg-cover bg-center" style={{ backgroundImage: `url(${formData.image.startsWith('/uploads') ? '${API_URL}' + formData.image : formData.image})` }} />
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium">Tiêu đề</label>
                                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full mt-1 px-3 py-1.5 border border-slate-200 text-sm" required />
                            </div>
                            <div>
                                <label className="text-xs font-medium">Mô tả</label>
                                <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full mt-1 px-3 py-1.5 border border-slate-200 text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-medium">Link</label>
                                <input type="text" value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} className="w-full mt-1 px-3 py-1.5 border border-slate-200 text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-medium">Nút CTA</label>
                                <input type="text" value={formData.cta} onChange={e => setFormData({ ...formData, cta: e.target.value })} className="w-full mt-1 px-3 py-1.5 border border-slate-200 text-sm" />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-3 py-1.5 border border-slate-200 text-sm">Hủy</button>
                                <button type="submit" disabled={saving || !formData.image} className="flex-1 px-3 py-1.5 bg-slate-900 text-white text-sm disabled:opacity-50">
                                    {saving ? 'Đang lưu...' : (editingBanner ? 'Cập nhật' : 'Thêm')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
