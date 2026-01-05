"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface Order {
    id: number;
    total: number;
    status: string;
    createdAt: string;
    items: { product: { category: string; name: string }; quantity: number }[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminAnalytics() {
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [categoryData, setCategoryData] = useState<any[]>([]);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(30);
    const [filterType, setFilterType] = useState<'days' | 'month'>('days');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        fetchAnalytics();
    }, [days, filterType, selectedMonth, selectedYear]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3005/orders/all');
            const orders: Order[] = await res.json();
            const ordersArray = Array.isArray(orders) ? orders : [];

            // Revenue by day based on filter type
            const dailyRevenue: { [key: string]: number } = {};

            if (filterType === 'days') {
                for (let i = days - 1; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    const dateStr = date.toISOString().split('T')[0];
                    dailyRevenue[dateStr] = 0;
                }
            } else {
                // Monthly view
                const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(selectedYear, selectedMonth, day);
                    const dateStr = date.toISOString().split('T')[0];
                    dailyRevenue[dateStr] = 0;
                }
            }

            ordersArray.forEach(order => {
                if (order.status === 'PAID') {
                    const dateStr = order.createdAt.split('T')[0];
                    if (dailyRevenue[dateStr] !== undefined) {
                        dailyRevenue[dateStr] += order.total;
                    }
                }
            });

            const revenueChart = Object.entries(dailyRevenue).map(([date, revenue]) => ({
                date: filterType === 'days'
                    ? new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
                    : new Date(date).getDate().toString(),
                revenue
            }));
            setRevenueData(revenueChart);

            // Category distribution
            const categoryCount: { [key: string]: number } = {};
            ordersArray.forEach(order => {
                order.items?.forEach(item => {
                    const cat = item.product?.category || 'Khác';
                    categoryCount[cat] = (categoryCount[cat] || 0) + item.quantity;
                });
            });
            setCategoryData(Object.entries(categoryCount).map(([name, value]) => ({ name, value })));

            // Top products
            const productCount: { [key: string]: number } = {};
            ordersArray.forEach(order => {
                order.items?.forEach(item => {
                    const name = item.product?.name || 'Unknown';
                    productCount[name] = (productCount[name] || 0) + item.quantity;
                });
            });
            setTopProducts(
                Object.entries(productCount)
                    .map(([name, sales]) => ({ name, sales }))
                    .sort((a, b) => b.sales - a.sales)
                    .slice(0, 5)
            );

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
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Thống kê & Phân tích</h1>
                <p className="text-slate-500">Dữ liệu thật từ database - cập nhật realtime</p>
            </div>

            {/* Revenue Trend */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4">
                        <CardTitle>📈 Xu hướng doanh thu (Dữ liệu thật)</CardTitle>
                        <div className="flex flex-wrap gap-2 items-center">
                            {/* Day buttons */}
                            <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                                {[7, 14, 30, 60, 90].map(d => (
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
                        {revenueData.every(d => d.revenue === 0) ? (
                            <div className="flex items-center justify-center h-full text-slate-500">
                                Chưa có đơn hàng đã thanh toán trong khoảng thời gian này
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => [`$${value}`, 'Doanh thu']} />
                                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Category Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>🏷️ Phân bổ theo danh mục</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            {categoryData.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-slate-500">
                                    Chưa có dữ liệu sản phẩm
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                                            {categoryData.map((e: any, i: number) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Products */}
                <Card>
                    <CardHeader>
                        <CardTitle>🔥 Sản phẩm bán chạy</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            {topProducts.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-slate-500">
                                    Chưa có đơn hàng nào
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topProducts} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={120} />
                                        <Tooltip />
                                        <Bar dataKey="sales" name="Số lượng bán" fill="#10b981" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
