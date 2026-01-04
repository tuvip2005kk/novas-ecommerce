"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, Users, DollarSign, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

interface Order {
    id: number;
    total: number;
    status: string;
    createdAt: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminDashboard() {
    const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, totalRevenue: 0, totalUsers: 0, pendingOrders: 0 });
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [statusData, setStatusData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(7);
    const [filterType, setFilterType] = useState<'days' | 'month'>('days');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        fetchData();
    }, [days, filterType, selectedMonth, selectedYear]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [productsRes, ordersRes, usersRes] = await Promise.all([
                fetch('http://localhost:3005/api/products'),
                fetch('http://localhost:3005/orders/all'),
                fetch('http://localhost:3005/users/all')
            ]);

            const products = await productsRes.json();
            const orders = await ordersRes.json();
            const users = await usersRes.json().catch(() => []);

            const ordersArray = Array.isArray(orders) ? orders : [];
            const usersArray = Array.isArray(users) ? users : [];

            const paidOrders = ordersArray.filter((o: Order) => o.status === 'PAID');
            const totalRevenue = paidOrders.reduce((sum: number, o: Order) => sum + o.total, 0);

            setStats({
                totalProducts: products.length,
                totalOrders: ordersArray.length,
                totalRevenue,
                totalUsers: usersArray.length,
                pendingOrders: ordersArray.filter((o: Order) => o.status === 'PENDING').length
            });

            // Revenue chart based on filter type
            const chartData = [];

            if (filterType === 'days') {
                for (let i = days - 1; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    const dateStr = date.toISOString().split('T')[0];
                    const dayOrders = ordersArray.filter((o: Order) => o.createdAt.startsWith(dateStr));
                    const dayRevenue = dayOrders.filter((o: Order) => o.status === 'PAID')
                        .reduce((sum: number, o: Order) => sum + o.total, 0);
                    chartData.push({
                        name: date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' }),
                        revenue: dayRevenue,
                        orders: dayOrders.length
                    });
                }
            } else {
                // Monthly view - show days in selected month
                const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(selectedYear, selectedMonth, day);
                    const dateStr = date.toISOString().split('T')[0];
                    const dayOrders = ordersArray.filter((o: Order) => o.createdAt.startsWith(dateStr));
                    const dayRevenue = dayOrders.filter((o: Order) => o.status === 'PAID')
                        .reduce((sum: number, o: Order) => sum + o.total, 0);
                    chartData.push({
                        name: `${day}`,
                        revenue: dayRevenue,
                        orders: dayOrders.length
                    });
                }
            }
            setRevenueData(chartData);

            // Status pie chart
            const statusCounts = [
                { name: 'Đã thanh toán', value: ordersArray.filter((o: Order) => o.status === 'PAID').length },
                { name: 'Chờ thanh toán', value: ordersArray.filter((o: Order) => o.status === 'PENDING').length },
                { name: 'Đã hủy', value: ordersArray.filter((o: Order) => o.status === 'CANCELLED').length },
            ];
            setStatusData(statusCounts);

        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    const years = [2023, 2024, 2025];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-500">Tổng quan hoạt động kinh doanh - Dữ liệu thật</p>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm">Tổng sản phẩm</p>
                                <p className="text-4xl font-bold mt-1">{stats.totalProducts}</p>
                            </div>
                            <Package className="h-12 w-12 text-blue-200" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm">Tổng đơn hàng</p>
                                <p className="text-4xl font-bold mt-1">{stats.totalOrders}</p>
                            </div>
                            <ShoppingCart className="h-12 w-12 text-green-200" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white border-0">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-yellow-100 text-sm">Doanh thu</p>
                                <p className="text-4xl font-bold mt-1">${stats.totalRevenue}</p>
                            </div>
                            <DollarSign className="h-12 w-12 text-yellow-200" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm">Người dùng</p>
                                <p className="text-4xl font-bold mt-1">{stats.totalUsers}</p>
                            </div>
                            <Users className="h-12 w-12 text-purple-200" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <div className="flex flex-col gap-4">
                            <CardTitle>📊 Doanh thu (Dữ liệu thật)</CardTitle>
                            <div className="flex flex-wrap gap-2 items-center">
                                {/* Day buttons */}
                                <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                                    {[7, 14, 30, 90].map(d => (
                                        <Button
                                            key={d}
                                            size="sm"
                                            variant={filterType === 'days' && days === d ? 'default' : 'ghost'}
                                            onClick={() => { setFilterType('days'); setDays(d); }}
                                            className="h-8"
                                        >
                                            {d} ngày
                                        </Button>
                                    ))}
                                </div>

                                <span className="text-slate-400">|</span>

                                {/* Month/Year selector */}
                                <div className="flex gap-2 items-center">
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => { setFilterType('month'); setSelectedMonth(parseInt(e.target.value)); }}
                                        className={`px-3 py-1.5 border rounded-lg text-sm ${filterType === 'month' ? 'border-blue-500 bg-blue-50' : ''}`}
                                    >
                                        {months.map((m, i) => (
                                            <option key={i} value={i}>{m}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => { setFilterType('month'); setSelectedYear(parseInt(e.target.value)); }}
                                        className={`px-3 py-1.5 border rounded-lg text-sm ${filterType === 'month' ? 'border-blue-500 bg-blue-50' : ''}`}
                                    >
                                        {years.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(value, name) => [
                                        name === 'revenue' ? `$${value}` : value,
                                        name === 'revenue' ? 'Doanh thu' : 'Số đơn'
                                    ]} />
                                    <Legend formatter={(value) => value === 'revenue' ? 'Doanh thu ($)' : 'Số đơn hàng'} />
                                    <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>📈 Trạng thái đơn hàng</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
