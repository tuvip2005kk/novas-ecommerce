"use client";
import { API_URL } from '@/config';

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

interface Order {
    id: number;
    total: number;
    status: string;
    createdAt: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

interface Stats {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    totalUsers: number;
    pendingOrders: number;
    todayOrders: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats>({ totalProducts: 0, totalOrders: 0, totalRevenue: 0, totalUsers: 0, pendingOrders: 0, todayOrders: 0 });
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
                fetch(`${API_URL}/api/products`),
                fetch(`${API_URL}/api/orders/all`),
                fetch(`${API_URL}/api/users/all`)
            ]);

            const products = await productsRes.json();
            const orders = await ordersRes.json();
            const users = await usersRes.json().catch(() => []);

            const ordersArray = Array.isArray(orders) ? orders : [];
            const usersArray = Array.isArray(users) ? users : [];

            const paidOrders = ordersArray.filter((o: Order) => o.status === 'Đã thanh toán' || o.status === 'Hoàn thành' || o.status === 'Đã giao');
            const totalRevenue = paidOrders.reduce((sum: number, o: Order) => sum + o.total, 0);

            // Today's orders
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            const todayOrders = ordersArray.filter((o: Order) => o.createdAt.startsWith(todayStr));

            setStats({
                totalProducts: products.length,
                totalOrders: ordersArray.length,
                totalRevenue,
                totalUsers: usersArray.length,
                pendingOrders: ordersArray.filter((o: Order) => o.status === 'PENDING').length,
                todayOrders: todayOrders.length
            });

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
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-sm text-slate-500 font-normal">Tổng quan hoạt động kinh doanh</p>
            </div>

            {/* Stats Grid - Simple boxes without icons */}
            <div className="grid md:grid-cols-5 gap-4">
                <div className="border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500 font-normal">Hôm nay</p>
                    <p className="text-2xl font-bold mt-1 text-orange-600">{stats.todayOrders}</p>
                </div>
                <div className="border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500 font-normal">Sản phẩm</p>
                    <p className="text-2xl font-bold mt-1">{stats.totalProducts}</p>
                </div>
                <div className="border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500 font-normal">Đơn hàng</p>
                    <p className="text-2xl font-bold mt-1">{stats.totalOrders}</p>
                </div>
                <div className="border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500 font-normal">Doanh thu</p>
                    <p className="text-2xl font-bold mt-1">${stats.totalRevenue}</p>
                </div>
                <div className="border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500 font-normal">Người dùng</p>
                    <p className="text-2xl font-bold mt-1">{stats.totalUsers}</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2 border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-3 mb-4">
                        <h2 className="font-medium">Doanh thu</h2>
                        <div className="flex flex-wrap gap-2 items-center">
                            <div className="flex gap-1">
                                {[7, 14, 30, 90].map(d => (
                                    <button
                                        key={d}
                                        onClick={() => { setFilterType('days'); setDays(d); }}
                                        className={`px-3 py-1 text-xs border ${filterType === 'days' && days === d ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200'}`}
                                    >
                                        {d} ngày
                                    </button>
                                ))}
                            </div>
                            <span className="text-slate-300">|</span>
                            <div className="flex gap-2">
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => { setFilterType('month'); setSelectedMonth(parseInt(e.target.value)); }}
                                    className={`px-2 py-1 border text-xs ${filterType === 'month' ? 'border-slate-900' : 'border-slate-200'}`}
                                >
                                    {months.map((m, i) => (
                                        <option key={i} value={i}>{m}</option>
                                    ))}
                                </select>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => { setFilterType('month'); setSelectedYear(parseInt(e.target.value)); }}
                                    className={`px-2 py-1 border text-xs ${filterType === 'month' ? 'border-slate-900' : 'border-slate-200'}`}
                                >
                                    {years.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip formatter={(value, name) => [
                                    name === 'revenue' ? `$${value}` : value,
                                    name === 'revenue' ? 'Doanh thu' : 'Số đơn'
                                ]} />
                                <Legend formatter={(value) => value === 'revenue' ? 'Doanh thu ($)' : 'Số đơn'} />
                                <Bar dataKey="revenue" fill="#3b82f6" />
                                <Bar dataKey="orders" fill="#10b981" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="border border-slate-200 bg-white p-4">
                    <h2 className="font-medium mb-4">Trạng thái đơn hàng</h2>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
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
                </div>
            </div>
        </div>
    );
}

