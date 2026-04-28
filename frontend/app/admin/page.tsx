"use client";
import { API_URL } from '@/config';
import { Loader2, Plus, Trash2, Download, Upload } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import ExcelJS from 'exceljs';

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
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
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

            const paidOrders = ordersArray.filter((o: Order) => o.status === 'Đã thanh toán' || o.status === 'Hoàn thành' || o.status === 'Đã giao');
            const totalRevenue = paidOrders.reduce((s: number, o: Order) => s + o.total, 0);
            const todayStr = new Date().toISOString().split('T')[0];
            const totalExpenses = expArray.reduce((s: number, e: any) => s + e.amount, 0);

            setStats({
                totalProducts: products.length, totalOrders: ordersArray.length,
                totalRevenue, totalExpenses, totalProfit: totalRevenue - totalExpenses,
                totalUsers: usersArray.length,
                pendingOrders: ordersArray.filter((o: Order) => o.status === 'PENDING').length,
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
                        revenue: dayOrders.filter((o: Order) => o.status === 'PAID').reduce((s: number, o: Order) => s + o.total, 0),
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
                        revenue: dayOrders.filter((o: Order) => o.status === 'PAID').reduce((s: number, o: Order) => s + o.total, 0),
                        orders: dayOrders.length
                    });
                }
            }
            setRevenueData(chartData);
            setStatusData([
                { name: 'Đã thanh toán', value: ordersArray.filter((o: Order) => o.status === 'PAID').length },
                { name: 'Chờ thanh toán', value: ordersArray.filter((o: Order) => o.status === 'PENDING').length },
                { name: 'Đã hủy', value: ordersArray.filter((o: Order) => o.status === 'CANCELLED').length },
            ]);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/api/expenses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ title, amount: parseFloat(amount), type, date: new Date(date).toISOString(), description })
            });
            if (res.ok) { setTitle(''); setAmount(''); setDescription(''); fetchExpenses(); fetchData(); }
            else alert('Có lỗi xảy ra');
        } catch (e) { console.error(e); } finally { setIsSubmitting(false); }
    };

    const handleDeleteExpense = async (id: number) => {
        if (!confirm('Xóa khoản chi này?')) return;
        try {
            await fetch(`${API_URL}/api/expenses/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
            fetchExpenses(); fetchData();
        } catch (e) { console.error(e); }
    };

    const handleExport = async () => {
        let dataToExport = expenses;
        if (dataToExport.length === 0) {
            try {
                const res = await fetch(`${API_URL}/api/expenses`, { headers: getAuthHeaders() });
                if (res.ok) dataToExport = await res.json();
            } catch (e) { console.error(e); }
        }

        const wb = new ExcelJS.Workbook();
        wb.creator = 'NOVAS Admin';
        wb.created = new Date();
        const today = new Date().toLocaleDateString('vi-VN');

        const NAVY = 'FF21246B', WHITE = 'FFFFFFFF', GOLD = 'FFFFD700';
        const LIGHT = 'FFF0F4FF', GRAY = 'FFE2E8F0';
        const thin = { style: 'thin' as const };
        const hair = { style: 'hair' as const };
        const medium = { style: 'medium' as const };
        const bThin = { top: thin, bottom: thin, left: thin, right: thin };
        const bHair = { top: hair, bottom: hair, left: hair, right: hair };
        const bMed  = { top: medium, bottom: medium, left: medium, right: medium };

        // ══════════════════════════════════════
        // SHEET 1: BÁO CÁO CHI TIẾT
        // ══════════════════════════════════════
        const s1 = wb.addWorksheet('Báo Cáo Thu Chi');

        // --- Dòng 1: Tên công ty ---
        s1.mergeCells('A1:H1');
        const c1 = s1.getCell('A1');
        c1.value = 'CÔNG TY TNHH THIẾT BỊ VỆ SINH THÔNG MINH NOVAS';
        c1.font = { bold: true, size: 14, color: { argb: NAVY }, name: 'Calibri' };
        c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT } };
        c1.alignment = { horizontal: 'center', vertical: 'middle' };
        s1.getRow(1).height = 30;

        // --- Dòng 2: Tên báo cáo ---
        s1.mergeCells('A2:H2');
        const c2 = s1.getCell('A2');
        c2.value = `BÁO CÁO THU - CHI  |  Ngày xuất: ${today}`;
        c2.font = { bold: true, size: 12, color: { argb: WHITE }, name: 'Calibri' };
        c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
        c2.alignment = { horizontal: 'center', vertical: 'middle' };
        s1.getRow(2).height = 24;
        s1.getRow(3).height = 8;

        // --- Dòng 4: Header bảng tóm tắt ---
        (['CHỈ TIÊU', 'GIÁ TRỊ (VNĐ)'] as string[]).forEach((h, i) => {
            const c = s1.getCell(4, i + 1);
            c.value = h;
            c.font = { bold: true, color: { argb: WHITE }, name: 'Calibri' };
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
            c.alignment = { horizontal: 'center', vertical: 'middle' };
            c.border = bThin;
        });
        s1.getRow(4).height = 20;

        // --- Dòng 5-7: Dữ liệu tóm tắt ---
        const summaryRows: [string, number, string][] = [
            ['Tổng Doanh Thu (đơn đã thanh toán)', stats.totalRevenue, '00000000'],
            ['Tổng Chi Phí', stats.totalExpenses, '00000000'],
            ['Lợi Nhuận Ròng', stats.totalProfit, stats.totalProfit >= 0 ? 'FF16A34A' : 'FFDC2626'],
        ];
        summaryRows.forEach(([label, val, color], ri) => {
            const isProfit = ri === 2;
            const labelC = s1.getCell(5 + ri, 1);
            const valC   = s1.getCell(5 + ri, 2);
            labelC.value = label;
            valC.value   = val;
            [labelC, valC].forEach(c => {
                c.font   = { bold: isProfit, size: 11, color: { argb: color }, name: 'Calibri' };
                c.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: isProfit ? LIGHT : WHITE } };
                c.border = bThin;
            });
            valC.numFmt = '#,##0';
            valC.alignment = { horizontal: 'right', vertical: 'middle' };
            s1.getRow(5 + ri).height = 20;
        });
        s1.getRow(8).height = 10;

        // --- Cấu hình độ rộng cột ---
        const colDefs = [
            { width: 7  }, { width: 14 }, { width: 36 },
            { width: 36 }, { width: 22 }, { width: 20 },
            { width: 20 }, { width: 18 },
        ];
        colDefs.forEach((c, i) => { s1.getColumn(i + 1).width = c.width; });
        s1.getColumn(1).width = 40;
        s1.getColumn(2).width = 22;

        // --- Dòng 9: Headers bảng chi tiết ---
        const headers = ['STT', 'NGÀY CHI', 'TÊN KHOẢN CHI', 'MÔ TẢ CHI TIẾT', 'PHÂN LOẠI', 'SỐ TIỀN (VNĐ)', 'NGÀY NHẬP HỆ THỐNG', 'GHI CHÚ'];
        const hRow = s1.getRow(9);
        headers.forEach((h, i) => {
            const c = hRow.getCell(i + 1);
            c.value = h;
            c.font      = { bold: true, color: { argb: WHITE }, size: 10, name: 'Calibri' };
            c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
            c.alignment = { horizontal: 'center', vertical: 'middle' };
            c.border    = bThin;
        });
        hRow.height = 22;

        // --- Dòng 10+: Dữ liệu chi tiết ---
        dataToExport.forEach((exp, idx) => {
            const r = s1.getRow(10 + idx);
            const bg = idx % 2 === 0 ? WHITE : LIGHT;
            const vals: (string | number)[] = [
                idx + 1,
                new Date(exp.date).toLocaleDateString('vi-VN'),
                exp.title,
                exp.description || '',
                EXPENSE_TYPES.find(t => t.value === exp.type)?.label || exp.type,
                exp.amount,
                new Date((exp as any).createdAt || exp.date).toLocaleDateString('vi-VN'),
                '',
            ];
            vals.forEach((v, ci) => {
                const c = r.getCell(ci + 1);
                c.value  = v;
                c.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
                c.border = bHair;
                c.font   = { size: 10, name: 'Calibri' };
                c.alignment = { vertical: 'middle' };
            });
            r.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
            r.getCell(6).numFmt    = '#,##0';
            r.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
            r.height = 20;
        });

        // --- Dòng tổng cộng ---
        if (dataToExport.length > 0) {
            const lastDataRow = 9 + dataToExport.length;
            const tRow = s1.getRow(lastDataRow + 1);
            tRow.getCell(5).value = 'TỔNG CHI PHÍ';
            tRow.getCell(6).value = { formula: `SUM(F10:F${lastDataRow})` } as any;
            [5, 6].forEach(ci => {
                const c = tRow.getCell(ci);
                c.font      = { bold: true, size: 11, color: { argb: NAVY }, name: 'Calibri' };
                c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: GOLD } };
                c.alignment = { horizontal: ci === 5 ? 'center' : 'right', vertical: 'middle' };
                c.border    = bMed;
            });
            tRow.getCell(6).numFmt = '#,##0';
            tRow.height = 24;
        }

        s1.views = [{ state: 'frozen', ySplit: 9, xSplit: 0, activeCell: 'A10' }];

        // ══════════════════════════════════════
        // SHEET 2: THỐNG KÊ THEO LOẠI
        // ══════════════════════════════════════
        const s2 = wb.addWorksheet('Thống Kê Theo Loại');

        s2.mergeCells('A1:C1');
        const s2h = s2.getCell('A1');
        s2h.value = 'THỐNG KÊ CHI PHÍ THEO LOẠI';
        s2h.font      = { bold: true, size: 13, color: { argb: WHITE }, name: 'Calibri' };
        s2h.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
        s2h.alignment = { horizontal: 'center', vertical: 'middle' };
        s2.getRow(1).height = 28;

        (['PHÂN LOẠI', 'TỔNG SỐ TIỀN (VNĐ)', 'TỶ LỆ (%)'] as string[]).forEach((h, i) => {
            const c = s2.getCell(2, i + 1);
            c.value = h;
            c.font      = { bold: true, color: { argb: NAVY }, name: 'Calibri' };
            c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRAY } };
            c.alignment = { horizontal: 'center', vertical: 'middle' };
            c.border    = bThin;
        });
        s2.getRow(2).height = 20;

        const grouped: Record<string, number> = {};
        dataToExport.forEach(exp => {
            const label = EXPENSE_TYPES.find(t => t.value === exp.type)?.label || exp.type;
            grouped[label] = (grouped[label] || 0) + exp.amount;
        });
        const grandTotal = Object.values(grouped).reduce((a, b) => a + b, 0);

        Object.entries(grouped).sort((a, b) => b[1] - a[1]).forEach(([label, amt], ri) => {
            const bg = ri % 2 === 0 ? WHITE : LIGHT;
            const pct = grandTotal > 0 ? parseFloat(((amt / grandTotal) * 100).toFixed(1)) : 0;
            [label, amt, pct].forEach((v, ci) => {
                const c = s2.getCell(3 + ri, ci + 1);
                c.value  = v;
                c.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
                c.border = bHair;
                c.font   = { size: 10, name: 'Calibri' };
                if (ci === 1) { c.numFmt = '#,##0'; c.alignment = { horizontal: 'right' }; }
                if (ci === 2) { c.numFmt = '0.0"%"'; c.alignment = { horizontal: 'center' }; }
            });
            s2.getRow(3 + ri).height = 20;
        });

        const len = Object.keys(grouped).length;
        const tRow2 = s2.getRow(3 + len);
        [('TỔNG CỘNG' as string | number), grandTotal, 100].forEach((v, ci) => {
            const c = tRow2.getCell(ci + 1);
            c.value  = v;
            c.font   = { bold: true, color: { argb: NAVY }, name: 'Calibri' };
            c.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: GOLD } };
            c.border = bMed;
            c.alignment = { horizontal: ci === 0 ? 'center' : 'right', vertical: 'middle' };
            if (ci === 1) c.numFmt = '#,##0';
            if (ci === 2) c.numFmt = '0.0"%"';
        });
        tRow2.height = 22;
        s2.getColumn(1).width = 28;
        s2.getColumn(2).width = 22;
        s2.getColumn(3).width = 14;

        // ══════════════════════════════════════
        // Xuất file
        // ══════════════════════════════════════
        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BaoCao_ThuChi_NOVAS_${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const wb = XLSX.read(evt.target?.result, { type: 'binary' });
                const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                const formatted = (data as any[]).map(row => ({
                    title: row['Tên khoản chi'] || row['title'] || 'Chi phí từ Excel',
                    amount: parseFloat(row['Số tiền'] || row['Số tiền (VNĐ)'] || row['amount'] || 0),
                    type: row['type'] || 'OTHER',
                    date: new Date().toISOString(),
                    description: row['Ghi chú'] || ''
                }));
                const res = await fetch(`${API_URL}/api/expenses/bulk`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                    body: JSON.stringify(formatted)
                });
                if (res.ok) { alert('Import thành công!'); fetchExpenses(); fetchData(); }
                else alert('Lỗi import.');
            } catch { alert('Lỗi đọc file Excel.'); }
        };
        reader.readAsBinaryString(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
    const months = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

    if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            {/* Header + Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
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

            {/* TAB: TỔNG QUAN */}
            {activeTab === 'overview' && (
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
            )}

            {/* TAB: THU - CHI */}
            {activeTab === 'expenses' && (
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Form thêm chi phí */}
                    <div className="md:col-span-1">
                        <div className="bg-white border border-slate-200 p-4 rounded shadow-sm">
                            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-[#21246b]" /> Thêm khoản chi mới
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
                                <button type="submit" disabled={isSubmitting}
                                    className="w-full bg-[#21246b] hover:bg-blue-800 text-white font-medium py-2 rounded text-sm flex items-center justify-center">
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu lại'}
                                </button>
                            </form>
                            <div className="mt-4 pt-4 border-t flex flex-col gap-2">
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
                    <div className="md:col-span-2">
                        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-medium text-slate-500">
                                            <th className="px-4 py-3">Ngày</th>
                                            <th className="px-4 py-3">Khoản chi</th>
                                            <th className="px-4 py-3">Loại</th>
                                            <th className="px-4 py-3 text-right">Số tiền</th>
                                            <th className="px-4 py-3 text-center">Xóa</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expLoading ? (
                                            <tr><td colSpan={5} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
                                        ) : expenses.length === 0 ? (
                                            <tr><td colSpan={5} className="text-center py-8 text-slate-500 text-sm">Chưa có dữ liệu. Thêm mới hoặc Import từ Excel.</td></tr>
                                        ) : expenses.map(exp => (
                                            <tr key={exp.id} className="border-b border-slate-100 hover:bg-slate-50">
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
                                                    <button onClick={() => handleDeleteExpense(exp.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
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
