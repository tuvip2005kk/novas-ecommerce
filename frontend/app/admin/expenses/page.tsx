"use client";
import { API_URL } from '@/config';
import { useState, useEffect, useRef } from "react";
import { Loader2, Plus, Trash2, Download, Upload } from "lucide-react";
import * as XLSX from 'xlsx';

interface Expense {
    id: number;
    title: string;
    amount: number;
    type: string;
    date: string;
    description: string;
    createdAt: string;
}

const EXPENSE_TYPES = [
    { value: 'IMPORT', label: 'Nhập hàng' },
    { value: 'SALARY', label: 'Lương nhân viên' },
    { value: 'MARKETING', label: 'Marketing/Quảng cáo' },
    { value: 'RENT', label: 'Mặt bằng/Điện nước' },
    { value: 'OTHER', label: 'Khác' }
];

export default function ExpensesAdmin() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form states
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('OTHER');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            const token = localStorage.getItem('novas_admin_token');
            const res = await fetch(`${API_URL}/api/expenses`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setExpenses(data);
            }
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('novas_admin_token');
            const res = await fetch(`${API_URL}/api/expenses`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    title,
                    amount: parseFloat(amount),
                    type,
                    date: new Date(date).toISOString(),
                    description
                })
            });

            if (res.ok) {
                alert('Thêm chi phí thành công');
                setTitle('');
                setAmount('');
                setDescription('');
                fetchExpenses();
            } else {
                alert('Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bạn có chắc muốn xóa khoản chi này?')) return;
        try {
            const token = localStorage.getItem('novas_admin_token');
            const res = await fetch(`${API_URL}/api/expenses/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchExpenses();
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleExportExcel = () => {
        const dataToExport = expenses.map(exp => ({
            'ID': exp.id,
            'Tên khoản chi': exp.title,
            'Số tiền (VNĐ)': exp.amount,
            'Phân loại': EXPENSE_TYPES.find(t => t.value === exp.type)?.label || exp.type,
            'Ngày chi': new Date(exp.date).toLocaleDateString('vi-VN'),
            'Ghi chú': exp.description || ''
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "ChiPhi");
        XLSX.writeFile(wb, `Thong_Ke_Chi_Phi_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (!Array.isArray(data) || data.length === 0) {
                    alert("File không có dữ liệu hợp lệ.");
                    return;
                }

                // Chuyển đổi dữ liệu Excel sang mảng object cho backend
                const formattedData = data.map((row: any) => ({
                    title: row['Tên khoản chi'] || row['title'] || 'Chi phí từ Excel',
                    amount: parseFloat(row['Số tiền'] || row['amount'] || 0),
                    type: row['Phân loại'] || row['type'] || 'OTHER',
                    date: row['Ngày'] ? new Date(row['Ngày']).toISOString() : new Date().toISOString(),
                    description: row['Ghi chú'] || row['description'] || ''
                }));

                const token = localStorage.getItem('novas_admin_token');
                const res = await fetch(`${API_URL}/api/expenses/bulk`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify(formattedData)
                });

                if (res.ok) {
                    alert('Đã import thành công dữ liệu từ Excel!');
                    fetchExpenses();
                } else {
                    alert('Lỗi import dữ liệu.');
                }
            } catch (error) {
                console.error("Lỗi đọc file excel", error);
                alert('Có lỗi khi đọc file Excel. Vui lòng kiểm tra lại định dạng.');
            }
        };
        reader.readAsBinaryString(file);
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Quản lý Thu - Chi</h1>
                    <p className="text-sm text-slate-500 font-normal">Quản lý các khoản chi phí và tính lợi nhuận</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors"
                    >
                        <Upload className="w-4 h-4" /> Import Excel
                    </button>
                    <input 
                        type="file" 
                        accept=".xlsx, .xls, .csv" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                    />
                    <button 
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded hover:bg-slate-900 transition-colors"
                    >
                        <Download className="w-4 h-4" /> Xuất Excel
                    </button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Add Expense Form */}
                <div className="md:col-span-1">
                    <div className="bg-white border border-slate-200 p-4 rounded shadow-sm">
                        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-[#21246b]" /> Thêm khoản chi mới
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Tên khoản chi *</label>
                                <input 
                                    required 
                                    type="text" 
                                    value={title} 
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm" 
                                    placeholder="VD: Nhập bồn cầu Inax..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Số tiền (VNĐ) *</label>
                                <input 
                                    required 
                                    type="number" 
                                    min="0"
                                    value={amount} 
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm" 
                                    placeholder="0"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Loại</label>
                                    <select 
                                        value={type} 
                                        onChange={(e) => setType(e.target.value)}
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                    >
                                        {EXPENSE_TYPES.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Ngày chi</label>
                                    <input 
                                        type="date" 
                                        value={date} 
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Ghi chú</label>
                                <textarea 
                                    value={description} 
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm h-20" 
                                    placeholder="Chi tiết..."
                                ></textarea>
                            </div>
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full bg-[#21246b] hover:bg-blue-800 text-white font-medium py-2 rounded text-sm transition-colors flex items-center justify-center"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu lại'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Expenses List */}
                <div className="md:col-span-2">
                    <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-medium text-slate-500">
                                        <th className="px-4 py-3">Ngày</th>
                                        <th className="px-4 py-3">Khoản chi</th>
                                        <th className="px-4 py-3">Phân loại</th>
                                        <th className="px-4 py-3 text-right">Số tiền</th>
                                        <th className="px-4 py-3 text-center">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-8">
                                                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#21246b]" />
                                            </td>
                                        </tr>
                                    ) : expenses.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-8 text-slate-500 text-sm">
                                                Chưa có dữ liệu chi phí. Hãy thêm mới hoặc import từ Excel.
                                            </td>
                                        </tr>
                                    ) : expenses.map(exp => (
                                        <tr key={exp.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {new Date(exp.date).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-medium text-slate-800">{exp.title}</p>
                                                {exp.description && <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{exp.description}</p>}
                                            </td>
                                            <td className="px-4 py-3 text-xs">
                                                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">
                                                    {EXPENSE_TYPES.find(t => t.value === exp.type)?.label || exp.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold text-red-600 text-right">
                                                - {new Intl.NumberFormat('vi-VN').format(exp.amount)}đ
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button 
                                                    onClick={() => handleDelete(exp.id)}
                                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                                >
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
        </div>
    );
}
