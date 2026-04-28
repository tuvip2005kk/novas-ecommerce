"use client";
import { API_URL } from '@/config';
import { Loader2, Plus, Trash2, Download, Upload, BarChart3 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import ExcelJS from 'exceljs';
const months = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const APP_VERSION = "1.1";

interface Order { id: number; total: number; status: string; createdAt: string; }
interface Expense { id: number; title: string; amount: number; type: string; date: string; description: string; }

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
const EXPENSE_TYPES = [
    { value: 'IMPORT', label: 'Nhập hàng' },
    { value: 'SALARY', label: 'Lương nhân viên' },
    { value: 'MARKETING', label: 'Marketing/Quảng cáo' },
    { value: 'RENT', label: 'Mặt bằng/Điện nước' },
    { value: 'OTHER', label: 'Khác' }
];

const PAID_STATUSES = ['Đã thanh toán', 'Đang chuẩn bị', 'Đang giao hàng', 'Đang giao', 'Đã giao thành công', 'Đã giao', 'Hoàn thành'];
const PENDING_STATUSES = ['Chờ thanh toán'];
const CANCELLED_STATUSES = ['Đã hủy', 'Hoàn hàng'];

interface Stats {
    totalProducts: number; totalOrders: number; totalRevenue: number;
    totalExpenses: number; totalProfit: number; totalUsers: number;
    pendingOrders: number; todayOrders: number;
}

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'overview' | 'expenses'>('overview');
    const [stats, setStats] = useState<Stats>({ totalProducts: 0, totalOrders: 0, totalRevenue: 0, totalExpenses: 0, totalProfit: 0, totalUsers: 0, pendingOrders: 0, todayOrders: 0 });
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [statusData, setStatusData] = useState<any[]>([]);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(7);
    const [filterType, setFilterType] = useState<'days' | 'month'>('days');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Expense states
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [expLoading, setExpLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('OTHER');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [expMonth, setExpMonth] = useState(new Date().getMonth());
    const [expYear, setExpYear] = useState(new Date().getFullYear());
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterExpType, setFilterExpType] = useState('ALL');
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('novas_admin_token') || localStorage.getItem('novas_token');
        return token ? { 'Authorization': `Bearer ${token}` } : {} as Record<string, string>;
    };

    useEffect(() => { fetchData(); }, [days, filterType, selectedMonth, selectedYear]);
    useEffect(() => { if (activeTab === 'expenses') fetchExpenses(); }, [activeTab]);

    const fetchExpenses = async () => {
        setExpLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/expenses`, { headers: getAuthHeaders() });
            if (res.ok) setExpenses(await res.json());
        } catch (e) { console.error(e); } finally { setExpLoading(false); }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const headers = getAuthHeaders();
            const [productsRes, ordersRes, usersRes, expensesRes] = await Promise.all([
                fetch(`${API_URL}/api/products`),
                fetch(`${API_URL}/api/orders/all`, { headers }),
                fetch(`${API_URL}/api/users/all`, { headers }),
                fetch(`${API_URL}/api/expenses`, { headers }).catch(() => null)
            ]);
            const products = await productsRes.json();
            const orders = await ordersRes.json();
            const users = await usersRes.json().catch(() => []);
            const expData = expensesRes ? await expensesRes.json().catch(() => []) : [];

            const ordersArray = Array.isArray(orders) ? orders : [];
            const usersArray = Array.isArray(users) ? users : [];
            const expArray = Array.isArray(expData) ? expData : [];

            const paidOrders = ordersArray.filter((o: Order) => PAID_STATUSES.includes(o.status));
            const totalRevenue = paidOrders.reduce((s: number, o: Order) => s + o.total, 0);
            const todayStr = new Date().toISOString().split('T')[0];
            const totalExpenses = expArray.reduce((s: number, e: any) => s + e.amount, 0);

            setStats({
                totalProducts: products.length, totalOrders: ordersArray.length,
                totalRevenue, totalExpenses, totalProfit: totalRevenue - totalExpenses,
                totalUsers: usersArray.length,
                pendingOrders: ordersArray.filter((o: Order) => PENDING_STATUSES.includes(o.status)).length,
                todayOrders: ordersArray.filter((o: Order) => o.createdAt.startsWith(todayStr)).length
            });

            const chartData: any[] = [];
            if (filterType === 'days') {
                for (let i = days - 1; i >= 0; i--) {
                    const d = new Date(); d.setDate(d.getDate() - i);
                    const ds = d.toISOString().split('T')[0];
                    const dayOrders = ordersArray.filter((o: Order) => o.createdAt.startsWith(ds));
                    chartData.push({
                        name: d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' }),
                        revenue: dayOrders.filter((o: Order) => PAID_STATUSES.includes(o.status)).reduce((s: number, o: Order) => s + o.total, 0),
                        orders: dayOrders.length
                    });
                }
            } else {
                const dim = new Date(selectedYear, selectedMonth + 1, 0).getDate();
                for (let day = 1; day <= dim; day++) {
                    const d = new Date(selectedYear, selectedMonth, day);
                    const ds = d.toISOString().split('T')[0];
                    const dayOrders = ordersArray.filter((o: Order) => o.createdAt.startsWith(ds));
                    chartData.push({
                        name: `${day}`,
                        revenue: dayOrders.filter((o: Order) => PAID_STATUSES.includes(o.status)).reduce((s: number, o: Order) => s + o.total, 0),
                        orders: dayOrders.length
                    });
                }
            }
            setRevenueData(chartData);
            setStatusData([
                { name: 'Đã thanh toán', value: ordersArray.filter((o: Order) => PAID_STATUSES.includes(o.status)).length },
                { name: 'Chờ xử lý', value: ordersArray.filter((o: Order) => PENDING_STATUSES.includes(o.status)).length },
                { name: 'Đã hủy', value: ordersArray.filter((o: Order) => CANCELLED_STATUSES.includes(o.status)).length },
            ]);

            // Top Products
            const productSales: Record<number, { name: string, quantity: number, revenue: number }> = {};
            ordersArray.forEach((o: any) => {
                if (PAID_STATUSES.includes(o.status)) {
                    o.items?.forEach((item: any) => {
                        const pid = item.product?.id;
                        if (pid) {
                            if (!productSales[pid]) productSales[pid] = { name: item.product.name, quantity: 0, revenue: 0 };
                            productSales[pid].quantity += item.quantity;
                            productSales[pid].revenue += (item.price || item.product.price) * item.quantity;
                        }
                    });
                }
            });
            setTopProducts(Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5));
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const url = editingExpense ? `${API_URL}/api/expenses/${editingExpense.id}` : `${API_URL}/api/expenses`;
            const method = editingExpense ? 'PUT' : 'POST';
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ title, amount: parseFloat(amount), type, date: new Date(date).toISOString(), description })
            });
            if (res.ok) { 
                setTitle(''); setAmount(''); setDescription(''); setEditingExpense(null);
                fetchExpenses(); fetchData(); 
            }
            else alert('Có lỗi xảy ra');
        } catch (e) { console.error(e); } finally { setIsSubmitting(false); }
    };

    const handleEditClick = (exp: Expense) => {
        setEditingExpense(exp);
        setTitle(exp.title);
        setAmount(exp.amount.toString());
        setType(exp.type);
        setDate(new Date(exp.date).toISOString().split('T')[0]);
        setDescription(exp.description || '');
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const filteredExpenses = expenses.filter(exp => {
        const d = new Date(exp.date);
        const matchesDate = d.getMonth() === expMonth && d.getFullYear() === expYear;
        const matchesSearch = exp.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (exp.description && exp.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesType = filterExpType === 'ALL' || exp.type === filterExpType;
        return matchesDate && matchesSearch && matchesType;
    });

    const expenseTypeStats = EXPENSE_TYPES.map(t => ({
        name: t.label,
        value: filteredExpenses.filter(e => e.type === t.value).reduce((sum, e) => sum + e.amount, 0)
    })).filter(t => t.value > 0);

    const totalFilteredExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);

    const handleDeleteExpense = async (id: number) => {
        if (!confirm('Xóa khoản chi này?')) return;
        try {
            await fetch(`${API_URL}/api/expenses/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
            fetchExpenses(); fetchData();
        } catch (e) { console.error(e); }
    };

    const handleExport = async () => {
        let dataToExport = filteredExpenses;
        if (dataToExport.length === 0) {
            alert('Không có dữ liệu trong khoảng thời gian này để xuất báo cáo.');
            return;
        }

        const wb = new ExcelJS.Workbook();
        wb.creator = 'NOVAS Admin';
        wb.created = new Date();
        const reportTime = `Tháng ${expMonth + 1}/${expYear}`;
        const todayFull = new Date().toLocaleString('vi-VN');

        const NAVY = 'FF21246B', WHITE = 'FFFFFFFF', GOLD = 'FFFFD700';
        const LIGHT = 'FFF0F4FF', STRIPE = 'FFF8FAFC';
        const GREEN = 'FF16A34A', RED = 'FFDC2626', BLUE = 'FF1D4ED8';
        const DARK = 'FF1E293B', ORANGE = 'FFEA580C';

        const t = { style: 'thin' as const };
        const m = { style: 'medium' as const };
        const h = { style: 'hair' as const };
        const bT = { top: t, bottom: t, left: t, right: t };
        const bM = { top: m, bottom: m, left: m, right: m };
        const bH = { top: h, bottom: h, left: h, right: h };
        const fl = (argb: string) => ({ type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb } });
        const fn = (bold: boolean, size: number, argb: string) => ({ bold, size, name: 'Calibri', color: { argb } });
        const setCell = (ws: any, addr: string, val: any, style: any = {}) => {
            const c = ws.getCell(addr);
            c.value = val;
            if (style.font) c.font = style.font;
            if (style.fill) c.fill = style.fill;
            if (style.alignment) c.alignment = style.alignment;
            if (style.border) c.border = style.border;
            if (style.numFmt) c.numFmt = style.numFmt;
            return c;
        };

        const grandTotal = dataToExport.reduce((s, e) => s + e.amount, 0);
        const margin = stats.totalRevenue > 0 ? ((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1) : '0.0';
        const aov = stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders) : 0;

        // ── SHEET 1: KPI TỔNG QUAN ──
        const s1 = wb.addWorksheet('Tong Quan KPI');

        s1.mergeCells('A1:E1');
        { const c = s1.getCell('A1'); c.value = 'CÔNG TY TNHH THIẾT BỊ VỆ SINH THÔNG MINH NOVAS'; c.font = fn(true, 15, GOLD); c.fill = fl(NAVY); c.alignment = { horizontal: 'center', vertical: 'middle' }; }
        s1.getRow(1).height = 36;

        s1.mergeCells('A2:E2');
        setCell(s1, 'A2', `BÁO CÁO KINH DOANH ${reportTime.toUpperCase()}  |  Xuất ngày: ${todayFull}`, { font: fn(true, 11, WHITE), fill: fl('FF1E293B'), alignment: { horizontal: 'center', vertical: 'middle' } });
        s1.getRow(2).height = 22;
        s1.getRow(3).height = 10;

        s1.mergeCells('A4:E4');
        { const c = s1.getCell('A4'); c.value = 'CHỈ SỐ HIỆU SUẤT KINH DOANH (KPI)'; c.font = fn(true, 12, NAVY); c.fill = fl(LIGHT); c.alignment = { horizontal: 'center', vertical: 'middle' }; c.border = bM; }
        s1.getRow(4).height = 26;

        ['CHỈ TIÊU', 'GIÁ TRỊ', 'ĐƠN VỊ', 'GHI CHÚ', 'ĐÁNH GIÁ'].forEach((hdr, i) => {
            const c = s1.getCell(5, i + 1);
            c.value = hdr; c.font = fn(true, 10, WHITE); c.fill = fl(NAVY);
            c.alignment = { horizontal: 'center', vertical: 'middle' }; c.border = bT;
        });
        s1.getRow(5).height = 22;

        const kpiData: [string, number | string, string, string, string, string][] = [
            ['Tổng Doanh Thu', stats.totalRevenue, 'VNĐ', 'Từ đơn đã thanh toán', BLUE, 'Doanh thu tích lũy'],
            ['Tổng Chi Phí Vận Hành', stats.totalExpenses, 'VNĐ', 'Tổng các khoản chi', RED, 'Chi phí tích lũy'],
            ['Lợi Nhuận Ròng', stats.totalProfit, 'VNĐ', 'Doanh thu - Chi phí', stats.totalProfit >= 0 ? GREEN : RED, stats.totalProfit >= 0 ? 'Có lãi' : 'Lỗ'],
            ['Biên Lợi Nhuận', `${margin}%`, '%', 'Profit Margin = LN/DT', stats.totalProfit >= 0 ? GREEN : RED, `${margin}% margin`],
            ['Giá Trị Đơn TB (AOV)', aov, 'VNĐ', 'Average Order Value', BLUE, 'AOV'],
            ['Tổng Đơn Hàng', stats.totalOrders, 'Đơn', 'Tất cả trạng thái', 'FF334155', ''],
            ['Đơn Chờ Xử Lý', stats.pendingOrders, 'Đơn', 'Trạng thái PENDING', ORANGE, stats.pendingOrders > 10 ? 'Cần xử lý gấp' : 'Bình thường'],
            ['Đơn Hàng Hôm Nay', stats.todayOrders, 'Đơn', 'Tính đến thời điểm xuất', BLUE, ''],
            ['Tổng Sản Phẩm', stats.totalProducts, 'SP', 'Sản phẩm trong hệ thống', 'FF334155', ''],
            ['Tổng Khách Hàng', stats.totalUsers, 'User', 'Người dùng đã đăng ký', 'FF334155', ''],
            ['Doanh Thu / Khách Hàng', stats.totalUsers > 0 ? Math.round(stats.totalRevenue / stats.totalUsers) : 0, 'VNĐ', 'Revenue per User', BLUE, 'RPU'],
        ];

        kpiData.forEach(([label, val, unit, note, color, evalStr], ri) => {
            const bg = ri % 2 === 0 ? WHITE : STRIPE;
            const r = s1.getRow(6 + ri); r.height = 22;
            const l = r.getCell(1); l.value = label; l.font = fn(true, 10, 'FF1E293B'); l.fill = fl(bg); l.border = bT; l.alignment = { vertical: 'middle' };
            const v = r.getCell(2);
            v.value = typeof val === 'number' ? val : val;
            v.font = fn(true, 11, color); v.fill = fl(bg); v.border = bT; v.alignment = { horizontal: 'right', vertical: 'middle' };
            if (typeof val === 'number' && unit === 'VNĐ') v.numFmt = '#,##0';
            const u = r.getCell(3); u.value = unit; u.font = fn(false, 9, 'FF334155'); u.fill = fl(bg); u.border = bT; u.alignment = { horizontal: 'center', vertical: 'middle' };
            const n = r.getCell(4); n.value = note; n.font = { size: 9, name: 'Calibri', color: { argb: 'FF64748B' }, italic: true }; n.fill = fl(bg); n.border = bT; n.alignment = { vertical: 'middle' };
            const e = r.getCell(5); e.value = evalStr; e.font = fn(false, 9, 'FF334155'); e.fill = fl(bg); e.border = bT; e.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        [32, 22, 10, 36, 18].forEach((w, i) => { s1.getColumn(i + 1).width = w; });
        s1.views = [{ state: 'frozen', ySplit: 5, activeCell: 'A6' }];

        // ── SHEET 2: CHI TIẾT CHI PHÍ ──
        const s2 = wb.addWorksheet('Chi Tiet Chi Phi');

        s2.mergeCells('A1:H1');
        const s2h1 = s2.getCell('A1');
        s2h1.value = 'CÔNG TY TNHH THIẾT BỊ VỆ SINH THÔNG MINH NOVAS';
        s2h1.font = fn(true, 14, GOLD); s2h1.fill = fl(NAVY); s2h1.alignment = { horizontal: 'center', vertical: 'middle' };
        s2.getRow(1).height = 32;

        s2.mergeCells('A2:H2');
        const s2h2 = s2.getCell('A2');
        s2h2.value = `BẢNG CHI TIẾT CHI PHÍ VẬN HÀNH  |  Ngày xuất: ${today}`;
        s2h2.font = fn(true, 11, WHITE); s2h2.fill = fl('FF1E293B'); s2h2.alignment = { horizontal: 'center', vertical: 'middle' };
        s2.getRow(2).height = 22;

        s2.mergeCells('A3:H3');
        const s2h3 = s2.getCell('A3');
        s2h3.value = `Tổng khoản chi: ${dataToExport.length}  |  Tổng chi phí: ${new Intl.NumberFormat('vi-VN').format(grandTotal)} đ`;
        s2h3.font = fn(true, 10, RED); s2h3.fill = fl(LIGHT); s2h3.border = bT; s2h3.alignment = { horizontal: 'center', vertical: 'middle' };
        s2.getRow(3).height = 20;
        s2.getRow(4).height = 8;

        ['STT', 'NGÀY CHI', 'TÊN KHOẢN CHI', 'MÔ TẢ CHI TIẾT', 'PHÂN LOẠI', 'SỐ TIỀN (VNĐ)', 'TỶ LỆ (%)', 'GHI CHÚ'].forEach((hdr, i) => {
            const c = s2.getCell(5, i + 1);
            c.value = hdr; c.font = fn(true, 10, WHITE); c.fill = fl(NAVY);
            c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; c.border = bT;
        });
        s2.getRow(5).height = 24;

        dataToExport.forEach((exp, idx) => {
            const bg = idx % 2 === 0 ? WHITE : STRIPE;
            const pct = grandTotal > 0 ? parseFloat(((exp.amount / grandTotal) * 100).toFixed(2)) : 0;
            const r = s2.getRow(6 + idx); r.height = 20;
            const vals: (string | number)[] = [
                idx + 1, new Date(exp.date).toLocaleDateString('vi-VN'),
                exp.title, exp.description || '',
                EXPENSE_TYPES.find((t: any) => t.value === exp.type)?.label || exp.type,
                exp.amount, pct, '',
            ];
            vals.forEach((val, ci) => {
                const c = r.getCell(ci + 1); c.value = val; c.fill = fl(bg); c.border = bH;
                c.font = fn(false, 10, 'FF1E293B'); c.alignment = { vertical: 'middle' };
            });
            r.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
            r.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
            r.getCell(6).numFmt = '#,##0'; r.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
            r.getCell(6).font = fn(true, 10, RED);
            r.getCell(7).numFmt = '0.00"%"'; r.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
        });

        if (dataToExport.length > 0) {
            const lastR = 5 + dataToExport.length;
            const tr = s2.getRow(lastR + 1); tr.height = 26;
            s2.mergeCells(lastR + 1, 1, lastR + 1, 5);
            const tl = tr.getCell(1); tl.value = 'TỔNG CỘNG'; tl.font = fn(true, 12, GOLD); tl.fill = fl(NAVY); tl.alignment = { horizontal: 'center', vertical: 'middle' }; tl.border = bM;
            const tv = tr.getCell(6); tv.value = { formula: `SUM(F6:F${lastR})` } as any; tv.numFmt = '#,##0'; tv.font = fn(true, 12, GOLD); tv.fill = fl(NAVY); tv.alignment = { horizontal: 'right', vertical: 'middle' }; tv.border = bM;
            const tp = tr.getCell(7); tp.value = '100%'; tp.font = fn(true, 11, GOLD); tp.fill = fl(NAVY); tp.alignment = { horizontal: 'center', vertical: 'middle' }; tp.border = bM;
            const te = tr.getCell(8); te.value = ''; te.fill = fl(NAVY); te.border = bM;
        }

        s2.views = [{ state: 'frozen', ySplit: 5, activeCell: 'A6' }];
        s2.autoFilter = { from: 'A5', to: 'H5' };
        [6, 14, 36, 36, 20, 20, 12, 16].forEach((w, i) => { s2.getColumn(i + 1).width = w; });

        // ── SHEET 3: THỐNG KÊ THEO LOẠI ──
        const s3 = wb.addWorksheet('Thong Ke Theo Loai');

        s3.mergeCells('A1:E1');
        const s3h = s3.getCell('A1');
        s3h.value = 'THỐNG KÊ CHI PHÍ THEO PHÂN LOẠI'; s3h.font = fn(true, 14, GOLD); s3h.fill = fl(NAVY); s3h.alignment = { horizontal: 'center', vertical: 'middle' };
        s3.getRow(1).height = 30;
        s3.mergeCells('A2:E2');
        const s3h2 = s3.getCell('A2');
        s3h2.value = `Ngày xuất: ${today}`; s3h2.font = fn(false, 10, 'FF1E293B'); s3h2.fill = fl(LIGHT); s3h2.alignment = { horizontal: 'center', vertical: 'middle' }; s3h2.border = bT;
        s3.getRow(2).height = 18; s3.getRow(3).height = 10;

        ['PHÂN LOẠI CHI PHÍ', 'SỐ KHOẢN CHI', 'TỔNG SỐ TIỀN (VNĐ)', 'TỶ LỆ (%)', 'XẾP HẠNG'].forEach((hdr, i) => {
            const c = s3.getCell(4, i + 1);
            c.value = hdr; c.font = fn(true, 10, WHITE); c.fill = fl(NAVY);
            c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; c.border = bT;
        });
        s3.getRow(4).height = 24;

        const grouped: Record<string, { count: number; amount: number }> = {};
        dataToExport.forEach((exp: any) => {
            const label = EXPENSE_TYPES.find((t: any) => t.value === exp.type)?.label || exp.type;
            if (!grouped[label]) grouped[label] = { count: 0, amount: 0 };
            grouped[label].count++; grouped[label].amount += exp.amount;
        });
        const totalByType = Object.values(grouped).reduce((a, b) => a + b.amount, 0);
        const sortedTypes = Object.entries(grouped).sort((a, b) => b[1].amount - a[1].amount);

        sortedTypes.forEach(([label, { count, amount }], ri) => {
            const bg = ri % 2 === 0 ? WHITE : STRIPE;
            const pct = totalByType > 0 ? parseFloat(((amount / totalByType) * 100).toFixed(1)) : 0;
            const r = s3.getRow(5 + ri); r.height = 22;
            [label as any, count, amount, pct, ri + 1].forEach((v, ci) => {
                const c = r.getCell(ci + 1); c.value = v; c.fill = fl(bg); c.border = bH; c.font = fn(false, 10, 'FF1E293B'); c.alignment = { vertical: 'middle' };
            });
            r.getCell(1).font = fn(true, 10, 'FF1E293B');
            r.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
            r.getCell(3).numFmt = '#,##0'; r.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' }; r.getCell(3).font = fn(true, 10, RED);
            r.getCell(4).numFmt = '0.0"%"'; r.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
            r.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' }; r.getCell(5).font = fn(true, 11, NAVY);
        });

        if (sortedTypes.length > 0) {
            const last3 = 4 + sortedTypes.length;
            const tr3 = s3.getRow(last3 + 1); tr3.height = 24;
            const totalCount = sortedTypes.reduce((a, [, v]) => a + v.count, 0);
            [['TỔNG CỘNG', WHITE, NAVY, 'center'] as any, [totalCount, WHITE, NAVY, 'center'], [totalByType, WHITE, NAVY, 'right'], ['100%', WHITE, NAVY, 'center'], ['—', WHITE, NAVY, 'center']].forEach(([v, fg, bg, align], ci) => {
                const c = tr3.getCell(ci + 1); c.value = v; c.font = fn(true, 11, fg); c.fill = fl(bg); c.border = bM; c.alignment = { horizontal: align as any, vertical: 'middle' };
            });
            tr3.getCell(3).numFmt = '#,##0';
        }
        [30, 14, 24, 14, 12].forEach((w, i) => { s3.getColumn(i + 1).width = w; });

        // ── SHEET 4: PHÂN TÍCH TÀI CHÍNH ──
        const s4 = wb.addWorksheet('Phan Tich Tai Chinh');

        s4.mergeCells('A1:D1');
        const s4h = s4.getCell('A1');
        s4h.value = 'PHÂN TÍCH TÀI CHÍNH TOÀN DIỆN - NOVAS'; s4h.font = fn(true, 14, GOLD); s4h.fill = fl(NAVY); s4h.alignment = { horizontal: 'center', vertical: 'middle' };
        s4.getRow(1).height = 30;
        s4.mergeCells('A2:D2');
        const s4h2 = s4.getCell('A2');
        s4h2.value = `Báo cáo tài chính tổng hợp | Ngày xuất: ${todayFull}`; s4h2.font = fn(false, 10, WHITE); s4h2.fill = fl('FF1E293B'); s4h2.alignment = { horizontal: 'center', vertical: 'middle' };
        s4.getRow(2).height = 20;

        const sections: { title: string; color: string; rows: (string | number)[][] }[] = [
            { title: 'I. DOANH THU & LỢI NHUẬN', color: BLUE, rows: [
                ['Tổng Doanh Thu', stats.totalRevenue, 'VNĐ', '= Tổng đơn đã thanh toán'],
                ['Tổng Chi Phí Vận Hành', stats.totalExpenses, 'VNĐ', '= Tổng các khoản chi'],
                ['Lợi Nhuận Ròng (Net Profit)', stats.totalProfit, 'VNĐ', '= Doanh Thu − Chi Phí'],
                ['Biên Lợi Nhuận (Net Margin)', parseFloat(margin), '%', `= ${margin}% (LN / DT × 100)`],
            ]},
            { title: 'II. HIỆU SUẤT ĐƠN HÀNG', color: ORANGE, rows: [
                ['Tổng Số Đơn Hàng', stats.totalOrders, 'Đơn', 'Tất cả trạng thái'],
                ['Đơn Hàng Chờ Xử Lý', stats.pendingOrders, 'Đơn', 'Trạng thái PENDING'],
                ['Đơn Hàng Trong Ngày', stats.todayOrders, 'Đơn', 'Tính đến thời điểm xuất'],
                ['Giá Trị Đơn TB (AOV)', aov, 'VNĐ', 'Average Order Value'],
            ]},
            { title: 'III. KHO & KHÁCH HÀNG', color: GREEN, rows: [
                ['Tổng Số Sản Phẩm', stats.totalProducts, 'SP', 'Sản phẩm trong hệ thống'],
                ['Tổng Khách Hàng Đăng Ký', stats.totalUsers, 'User', 'Tài khoản đã đăng ký'],
                ['Doanh Thu / Khách Hàng (RPU)', stats.totalUsers > 0 ? Math.round(stats.totalRevenue / stats.totalUsers) : 0, 'VNĐ', 'Revenue per User'],
            ]},
            { title: 'IV. CHI PHÍ THEO LOẠI', color: RED, rows: sortedTypes.map(([label, { count, amount }]) => [label, amount, 'VNĐ', `${count} khoản chi`]) },
        ];

        let curRow = 4;
        sections.forEach(({ title, color, rows }) => {
            s4.mergeCells(`A${curRow}:D${curRow}`);
            const sh = s4.getCell(`A${curRow}`);
            sh.value = title; sh.font = fn(true, 11, WHITE); sh.fill = fl(color); sh.alignment = { horizontal: 'left', vertical: 'middle' }; sh.border = bM;
            s4.getRow(curRow).height = 24; curRow++;

            ['CHỈ TIÊU', 'GIÁ TRỊ', 'ĐƠN VỊ', 'GHI CHÚ'].forEach((hdr, i) => {
                const c = s4.getCell(curRow, i + 1);
                c.value = hdr; c.font = fn(true, 10, WHITE); c.fill = fl('FF1E293B'); c.alignment = { horizontal: 'center', vertical: 'middle' }; c.border = bT;
            });
            s4.getRow(curRow).height = 20; curRow++;

            rows.forEach(([label, val, unit, note], ri) => {
                const bg = ri % 2 === 0 ? WHITE : STRIPE;
                const r = s4.getRow(curRow); r.height = 20;
                const lc = r.getCell(1); lc.value = label; lc.font = fn(true, 10, 'FF1E293B'); lc.fill = fl(bg); lc.border = bT; lc.alignment = { vertical: 'middle' };
                const vc = r.getCell(2); vc.value = val as any; vc.font = fn(true, 10, color); vc.fill = fl(bg); vc.border = bT; vc.alignment = { horizontal: 'right', vertical: 'middle' };
                if (typeof val === 'number' && unit === 'VNĐ') vc.numFmt = '#,##0';
                if (unit === '%') vc.numFmt = '0.0"%"';
                const uc = r.getCell(3); uc.value = unit; uc.font = fn(false, 9, 'FF334155'); uc.fill = fl(bg); uc.border = bT; uc.alignment = { horizontal: 'center', vertical: 'middle' };
                const nc = r.getCell(4); nc.value = note; nc.font = { size: 9, name: 'Calibri', color: { argb: 'FF64748B' }, italic: true }; nc.fill = fl(bg); nc.border = bT; nc.alignment = { vertical: 'middle' };
                curRow++;
            });
            s4.getRow(curRow).height = 8; curRow++;
        });

        [32, 22, 10, 38].forEach((w, i) => { s4.getColumn(i + 1).width = w; });
        s4.views = [{ state: 'frozen', ySplit: 3, activeCell: 'A4' }];

        // ── XUẤT FILE ──
        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeTime = reportTime.replace(/\//g, '_').replace(/ /g, '_');
        a.download = `Bao_Cao_Tai_Chinh_${safeTime}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        try {
            const wb2 = new ExcelJS.Workbook();
            const arrayBuffer = await file.arrayBuffer();
            await wb2.xlsx.load(arrayBuffer);
            
            let ws = wb2.getWorksheet('Chi Tiet Chi Phi') || wb2.worksheets[0];
            if (!ws) { alert('Không đọc được dữ liệu từ file.'); return; }
            
            const formatted: any[] = [];
            ws.eachRow((row, rowNumber) => {
                if (rowNumber < 5) return;
                
                const sttValue = row.getCell(1).value;
                const stt = typeof sttValue === 'object' ? (sttValue as any)?.result : sttValue;
                if (isNaN(Number(stt)) || stt === null || stt === '') return;

                const title = String(row.getCell(3).value || '').trim();
                const amountRaw = row.getCell(6).value;
                
                let amount = 0;
                if (typeof amountRaw === 'number') amount = amountRaw;
                else if (typeof amountRaw === 'object' && amountRaw !== null) amount = Number((amountRaw as any).result || 0);
                else amount = parseFloat(String(amountRaw || '0').replace(/[^0-9.-]/g, ''));
                
                if (!title || isNaN(amount) || amount <= 0) return;

                const dateRaw = row.getCell(2).value;
                let expenseDate = new Date();
                if (dateRaw instanceof Date) {
                    expenseDate = dateRaw;
                } else if (typeof dateRaw === 'string') {
                    const pts = dateRaw.split('/');
                    if (pts.length === 3) expenseDate = new Date(Number(pts[2]), Number(pts[1]) - 1, Number(pts[0]));
                }
                
                const typeRaw = String(row.getCell(5).value || '').toUpperCase();
                formatted.push({
                    title,
                    amount,
                    type: typeRaw.includes('NHẬP') ? 'IMPORT' : 
                          typeRaw.includes('LƯƠNG') ? 'SALARY' :
                          typeRaw.includes('MARKETING') ? 'MARKETING' :
                          typeRaw.includes('MẶT BẰNG') ? 'RENT' : 'OTHER',
                    date: expenseDate.toISOString(),
                    description: String(row.getCell(4).value || ''),
                });
            });

            if (formatted.length === 0) { 
                alert('Không tìm thấy dữ liệu hợp lệ. Dữ liệu phải nằm trong Sheet "Chi Tiet Chi Phi" từ dòng 6.'); 
                return; 
            }
            
            const res = await fetch(`${API_URL}/api/expenses/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(formatted)
            });

            if (res.ok) { 
                alert(`Import thành công ${formatted.length} khoản chi!`); 
                fetchExpenses(); 
                fetchData(); 
            } else {
                const err = await res.json().catch(() => ({}));
                alert(`Lỗi import: ${err.message || 'Lỗi server'}`);
            }
        } catch (err: any) { alert(`Lỗi đọc file Excel: ${err.message || 'Lỗi định dạng'}`); }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            {/* Header + Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        Dashboard <span className="text-[10px] font-normal bg-slate-100 px-1.5 py-0.5 rounded text-slate-400">v{APP_VERSION}</span>
                    </h1>
                    <p className="text-sm text-slate-500">Tổng quan hoạt động kinh doanh</p>
                </div>
                <div className="flex border border-slate-200 bg-white rounded overflow-hidden self-start">
                    <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                        Tổng quan
                    </button>
                    <button onClick={() => setActiveTab('expenses')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'expenses' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                        Thu - Chi
                    </button>
                </div>
            </div>

            {/* Stats Grid - luôn hiển thị */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                    { label: 'Đơn hôm nay', value: stats.todayOrders, color: 'text-orange-600', isNum: true },
                    { label: 'Sản phẩm', value: stats.totalProducts, color: '', isNum: true },
                    { label: 'Tổng đơn', value: stats.totalOrders, color: '', isNum: true },
                    { label: 'Người dùng', value: stats.totalUsers, color: '', isNum: true },
                    { label: 'Doanh thu', value: fmt(stats.totalRevenue), color: 'text-blue-700', isNum: false },
                    { label: 'Chi phí', value: fmt(stats.totalExpenses), color: 'text-red-600', isNum: false },
                    { label: 'Lợi nhuận', value: fmt(stats.totalProfit), color: stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-700', isNum: false },
                ].map((s, i) => (
                    <div key={i} className="border border-slate-200 bg-white p-3 rounded">
                        <p className="text-xs text-slate-500">{s.label}</p>
                        <p className={`font-bold mt-1 truncate ${s.isNum ? 'text-2xl' : 'text-sm'} ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {activeTab === 'overview' && (
                <div className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 border border-slate-200 bg-white p-4 rounded">
                            <div className="flex flex-col gap-3 mb-4">
                                <h2 className="font-medium">Biểu đồ Doanh thu</h2>
                                <div className="flex flex-wrap gap-2 items-center">
                                    <div className="flex gap-1">
                                        {[7, 14, 30, 90].map(d => (
                                            <button key={d} onClick={() => { setFilterType('days'); setDays(d); }}
                                                className={`px-3 py-1 text-xs border rounded ${filterType === 'days' && days === d ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200'}`}>
                                                {d} ngày
                                            </button>
                                        ))}
                                    </div>
                                    <span className="text-slate-300">|</span>
                                    <div className="flex gap-2">
                                        <select value={selectedMonth} onChange={(e) => { setFilterType('month'); setSelectedMonth(parseInt(e.target.value)); }}
                                            className={`px-2 py-1 border text-xs rounded ${filterType === 'month' ? 'border-slate-900' : 'border-slate-200'}`}>
                                            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                        </select>
                                        <select value={selectedYear} onChange={(e) => { setFilterType('month'); setSelectedYear(parseInt(e.target.value)); }}
                                            className={`px-2 py-1 border text-xs rounded ${filterType === 'month' ? 'border-slate-900' : 'border-slate-200'}`}>
                                            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
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
                                        <Tooltip formatter={(value, name) => [name === 'revenue' ? fmt(Number(value)) : value, name === 'revenue' ? 'Doanh thu' : 'Số đơn']} />
                                        <Legend formatter={(v) => v === 'revenue' ? 'Doanh thu' : 'Số đơn'} />
                                        <Bar dataKey="revenue" fill="#3b82f6" />
                                        <Bar dataKey="orders" fill="#10b981" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="border border-slate-200 bg-white p-4 rounded">
                            <h2 className="font-medium mb-4">Trạng thái đơn hàng</h2>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                                            {statusData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Top Products Section */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="border border-slate-200 bg-white p-4 rounded">
                            <h2 className="font-medium mb-4">Sản phẩm bán chạy (Doanh thu)</h2>
                            <div className="space-y-4">
                                {topProducts.length === 0 ? (
                                    <p className="text-sm text-slate-500 py-10 text-center">Chưa có dữ liệu bán hàng</p>
                                ) : topProducts.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">
                                                {i + 1}
                                            </div>
                                            <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0 ml-4">
                                            <p className="text-sm font-bold text-[#21246b]">{fmt(p.revenue)}</p>
                                            <p className="text-[10px] text-slate-500">{p.quantity} sản phẩm</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="border border-slate-200 bg-white p-4 rounded flex flex-col justify-center items-center text-center">
                            <div className="p-6 bg-slate-50 rounded-full mb-4">
                                <BarChart3 className="w-10 h-10 text-slate-400" />
                            </div>
                            <h3 className="font-medium text-slate-900 mb-1">Phân tích chuyên sâu</h3>
                            <p className="text-sm text-slate-500 max-w-xs">
                                Sử dụng tính năng Xuất Excel để xem báo cáo chi tiết về hiệu suất kinh doanh và quản lý tài chính.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: THU - CHI */}
            {activeTab === 'expenses' && (
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Form thêm chi phí */}
                    <div className="md:col-span-1">
                        <div className="bg-white border border-slate-200 p-4 rounded shadow-sm">
                            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <Plus className={`w-5 h-5 ${editingExpense ? 'text-blue-600' : 'text-[#21246b]'}`} /> 
                                {editingExpense ? 'Chỉnh sửa khoản chi' : 'Thêm khoản chi mới'}
                            </h2>
                            <form onSubmit={handleAddExpense} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Tên khoản chi *</label>
                                    <input required type="text" value={title} onChange={e => setTitle(e.target.value)}
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm" placeholder="VD: Nhập bồn cầu Inax..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Số tiền (VNĐ) *</label>
                                    <input required type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)}
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm" placeholder="0" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Loại</label>
                                        <select value={type} onChange={e => setType(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                                            {EXPENSE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Ngày chi</label>
                                        <input type="date" value={date} onChange={e => setDate(e.target.value)}
                                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Ghi chú</label>
                                    <textarea value={description} onChange={e => setDescription(e.target.value)}
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm h-16" placeholder="Chi tiết..." />
                                </div>
                                <div className="flex gap-2">
                                    {editingExpense && (
                                        <button type="button" onClick={() => { setEditingExpense(null); setTitle(''); setAmount(''); setDescription(''); }}
                                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 rounded text-sm">
                                            Hủy
                                        </button>
                                    )}
                                    <button type="submit" disabled={isSubmitting}
                                        className={`flex-[2] text-white font-medium py-2 rounded text-sm flex items-center justify-center ${editingExpense ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#21246b] hover:bg-blue-800'}`}>
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingExpense ? 'Cập nhật' : 'Lưu lại')}
                                    </button>
                                </div>
                            </form>
                            
                            {/* Expense Distribution Chart */}
                            {expenseTypeStats.length > 0 && (
                                <div className="mt-8 pt-6 border-t">
                                    <h3 className="text-sm font-semibold text-slate-800 mb-4">Cơ cấu chi phí</h3>
                                    <div className="h-48">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={expenseTypeStats} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">
                                                    {expenseTypeStats.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip formatter={(val) => fmt(Number(val))} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-2 space-y-1">
                                        {expenseTypeStats.map((s, i) => (
                                            <div key={i} className="flex items-center justify-between text-[10px]">
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                    <span className="text-slate-600">{s.name}</span>
                                                </div>
                                                <span className="font-medium">{((s.value / stats.totalExpenses) * 100).toFixed(1)}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            <div className="mt-6 pt-6 border-t flex flex-col gap-2">
                                <button onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                                    <Upload className="w-4 h-4" /> Import từ Excel
                                </button>
                                <input type="file" accept=".xlsx,.xls,.csv" ref={fileInputRef} onChange={handleImport} className="hidden" />
                                <button onClick={handleExport}
                                    className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-slate-700 text-white text-sm rounded hover:bg-slate-800">
                                    <Download className="w-4 h-4" /> Xuất Excel
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Danh sách chi phí */}
                    <div className="md:col-span-2 space-y-4">
                        {/* Search and Filter */}
                        <div className="bg-white border border-slate-200 p-3 rounded shadow-sm flex flex-col gap-3">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1">
                                    <input type="text" placeholder="Tìm kiếm khoản chi..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none" />
                                </div>
                                <div className="w-full sm:w-48">
                                    <select value={filterExpType} onChange={e => setFilterExpType(e.target.value)}
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                                        <option value="ALL">Tất cả loại</option>
                                        {EXPENSE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 border-t pt-3">
                                <span className="text-xs font-medium text-slate-500">Xem dữ liệu:</span>
                                <select value={expMonth} onChange={e => setExpMonth(parseInt(e.target.value))}
                                    className="border border-slate-300 rounded px-2 py-1 text-xs outline-none">
                                    {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                </select>
                                <select value={expYear} onChange={e => setExpYear(parseInt(e.target.value))}
                                    className="border border-slate-300 rounded px-2 py-1 text-xs outline-none">
                                    {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                                <div className="ml-auto text-xs font-bold text-slate-700">
                                    Tổng chi {months[expMonth]}: <span className="text-red-600">{new Intl.NumberFormat('vi-VN').format(totalFilteredExpenses)}đ</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-medium text-slate-500">
                                            <th className="px-4 py-3">Ngày</th>
                                            <th className="px-4 py-3">Khoản chi</th>
                                            <th className="px-4 py-3">Loại</th>
                                            <th className="px-4 py-3 text-right">Số tiền</th>
                                            <th className="px-4 py-3 text-center">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expLoading ? (
                                            <tr><td colSpan={5} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
                                        ) : filteredExpenses.length === 0 ? (
                                            <tr><td colSpan={5} className="text-center py-8 text-slate-500 text-sm">Không tìm thấy dữ liệu phù hợp.</td></tr>
                                        ) : filteredExpenses.map(exp => (
                                            <tr key={exp.id} className={`border-b border-slate-100 hover:bg-slate-50 ${editingExpense?.id === exp.id ? 'bg-blue-50' : ''}`}>
                                                <td className="px-4 py-3 text-sm text-slate-500">{new Date(exp.date).toLocaleDateString('vi-VN')}</td>
                                                <td className="px-4 py-3">
                                                    <p className="text-sm font-medium text-slate-800">{exp.title}</p>
                                                    {exp.description && <p className="text-xs text-slate-400 truncate max-w-xs">{exp.description}</p>}
                                                </td>
                                                <td className="px-4 py-3 text-xs">
                                                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded">{EXPENSE_TYPES.find(t => t.value === exp.type)?.label || exp.type}</span>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-semibold text-red-600 text-right whitespace-nowrap">
                                                    -{new Intl.NumberFormat('vi-VN').format(exp.amount)}đ
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => handleEditClick(exp)} className="text-slate-400 hover:text-blue-600 transition-colors">
                                                            <Plus className="w-4 h-4 rotate-45 hidden" /> {/* dummy to use icon if needed */}
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                        </button>
                                                        <button onClick={() => handleDeleteExpense(exp.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
