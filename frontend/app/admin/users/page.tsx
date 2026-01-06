"use client";
import { API_URL } from '@/config';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Search, X, Eye, Pencil, Trash2, Key, MoreVertical } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
    id: number;
    email: string;
    name: string | null;
    role: string;
    createdAt: string;
    _count?: { orders: number; likes: number };
}

interface UserDetail extends User {
    orders: { id: number; total: number; status: string; createdAt: string }[];
    likes: { product: { id: number; name: string; image: string } }[];
}

export default function AdminUsers() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");

    // Modal states
    const [showModal, setShowModal] = useState<"create" | "edit" | "view" | "delete" | "password" | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userDetail, setUserDetail] = useState<UserDetail | null>(null);

    // Form states
    const [formData, setFormData] = useState({ email: "", password: "", name: "", role: "USER" });
    const [newPassword, setNewPassword] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchUsers(); }, []);

    const getToken = () => localStorage.getItem("token");

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_URL}/api/users/all`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDetail = async (id: number) => {
        const res = await fetch(`${API_URL}/api/users/${id}`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        return res.json();
    };

    const handleView = (user: User) => {
        router.push(`/admin/users/${user.id}`);
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setFormData({ email: user.email, password: "", name: user.name || "", role: user.role });
        setShowModal("edit");
    };

    const handleCreate = () => {
        setFormData({ email: "", password: "", name: "", role: "USER" });
        setShowModal("create");
    };

    const handleDelete = (user: User) => {
        setSelectedUser(user);
        setShowModal("delete");
    };

    const handleResetPassword = (user: User) => {
        setSelectedUser(user);
        setNewPassword("");
        setShowModal("password");
    };

    const saveUser = async () => {
        setSaving(true);
        try {
            if (showModal === "create") {
                await fetch(`${API_URL}/api/users`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                    body: JSON.stringify(formData)
                });
            } else if (showModal === "edit" && selectedUser) {
                await fetch(`${API_URL}/api/users/${selectedUser.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                    body: JSON.stringify({ email: formData.email, name: formData.name, role: formData.role })
                });
            }
            fetchUsers();
            setShowModal(null);
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!selectedUser) return;
        setSaving(true);
        try {
            await fetch(`${API_URL}/api/users/${selectedUser.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            fetchUsers();
            setShowModal(null);
        } finally {
            setSaving(false);
        }
    };

    const savePassword = async () => {
        if (!selectedUser || !newPassword) return;
        setSaving(true);
        try {
            await fetch(`${API_URL}/api/users/${selectedUser.id}/password`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ password: newPassword })
            });
            setShowModal(null);
        } finally {
            setSaving(false);
        }
    };

    // Filter and sort users (smallest ID first)
    const filteredUsers = users
        .filter(u => {
            const matchSearch = u.email.toLowerCase().includes(search.toLowerCase()) ||
                (u.name?.toLowerCase().includes(search.toLowerCase()));
            const matchRole = roleFilter === "ALL" || u.role === roleFilter;
            return matchSearch && matchRole;
        })
        .sort((a, b) => a.id - b.id);

    const [openMenu, setOpenMenu] = useState<number | null>(null);


    if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý người dùng</h1>
                    <p className="text-slate-500 font-normal text-sm">{users.length} người dùng</p>
                </div>
                <Button onClick={handleCreate} className="gap-2">
                    <Plus className="h-4 w-4" /> Thêm người dùng
                </Button>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 font-normal" />
                    <input
                        type="text"
                        placeholder="Tìm theo email hoặc tên..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm"
                >
                    <option value="ALL">Tất cả vai trò</option>
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                </select>
            </div>

            {/* Users Table */}
            <Card>
                <CardContent className="p-0">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-slate-50 text-left text-xs text-slate-500 font-normal uppercase">
                                <th className="p-3">ID</th>
                                <th className="p-3">Email</th>
                                <th className="p-3">Tên</th>
                                <th className="p-3">Vai trò</th>
                                <th className="p-3">Đơn hàng</th>
                                <th className="p-3">Ngày tạo</th>
                                <th className="p-3 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(u => (
                                <tr key={u.id} className="border-b hover:bg-slate-50">
                                    <td className="p-3 text-slate-500 font-normal">#{u.id}</td>
                                    <td className="p-3 font-medium">{u.email}</td>
                                    <td className="p-3">{u.name || "-"}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${u.role === "ADMIN" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
                                            }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-3 text-slate-500 font-normal">{u._count?.orders || 0}</td>
                                    <td className="p-3 text-slate-500 font-normal text-sm">{new Date(u.createdAt).toLocaleDateString("vi-VN")}</td>
                                    <td className="p-3">
                                        <div className="flex justify-end items-center">
                                            <button onClick={() => handleView(u)} className="p-1.5 hover:bg-slate-100 rounded" title="Xem chi tiết">
                                                <Eye className="h-4 w-4 text-slate-500 font-normal" />
                                            </button>
                                            <div className="relative">
                                                <button
                                                    onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                                                    className="p-1.5 hover:bg-slate-100 rounded"
                                                >
                                                    <MoreVertical className="h-4 w-4 text-slate-500 font-normal" />
                                                </button>
                                                {openMenu === u.id && (
                                                    <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 z-10 w-36">
                                                        <button
                                                            onClick={() => { handleEdit(u); setOpenMenu(null); }}
                                                            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                                                        >
                                                            Sửa thông tin
                                                        </button>
                                                        <button
                                                            onClick={() => { handleResetPassword(u); setOpenMenu(null); }}
                                                            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                                                        >
                                                            Đổi mật khẩu
                                                        </button>
                                                        <button
                                                            onClick={() => { handleDelete(u); setOpenMenu(null); }}
                                                            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 text-red-600"
                                                        >
                                                            Xóa người dùng
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredUsers.length === 0 && (
                        <div className="text-center py-10 text-slate-500 font-normal">Không tìm thấy người dùng</div>
                    )}
                </CardContent>
            </Card>

            {/* Modal Overlay */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(null)}>
                    <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>

                        {/* Create/Edit Modal */}
                        {(showModal === "create" || showModal === "edit") && (
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold">{showModal === "create" ? "Thêm người dùng" : "Sửa người dùng"}</h3>
                                    <button onClick={() => setShowModal(null)}><X className="h-5 w-5" /></button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Email *</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full border rounded-lg px-3 py-2"
                                            required
                                        />
                                    </div>
                                    {showModal === "create" && (
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Mật khẩu *</label>
                                            <input
                                                type="password"
                                                value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full border rounded-lg px-3 py-2"
                                                required
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Họ tên</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full border rounded-lg px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Vai trò</label>
                                        <select
                                            value={formData.role}
                                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full border rounded-lg px-3 py-2"
                                        >
                                            <option value="USER">User</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <Button variant="outline" onClick={() => setShowModal(null)} className="flex-1">Hủy</Button>
                                        <Button onClick={saveUser} disabled={saving} className="flex-1">
                                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* View Detail Modal */}
                        {showModal === "view" && userDetail && (
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold">Chi tiết người dùng</h3>
                                    <button onClick={() => setShowModal(null)}><X className="h-5 w-5" /></button>
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div><span className="text-slate-500 font-normal">ID:</span> #{userDetail.id}</div>
                                        <div><span className="text-slate-500 font-normal">Vai trò:</span> {userDetail.role}</div>
                                        <div className="col-span-2"><span className="text-slate-500 font-normal">Email:</span> {userDetail.email}</div>
                                        <div className="col-span-2"><span className="text-slate-500 font-normal">Tên:</span> {userDetail.name || "-"}</div>
                                        <div className="col-span-2"><span className="text-slate-500 font-normal">Ngày tạo:</span> {new Date(userDetail.createdAt).toLocaleString("vi-VN")}</div>
                                    </div>
                                    <div className="border-t pt-4">
                                        <div className="flex gap-4 text-sm">
                                            <div><span className="text-slate-500 font-normal">Đơn hàng:</span> {userDetail._count?.orders || 0}</div>
                                            <div><span className="text-slate-500 font-normal">Yêu thích:</span> {userDetail._count?.likes || 0}</div>
                                        </div>
                                    </div>
                                    {userDetail.orders.length > 0 && (
                                        <div className="border-t pt-4">
                                            <h4 className="font-medium mb-2">Đơn hàng gần đây</h4>
                                            <div className="space-y-2 text-sm">
                                                {userDetail.orders.map(o => (
                                                    <div key={o.id} className="flex justify-between">
                                                        <span>#{o.id} - {o.status}</span>
                                                        <span>{new Intl.NumberFormat("vi-VN").format(o.total)}đ</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Delete Confirm Modal */}
                        {showModal === "delete" && selectedUser && (
                            <div className="p-6">
                                <h3 className="text-lg font-bold mb-4">Xác nhận xóa</h3>
                                <p className="text-slate-600 mb-4">Bạn có chắc muốn xóa người dùng <strong>{selectedUser.email}</strong>?</p>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setShowModal(null)} className="flex-1">Hủy</Button>
                                    <Button variant="destructive" onClick={confirmDelete} disabled={saving} className="flex-1">
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Xóa"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Reset Password Modal */}
                        {showModal === "password" && selectedUser && (
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold">Đổi mật khẩu</h3>
                                    <button onClick={() => setShowModal(null)}><X className="h-5 w-5" /></button>
                                </div>
                                <p className="text-slate-600 text-sm mb-4">Đổi mật khẩu cho: {selectedUser.email}</p>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Mật khẩu mới *</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            className="w-full border rounded-lg px-3 py-2"
                                            placeholder="Nhập mật khẩu mới"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => setShowModal(null)} className="flex-1">Hủy</Button>
                                        <Button onClick={savePassword} disabled={saving || !newPassword} className="flex-1">
                                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

