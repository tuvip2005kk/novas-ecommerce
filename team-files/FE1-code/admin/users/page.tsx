"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, User } from "lucide-react";
import { useEffect, useState } from "react";

interface User {
    id: number;
    email: string;
    name: string | null;
    role: string;
    createdAt: string;
}

export default function AdminUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('http://localhost:3005/users/all');
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } finally {
            setLoading(false);
        }
    };

    const updateRole = async (id: number, role: string) => {
        await fetch(`http://localhost:3005/users/${id}/role`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role })
        });
        fetchUsers();
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Quản lý người dùng</h1>
                <p className="text-slate-500">Xem và phân quyền tài khoản</p>
            </div>
            <Card>
                <CardContent className="pt-6">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b text-left text-sm text-slate-500">
                                <th className="pb-3">ID</th>
                                <th className="pb-3">Email</th>
                                <th className="pb-3">Tên</th>
                                <th className="pb-3">Vai trò</th>
                                <th className="pb-3">Ngày tạo</th>
                                <th className="pb-3">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className="border-b hover:bg-slate-50">
                                    <td className="py-4 text-slate-500">#{u.id}</td>
                                    <td className="py-4 font-medium">{u.email}</td>
                                    <td className="py-4">{u.name || 'N/A'}</td>
                                    <td className="py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'ADMIN' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {u.role === 'ADMIN' ? '👑 Admin' : '👤 User'}
                                        </span>
                                    </td>
                                    <td className="py-4 text-slate-500">{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                                    <td className="py-4">
                                        <select
                                            value={u.role}
                                            onChange={(e) => updateRole(u.id, e.target.value)}
                                            className="border rounded px-2 py-1 text-sm"
                                        >
                                            <option value="USER">User</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
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
