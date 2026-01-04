"use client";

import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, X, MapPin, Save, Phone, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Showroom {
    id: number;
    name: string;
    address: string;
    mapUrl: string | null;
    sortOrder: number;
    isActive: boolean;
}

export default function AdminFooter() {
    const [showrooms, setShowrooms] = useState<Showroom[]>([]);
    const [contact, setContact] = useState({
        hotline1: '',
        hotline2: '',
        emailSales: '',
        emailSupport: '',
        emailHR: '',
        facebookUrl: '',
        messengerUrl: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingShowroom, setEditingShowroom] = useState<Showroom | null>(null);
    const [formData, setFormData] = useState({ name: '', address: '', mapUrl: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [showroomsRes, settingsRes] = await Promise.all([
                fetch('http://localhost:3005/api/showrooms/all'),
                fetch('http://localhost:3005/api/settings'),
            ]);
            const showroomsData = await showroomsRes.json();
            const settingsData = await settingsRes.json();

            setShowrooms(showroomsData);
            setContact({
                hotline1: settingsData.hotline1 || '1900 9430',
                hotline2: settingsData.hotline2 || '1800 8149',
                emailSales: settingsData.emailSales || 'sell@novas.vn',
                emailSupport: settingsData.emailSupport || 'cskh@novas.vn',
                emailHR: settingsData.emailHR || 'hr@novas.vn',
                facebookUrl: settingsData.facebookUrl || '',
                messengerUrl: settingsData.messengerUrl || '',
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditingShowroom(null);
        setFormData({ name: '', address: '', mapUrl: '' });
        setShowModal(true);
    };

    const openEditModal = (s: Showroom) => {
        setEditingShowroom(s);
        setFormData({ name: s.name, address: s.address, mapUrl: s.mapUrl || '' });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingShowroom) {
                await fetch(`http://localhost:3005/api/showrooms/${editingShowroom.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });
            } else {
                await fetch('http://localhost:3005/api/showrooms', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...formData, sortOrder: showrooms.length, isActive: true }),
                });
            }
            fetchData();
            setShowModal(false);
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const deleteShowroom = async (id: number) => {
        if (!confirm('Xóa showroom này?')) return;
        await fetch(`http://localhost:3005/api/showrooms/${id}`, { method: 'DELETE' });
        fetchData();
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch('http://localhost:3005/api/settings/bulk', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contact),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/admin/design" className="text-xs text-slate-500 hover:text-slate-900">← Thiết kế</Link>
                    <h1 className="text-xl font-bold text-slate-900">Footer & Liên hệ</h1>
                </div>
                <Button onClick={handleSave} size="sm" disabled={saving} className={`text-xs ${saved ? 'bg-green-600' : 'bg-slate-900 hover:bg-slate-800'}`}>
                    {saved ? '✓ Đã lưu' : saving ? 'Đang lưu...' : <><Save className="h-3 w-3 mr-1" /> Lưu</>}
                </Button>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
                {/* Showrooms */}
                <div className="border border-slate-200 bg-white">
                    <div className="p-3 border-b border-slate-200 flex items-center justify-between">
                        <h2 className="font-medium text-sm flex items-center gap-2"><MapPin className="h-4 w-4" /> Showroom ({showrooms.length})</h2>
                        <button onClick={openAddModal} className="text-xs text-blue-600 hover:underline">+ Thêm</button>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                        {showrooms.map(s => (
                            <div key={s.id} className="p-2 flex items-center gap-2">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{s.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{s.address}</p>
                                </div>
                                <button onClick={() => openEditModal(s)} className="p-1 text-blue-600"><Edit className="h-3 w-3" /></button>
                                <button onClick={() => deleteShowroom(s.id)} className="p-1 text-red-600"><Trash2 className="h-3 w-3" /></button>
                            </div>
                        ))}
                        {showrooms.length === 0 && (
                            <div className="p-4 text-center text-xs text-slate-500">Chưa có showroom</div>
                        )}
                    </div>
                </div>

                {/* Contact Info */}
                <div className="border border-slate-200 bg-white">
                    <div className="p-3 border-b border-slate-200">
                        <h2 className="font-medium text-sm flex items-center gap-2"><Phone className="h-4 w-4" /> Thông tin liên hệ</h2>
                    </div>
                    <div className="p-3 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs text-slate-500">Hotline CSKH</label>
                                <input type="text" value={contact.hotline1} onChange={e => setContact({ ...contact, hotline1: e.target.value })} className="w-full mt-1 px-2 py-1 border border-slate-200 text-xs" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500">Hotline tư vấn</label>
                                <input type="text" value={contact.hotline2} onChange={e => setContact({ ...contact, hotline2: e.target.value })} className="w-full mt-1 px-2 py-1 border border-slate-200 text-xs" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500">Email kinh doanh</label>
                            <input type="email" value={contact.emailSales} onChange={e => setContact({ ...contact, emailSales: e.target.value })} className="w-full mt-1 px-2 py-1 border border-slate-200 text-xs" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500">Email CSKH</label>
                            <input type="email" value={contact.emailSupport} onChange={e => setContact({ ...contact, emailSupport: e.target.value })} className="w-full mt-1 px-2 py-1 border border-slate-200 text-xs" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500">Link Facebook</label>
                            <input type="text" value={contact.facebookUrl} onChange={e => setContact({ ...contact, facebookUrl: e.target.value })} className="w-full mt-1 px-2 py-1 border border-slate-200 text-xs" />
                        </div>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white border border-slate-200 p-4 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-sm">{editingShowroom ? 'Sửa Showroom' : 'Thêm Showroom'}</h2>
                            <button onClick={() => setShowModal(false)}><X className="h-4 w-4" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label className="text-xs font-medium">Tên</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full mt-1 px-3 py-1.5 border border-slate-200 text-sm" required />
                            </div>
                            <div>
                                <label className="text-xs font-medium">Địa chỉ</label>
                                <textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full mt-1 px-3 py-1.5 border border-slate-200 text-sm h-16" required />
                            </div>
                            <div>
                                <label className="text-xs font-medium">Link Maps</label>
                                <input type="text" value={formData.mapUrl} onChange={e => setFormData({ ...formData, mapUrl: e.target.value })} className="w-full mt-1 px-3 py-1.5 border border-slate-200 text-sm" />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-3 py-1.5 border border-slate-200 text-sm">Hủy</button>
                                <button type="submit" disabled={saving} className="flex-1 px-3 py-1.5 bg-slate-900 text-white text-sm disabled:opacity-50">
                                    {saving ? 'Đang lưu...' : (editingShowroom ? 'Cập nhật' : 'Thêm')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
