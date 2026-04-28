"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { API_URL } from '@/config';
import React, { useEffect, useState, useRef } from "react";
import { Loader2, Plus, Trash2, Download, Upload, TrendingUp, Users, Pencil } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, LabelList } from 'recharts';
import * as ExcelJS from 'exceljs';

const months = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
const APP_VERSION = "3.3";

const PAID_STATUSES = ['PAID', 'COMPLETED', 'SHIPPED', 'Đã thanh toán', 'Đang chuẩn bị', 'Đang giao hàng', 'Đang giao', 'Đã giao thành công', 'Đã giao', 'Hoàn thành'];
const PENDING_STATUSES = ['PENDING', 'PROCESSING', 'Chờ thanh toán'];
const CANCELLED_STATUSES = ['CANCELLED', 'REFUNDED', 'Đã hủy', 'Hoàn hàng'];

const EXPENSE_TYPES = [
    { value: 'HangHoa', label: 'Hàng hóa' },
    { value: 'MatBang', label: 'Mặt bằng' },
    { value: 'Luong', label: 'Lương nhân viên' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'DienNuoc', label: 'Điện nước' },
    { value: 'Khac', label: 'Khác' }
];
const COLORS = ['#21246b', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

const getAuthHeaders = () => {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('novas_admin_token') || localStorage.getItem('novas_token') || localStorage.getItem('token');
    return token ? { 'Authorization': 'Bearer ' + token } : {};
};

const formatDateInput = (value = new Date()) => {
    const d = new Date(value);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().split('T')[0];
};

const formatDateDisplay = (value) => {
    if (!value) return '';
    return new Date(value + 'T00:00:00').toLocaleDateString('vi-VN');
};

const parseDateValue = (value) => {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
};

const getExpenseDateValue = (expense) => expense?.date || expense?.createdAt || expense?.updatedAt;
const getOrderDateValue = (order) => order?.createdAt || order?.updatedAt;

const toNumber = (value) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const raw = String(value || '0').trim().replace(/[^\d.,-]/g, '');
    const hasComma = raw.includes(',');
    const hasDot = raw.includes('.');
    let normalized = raw;

    if (hasComma && hasDot) {
        normalized = raw.lastIndexOf(',') > raw.lastIndexOf('.')
            ? raw.replace(/\./g, '').replace(',', '.')
            : raw.replace(/,/g, '');
    } else if (hasDot && /^-?\d{1,3}(\.\d{3})+$/.test(raw)) {
        normalized = raw.replace(/\./g, '');
    } else if (hasComma && /^-?\d{1,3}(,\d{3})+$/.test(raw)) {
        normalized = raw.replace(/,/g, '');
    } else if (hasComma) {
        normalized = raw.replace(',', '.');
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
};

const getMonthStartInput = () => {
    const now = new Date();
    return formatDateInput(new Date(now.getFullYear(), now.getMonth(), 1));
};

const getDateBounds = (startInput, endInput) => {
    const start = new Date(startInput + 'T00:00:00');
    const end = new Date(endInput + 'T23:59:59.999');
    return { start, end };
};

const isDateInRange = (value, startInput, endInput) => {
    const d = parseDateValue(value);
    if (!d) return false;
    const { start, end } = getDateBounds(startInput, endInput);
    return d >= start && d <= end;
};

const getDataDateBounds = (orders = [], expenses = []) => {
    const dates = [
        ...orders.map(getOrderDateValue),
        ...expenses.map(getExpenseDateValue),
    ].map(parseDateValue).filter(Boolean);

    if (dates.length === 0) return null;

    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));
    return {
        startInput: formatDateInput(min),
        endInput: formatDateInput(max),
    };
};

const stripTones = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (c) => c === 'đ' ? 'd' : 'D')
    .toLowerCase();

const generateSlug = (value) => stripTones(value)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const getCellText = (cell) => {
    const value = cell?.value;
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toLocaleDateString('vi-VN');
    if (typeof value === 'object') {
        if (value.result !== undefined) return String(value.result || '').trim();
        if (value.text !== undefined) return String(value.text || '').trim();
        if (value.hyperlink !== undefined && value.text !== undefined) return String(value.text || '').trim();
        if (Array.isArray(value.richText)) return value.richText.map((part) => part.text || '').join('').trim();
    }
    return String(value).trim();
};

const getCellNumber = (cell) => {
    const text = getCellText(cell);
    if (text === '') return null;
    if (!/\d/.test(text)) return null;
    const parsed = toNumber(text);
    return Number.isFinite(parsed) ? parsed : null;
};

const normalizeExpenseType = (expense) => {
    const raw = String(expense?.type || '').trim();
    if (EXPENSE_TYPES.some((t) => t.value === raw)) return raw;

    const text = stripTones([raw, expense?.title, expense?.description].filter(Boolean).join(' '));
    if (raw === 'IMPORT' || /(^|\s)(hang|nhap)(\s|$)|san pham|thiet bi|bon cau|lavabo|voi|sen tam|chau rua/.test(text)) return 'HangHoa';
    if (raw === 'SALARY' || /luong|nhan vien/.test(text)) return 'Luong';
    if (raw === 'RENT' || /mat bang|thue/.test(text)) return 'MatBang';
    if (/marketing|quang cao/.test(text)) return 'Marketing';
    if (/dien|nuoc/.test(text)) return 'DienNuoc';
    return 'Khac';
};

const getExpenseTypeLabel = (expense) => {
    const normalizedType = normalizeExpenseType(expense);
    return EXPENSE_TYPES.find((t) => t.value === normalizedType)?.label || normalizedType;
};



export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, totalRevenue: 0, totalExpenses: 0, totalProfit: 0, totalUsers: 0, pendingOrders: 0, todayOrders: 0 });
    const [revenueData, setRevenueData] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [topCustomers, setTopCustomers] = useState([]);
    const [ordersData, setOrdersData] = useState([]);
    const [productsData, setProductsData] = useState([]);
    const [baseStats, setBaseStats] = useState({ totalProducts: 0, totalUsers: 0 });
    const [loading, setLoading] = useState(true);
    const [reportStartDate, setReportStartDate] = useState(getMonthStartInput);
    const [reportEndDate, setReportEndDate] = useState(() => formatDateInput(new Date()));

    const [expenses, setExpenses] = useState([]);
    const [expLoading, setExpLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('HangHoa');
    const [date, setDate] = useState(() => formatDateInput(new Date()));
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterExpType, setFilterExpType] = useState('ALL');
    const [editingExpense, setEditingExpense] = useState(null);
    const [showAllRecords, setShowAllRecords] = useState(false);
    const fileInputRef = useRef(null);
    const rangeInitializedRef = useRef(false);

    const maxDate = formatDateInput(new Date());
    const reportLabel = formatDateDisplay(reportStartDate) + ' - ' + formatDateDisplay(reportEndDate);

    useEffect(() => { fetchData(true); }, []);
    useEffect(() => { recomputeDashboard(); }, [ordersData, expenses, reportStartDate, reportEndDate, baseStats, showAllRecords]);
    useEffect(() => {
        if (rangeInitializedRef.current) return;
        const bounds = getDataDateBounds(ordersData, expenses);
        if (!bounds) return;

        if (bounds.startInput < reportStartDate) {
            setReportStartDate(bounds.startInput);
        }
        rangeInitializedRef.current = true;
    }, [ordersData, expenses, reportStartDate]);

    const resetExpenseForm = () => {
        setTitle('');
        setAmount('');
        setType('HangHoa');
        setDate(formatDateInput(new Date()));
        setDescription('');
        setEditingExpense(null);
    };

    const handleReportStartChange = (value) => {
        if (!value) return;
        rangeInitializedRef.current = true;
        setShowAllRecords(false);
        const next = value > maxDate ? maxDate : value;
        setReportStartDate(next);
        if (next > reportEndDate) setReportEndDate(next);
    };

    const handleReportEndChange = (value) => {
        if (!value) return;
        rangeInitializedRef.current = true;
        setShowAllRecords(false);
        const next = value > maxDate ? maxDate : value;
        setReportEndDate(next);
        if (next < reportStartDate) setReportStartDate(next);
    };

    const handleShowAllData = () => {
        const bounds = getDataDateBounds(ordersData, expenses);
        setShowAllRecords(true);
        if (!bounds) return;

        rangeInitializedRef.current = true;
        setReportStartDate(bounds.startInput);
        setReportEndDate(bounds.endInput > maxDate ? maxDate : bounds.endInput);
    };

    function recomputeDashboard() {
        const ordersArray = Array.isArray(ordersData) ? ordersData : [];
        const expArray = Array.isArray(expenses) ? expenses : [];
        const todayStr = formatDateInput(new Date());
        const rangeOrders = showAllRecords
            ? ordersArray
            : ordersArray.filter((o) => isDateInRange(getOrderDateValue(o), reportStartDate, reportEndDate));
        const rangePaidOrders = rangeOrders.filter((o) => PAID_STATUSES.includes(o.status));
        const rangeExpenses = showAllRecords
            ? expArray
            : expArray.filter((e) => isDateInRange(getExpenseDateValue(e), reportStartDate, reportEndDate));
        const totalRevenue = rangePaidOrders.reduce((s, o) => s + toNumber(o.total), 0);
        const totalExpenses = rangeExpenses.reduce((s, e) => s + toNumber(e.amount), 0);

        setStats({
            totalProducts: baseStats.totalProducts,
            totalOrders: rangeOrders.length,
            totalRevenue,
            totalExpenses,
            totalProfit: totalRevenue - totalExpenses,
            totalUsers: baseStats.totalUsers,
            pendingOrders: rangeOrders.filter((o) => PENDING_STATUSES.includes(o.status)).length,
            todayOrders: ordersArray.filter((o) => isDateInRange(getOrderDateValue(o), todayStr, todayStr)).length
        });

        const revData = [];
        const expDataMap = {};
        const revenueDataMap = {};
        const { start, end } = getDateBounds(reportStartDate, reportEndDate);
        const dayCount = Math.max(1, Math.round((end - start) / 86400000));
        const groupByMonth = dayCount > 62;
        const getGroupKey = (value) => {
            const d = parseDateValue(value);
            if (!d) return '';
            return groupByMonth ? (d.getMonth() + 1) + '-' + d.getFullYear() : formatDateInput(d);
        };

        rangeExpenses.forEach((e) => {
            const key = getGroupKey(getExpenseDateValue(e));
            if (!key) return;
            expDataMap[key] = (expDataMap[key] || 0) + toNumber(e.amount);
        });

        rangePaidOrders.forEach((o) => {
            const key = getGroupKey(getOrderDateValue(o));
            if (!key) return;
            if (!revenueDataMap[key]) revenueDataMap[key] = { revenue: 0, orders: 0 };
            revenueDataMap[key].revenue += toNumber(o.total);
            revenueDataMap[key].orders += 1;
        });

        if (!groupByMonth) {
            const cursor = new Date(start);
            while (cursor <= end) {
                const ds = formatDateInput(cursor);
                const revenuePoint = revenueDataMap[ds] || { revenue: 0, orders: 0 };
                revData.push({
                    name: cursor.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                    revenue: revenuePoint.revenue,
                    expenses: expDataMap[ds] || 0,
                    orders: revenuePoint.orders
                });
                cursor.setDate(cursor.getDate() + 1);
            }
        } else {
            const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
            while (cursor <= end) {
                const mKey = (cursor.getMonth() + 1) + '-' + cursor.getFullYear();
                const revenuePoint = revenueDataMap[mKey] || { revenue: 0, orders: 0 };
                revData.push({
                    name: months[cursor.getMonth()] + '/' + cursor.getFullYear(),
                    revenue: revenuePoint.revenue,
                    expenses: expDataMap[mKey] || 0,
                    orders: revenuePoint.orders
                });
                cursor.setMonth(cursor.getMonth() + 1);
            }
        }
        setRevenueData(revData);
        setStatusData([
            { name: 'Đã thanh toán', value: rangeOrders.filter((o) => PAID_STATUSES.includes(o.status)).length },
            { name: 'Chờ xử lý', value: rangeOrders.filter((o) => PENDING_STATUSES.includes(o.status)).length },
            { name: 'Đã hủy', value: rangeOrders.filter((o) => CANCELLED_STATUSES.includes(o.status)).length },
        ]);

        const productSales = {};
        const customerSales = {};
        rangePaidOrders.forEach((o) => {
            const customerKey = o.userId ? 'user-' + o.userId : (o.customerPhone ? 'phone-' + o.customerPhone : (o.customerName ? 'name-' + stripTones(o.customerName) : 'guest-' + o.id));
            if (!customerSales[customerKey]) {
                customerSales[customerKey] = {
                    name: o.customerName || (o.userId ? 'User #' + o.userId : 'Khách lẻ'),
                    phone: o.customerPhone || '',
                    orders: 0,
                    quantity: 0,
                    revenue: 0,
                };
            }
            customerSales[customerKey].orders += 1;
            customerSales[customerKey].revenue += toNumber(o.total);

            o.items?.forEach((item) => {
                const quantity = toNumber(item.quantity);
                customerSales[customerKey].quantity += quantity;

                const pid = item.product?.id;
                if (pid) {
                    if (!productSales[pid]) productSales[pid] = { name: item.product.name, quantity: 0, revenue: 0 };
                    productSales[pid].quantity += quantity;
                    productSales[pid].revenue += (toNumber(item.price) || toNumber(item.product.price)) * quantity;
                }
            });
        });
        setTopProducts(Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5));
        setTopCustomers(Object.values(customerSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5));
    }

    const fetchExpenses = async (showLoading = false) => {
        if (showLoading) setExpLoading(true);
        try {
            const res = await fetch(API_URL + '/api/expenses', { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                setExpenses(Array.isArray(data) ? data : []);
            }
        } catch (e) { console.error(e); } finally { if (showLoading) setExpLoading(false); }
    };

    const fetchData = async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const headers = getAuthHeaders();
            const [productsRes, ordersRes, usersRes, expensesRes] = await Promise.all([
                fetch(API_URL + '/api/products'),
                fetch(API_URL + '/api/orders/all', { headers }),
                fetch(API_URL + '/api/users/all', { headers }),
                fetch(API_URL + '/api/expenses', { headers }).catch(() => null)
            ]);
            const products = await productsRes.json();
            const orders = await ordersRes.json();
            const users = await usersRes.json().catch(() => []);
            const expData = expensesRes ? await expensesRes.json().catch(() => []) : [];


            const ordersArray = Array.isArray(orders) ? orders : [];
            const usersArray = Array.isArray(users) ? users : [];
            const expArray = Array.isArray(expData) ? expData : [];
            const productsArray = Array.isArray(products) ? products : [];
            setOrdersData(ordersArray);
            setProductsData(productsArray);
            setExpenses(expArray);
            setBaseStats({ totalProducts: productsArray.length, totalUsers: usersArray.length });

            const todayStr = formatDateInput(new Date());
            const rangeOrders = showAllRecords
                ? ordersArray
                : ordersArray.filter((o) => isDateInRange(getOrderDateValue(o), reportStartDate, reportEndDate));
            const rangePaidOrders = rangeOrders.filter((o) => PAID_STATUSES.includes(o.status));
            const rangeExpenses = showAllRecords
                ? expArray
                : expArray.filter((e) => isDateInRange(getExpenseDateValue(e), reportStartDate, reportEndDate));
            const totalRevenue = rangePaidOrders.reduce((s, o) => s + toNumber(o.total), 0);
            const totalExpenses = rangeExpenses.reduce((s, e) => s + toNumber(e.amount), 0);

            setStats({
                totalProducts: productsArray.length, totalOrders: rangeOrders.length,
                totalRevenue, totalExpenses, totalProfit: totalRevenue - totalExpenses,
                totalUsers: usersArray.length,
                pendingOrders: rangeOrders.filter((o) => PENDING_STATUSES.includes(o.status)).length,
                todayOrders: ordersArray.filter((o) => isDateInRange(getOrderDateValue(o), todayStr, todayStr)).length
            });

            const revData = [];
            const expDataMap = {};
            const revenueDataMap = {};
            
            const { start, end } = getDateBounds(reportStartDate, reportEndDate);
            const dayCount = Math.max(1, Math.round((end - start) / 86400000));
            const groupByMonth = dayCount > 62;
            const getGroupKey = (value) => {
                const d = parseDateValue(value);
                if (!d) return '';
                return groupByMonth ? (d.getMonth() + 1) + '-' + d.getFullYear() : formatDateInput(d);
            };

            rangeExpenses.forEach((e) => {
                const key = getGroupKey(getExpenseDateValue(e));
                if (!key) return;
                expDataMap[key] = (expDataMap[key] || 0) + toNumber(e.amount);
            });

            rangePaidOrders.forEach((o) => {
                const key = getGroupKey(getOrderDateValue(o));
                if (!key) return;
                if (!revenueDataMap[key]) revenueDataMap[key] = { revenue: 0, orders: 0 };
                revenueDataMap[key].revenue += toNumber(o.total);
                revenueDataMap[key].orders += 1;
            });

            if (!groupByMonth) {
                const cursor = new Date(start);
                while (cursor <= end) {
                    const ds = formatDateInput(cursor);
                    const revenuePoint = revenueDataMap[ds] || { revenue: 0, orders: 0 };
                    revData.push({
                        name: cursor.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                        revenue: revenuePoint.revenue,
                        expenses: expDataMap[ds] || 0,
                        orders: revenuePoint.orders
                    });
                    cursor.setDate(cursor.getDate() + 1);
                }
            } else {
                const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
                while (cursor <= end) {
                    const mKey = (cursor.getMonth() + 1) + '-' + cursor.getFullYear();
                    const revenuePoint = revenueDataMap[mKey] || { revenue: 0, orders: 0 };
                    revData.push({
                        name: months[cursor.getMonth()] + '/' + cursor.getFullYear(),
                        revenue: revenuePoint.revenue,
                        expenses: expDataMap[mKey] || 0,
                        orders: revenuePoint.orders
                    });
                    cursor.setMonth(cursor.getMonth() + 1);
                }
            }
            setRevenueData(revData);
            setStatusData([
                { name: 'Đã thanh toán', value: rangeOrders.filter((o) => PAID_STATUSES.includes(o.status)).length },
                { name: 'Chờ xử lý', value: rangeOrders.filter((o) => PENDING_STATUSES.includes(o.status)).length },
                { name: 'Đã hủy', value: rangeOrders.filter((o) => CANCELLED_STATUSES.includes(o.status)).length },
            ]);

            // Top Products
            const productSales = {};
            rangePaidOrders.forEach((o) => {
                o.items?.forEach((item) => {
                    const quantity = toNumber(item.quantity);
                    const pid = item.product?.id;
                    if (pid) {
                        if (!productSales[pid]) productSales[pid] = { name: item.product.name, quantity: 0, revenue: 0 };
                        productSales[pid].quantity += quantity;
                        productSales[pid].revenue += (toNumber(item.price) || toNumber(item.product.price)) * quantity;
                    }
                });
            });
            setTopProducts(Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5));
        } catch (e) { console.error(e); } finally { if (showLoading) setLoading(false); }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const url = editingExpense ? (API_URL) + '/api/expenses/' + (editingExpense.id) : (API_URL) + '/api/expenses';
            const method = editingExpense ? 'PUT' : 'POST';
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ title, amount: parseFloat(amount), type: normalizeExpenseType({ type, title, description }), date: new Date(date).toISOString(), description })
            });
            if (res.ok) { 
                resetExpenseForm();
                fetchData();
            }
            else alert('Có lỗi xảy ra');
        } catch (e) { console.error(e); } finally { setIsSubmitting(false); }
    };

    const handleEditClick = (exp) => {
        setEditingExpense(exp);
        setTitle(exp.title);
        setAmount(toNumber(exp.amount).toString());
        setType(normalizeExpenseType(exp));
        setDate(formatDateInput(getExpenseDateValue(exp)));
        setDescription(exp.description || '');
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const allExpenses = Array.isArray(expenses) ? expenses : [];
    const normalizedSearchTerm = stripTones(searchTerm);
    const reportExpenses = allExpenses
        .filter(exp => showAllRecords || isDateInRange(getExpenseDateValue(exp), reportStartDate, reportEndDate))
        .sort((a, b) => {
            const bd = parseDateValue(getExpenseDateValue(b))?.getTime() || 0;
            const ad = parseDateValue(getExpenseDateValue(a))?.getTime() || 0;
            return bd - ad;
        });

    const filteredExpenses = reportExpenses.filter(exp => {
        const searchableText = stripTones([exp.title, exp.description].filter(Boolean).join(' '));
        const matchesSearch = !normalizedSearchTerm || searchableText.includes(normalizedSearchTerm);
        const matchesType = filterExpType === 'ALL' || normalizeExpenseType(exp) === filterExpType;
        return matchesSearch && matchesType;
    });

    const expenseTypeStats = EXPENSE_TYPES.map(t => ({
        name: t.label,
        value: reportExpenses.filter(e => normalizeExpenseType(e) === t.value).reduce((sum, e) => sum + toNumber(e.amount), 0)
    })).filter(t => t.value > 0);

    const totalReportExpenses = reportExpenses.reduce((s, e) => s + toNumber(e.amount), 0);
    const totalFilteredExpenses = filteredExpenses.reduce((s, e) => s + toNumber(e.amount), 0);
    const rangeOrders = showAllRecords
        ? ordersData
        : ordersData.filter((o) => isDateInRange(getOrderDateValue(o), reportStartDate, reportEndDate));
    const rangePaidOrders = rangeOrders.filter((o) => PAID_STATUSES.includes(o.status));
    const rangeRevenue = rangePaidOrders.reduce((s, o) => s + toNumber(o.total), 0);
    const rangeProfit = rangeRevenue - totalReportExpenses;

    const handleDeleteExpense = async (id) => {
        if (!confirm('Xóa khoản chi này?')) return;
        try {
            await fetch(API_URL + '/api/expenses/' + id, { method: 'DELETE', headers: getAuthHeaders() });
            fetchData();
        } catch (e) { console.error(e); }
    };

    const handleExport = async () => {
        let dataToExport = activeTab === 'expenses' ? filteredExpenses : reportExpenses;
        const ordersToExport = showAllRecords
            ? ordersData
            : ordersData.filter((o) => isDateInRange(getOrderDateValue(o), reportStartDate, reportEndDate));
        const paidOrdersToExport = ordersToExport.filter((o) => PAID_STATUSES.includes(o.status));
        const productsToExport = Array.isArray(productsData) ? productsData : [];
        const exportRevenue = paidOrdersToExport.reduce((s, o) => s + toNumber(o.total), 0);
        const exportExpenses = dataToExport.reduce((s, e) => s + toNumber(e.amount), 0);
        const exportStats = {
            totalRevenue: exportRevenue,
            totalExpenses: exportExpenses,
            totalProfit: exportRevenue - exportExpenses,
            totalOrders: ordersToExport.length,
            pendingOrders: ordersToExport.filter((o) => PENDING_STATUSES.includes(o.status)).length,
            todayOrders: ordersData.filter((o) => isDateInRange(getOrderDateValue(o), formatDateInput(new Date()), formatDateInput(new Date()))).length,
            totalProducts: stats.totalProducts,
            totalUsers: stats.totalUsers,
        };
        // Allow export even if no expenses, if there is revenue or orders
        if (dataToExport.length === 0 && ordersToExport.length === 0 && productsToExport.length === 0) {
            alert('Không có dữ liệu để xuất báo cáo.');
            return;
        }

        const wb = new ExcelJS.Workbook();
        wb.creator = 'NOVAS Admin';
        wb.created = new Date();
        const reportTime = reportLabel;
        const todayFull = new Date().toLocaleString('vi-VN');

        const NAVY = 'FF21246B', WHITE = 'FFFFFFFF', GOLD = 'FFFFD700';
        const LIGHT = 'FFF0F4FF', STRIPE = 'FFF8FAFC';
        const GREEN = 'FF16A34A', RED = 'FFDC2626', BLUE = 'FF1D4ED8';
        const DARK = 'FF1E293B', ORANGE = 'FFEA580C';

        const t = { style: 'thin' };
        const m = { style: 'medium' };
        const h = { style: 'hair' };
        const bT = { top: t, bottom: t, left: t, right: t };
        const bM = { top: m, bottom: m, left: m, right: m };
        const bH = { top: h, bottom: h, left: h, right: h };
        const fl = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
        const fn = (bold, size, argb) => ({ bold, size, name: 'Calibri', color: { argb } });
        const setCell = (ws, addr, val, style = {}) => {
            const c = ws.getCell(addr);
            c.value = val;
            if (style.font) c.font = style.font;
            if (style.fill) c.fill = style.fill;
            if (style.alignment) c.alignment = style.alignment;
            if (style.border) c.border = style.border;
            if (style.numFmt) c.numFmt = style.numFmt;
            return c;
        };

        const grandTotal = dataToExport.reduce((s, e) => s + toNumber(e.amount), 0);
        const margin = exportStats.totalRevenue > 0 ? ((exportStats.totalProfit / exportStats.totalRevenue) * 100).toFixed(1) : '0.0';
        const aov = exportStats.totalOrders > 0 ? Math.round(exportStats.totalRevenue / exportStats.totalOrders) : 0;

        // ── SHEET 1: KPI TỔNG QUAN ──
        const s1 = wb.addWorksheet('Tong Quan KPI');

        s1.mergeCells('A1:E1');
        { const c = s1.getCell('A1'); c.value = 'CÔNG TY TNHH THIẾT BỊ VỆ SINH THÔNG MINH NOVAS'; c.font = fn(true, 15, GOLD); c.fill = fl(NAVY); c.alignment = { horizontal: 'center', vertical: 'middle' }; }
        s1.getRow(1).height = 36;

        s1.mergeCells('A2:E2');
        setCell(s1, 'A2', 'BÁO CÁO KINH DOANH ' + (reportTime.toUpperCase()) + '  |  Xuất ngày: ' + (todayFull), { font: fn(true, 11, WHITE), fill: fl('FF1E293B'), alignment: { horizontal: 'center', vertical: 'middle' } });
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

        const kpiData = [
            ['Tổng Doanh Thu', exportStats.totalRevenue, 'VNĐ', 'Từ đơn đã thanh toán', BLUE, 'Doanh thu trong kỳ'],
            ['Tổng Chi Phí Vận Hành', exportStats.totalExpenses, 'VNĐ', 'Tổng các khoản chi', RED, 'Chi phí trong kỳ'],
            ['Lợi Nhuận Ròng', exportStats.totalProfit, 'VNĐ', 'Doanh thu - Chi phí', exportStats.totalProfit >= 0 ? GREEN : RED, exportStats.totalProfit >= 0 ? 'Có lãi' : 'Lỗ'],
            ['Biên Lợi Nhuận', (margin) + '%', '%', 'Profit Margin = LN/DT', exportStats.totalProfit >= 0 ? GREEN : RED, (margin) + '% margin'],
            ['Giá Trị Đơn TB (AOV)', aov, 'VNĐ', 'Average Order Value', BLUE, 'AOV'],
            ['Tổng Đơn Hàng', exportStats.totalOrders, 'Đơn', 'Tất cả trạng thái', 'FF334155', ''],
            ['Đơn Chờ Xử Lý', exportStats.pendingOrders, 'Đơn', 'Trạng thái PENDING', ORANGE, exportStats.pendingOrders > 10 ? 'Cần xử lý gấp' : 'Bình thường'],
            ['Đơn Hàng Hôm Nay', exportStats.todayOrders, 'Đơn', 'Tính đến thời điểm xuất', BLUE, ''],
            ['Tổng Sản Phẩm', exportStats.totalProducts, 'SP', 'Sản phẩm trong hệ thống', 'FF334155', ''],
            ['Tổng Khách Hàng', exportStats.totalUsers, 'User', 'Người dùng đã đăng ký', 'FF334155', ''],
            ['Doanh Thu / Khách Hàng', exportStats.totalUsers > 0 ? Math.round(exportStats.totalRevenue / exportStats.totalUsers) : 0, 'VNĐ', 'Revenue per User', BLUE, 'RPU'],
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

        s2.mergeCells('A1:I1');
        const s2h1 = s2.getCell('A1');
        s2h1.value = 'CÔNG TY TNHH THIẾT BỊ VỆ SINH THÔNG MINH NOVAS';
        s2h1.font = fn(true, 14, GOLD); s2h1.fill = fl(NAVY); s2h1.alignment = { horizontal: 'center', vertical: 'middle' };
        s2.getRow(1).height = 32;

        s2.mergeCells('A2:I2');
        const s2h2 = s2.getCell('A2');
        s2h2.value = 'BẢNG CHI TIẾT CHI PHÍ VẬN HÀNH  |  Ngày xuất: ' + (todayFull);
        s2h2.font = fn(true, 11, WHITE); s2h2.fill = fl('FF1E293B'); s2h2.alignment = { horizontal: 'center', vertical: 'middle' };
        s2.getRow(2).height = 22;

        s2.mergeCells('A3:I3');
        const s2h3 = s2.getCell('A3');
        s2h3.value = 'Tổng khoản chi: ' + (dataToExport.length) + '  |  Tổng chi phí: ' + (new Intl.NumberFormat('vi-VN').format(grandTotal)) + ' đ';
        s2h3.font = fn(true, 10, RED); s2h3.fill = fl(LIGHT); s2h3.border = bT; s2h3.alignment = { horizontal: 'center', vertical: 'middle' };
        s2.getRow(3).height = 20;
        s2.getRow(4).height = 8;

        ['STT', 'NGÀY CHI', 'TÊN KHOẢN CHI', 'MÔ TẢ CHI TIẾT', 'PHÂN LOẠI', 'SỐ TIỀN (VNĐ)', 'TỶ LỆ (%)', 'GHI CHÚ', 'ID'].forEach((hdr, i) => {
            const c = s2.getCell(5, i + 1);
            c.value = hdr; c.font = fn(true, 10, WHITE); c.fill = fl(NAVY);
            c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; c.border = bT;
        });
        s2.getRow(5).height = 24;

        dataToExport.forEach((exp, idx) => {
            const bg = idx % 2 === 0 ? WHITE : STRIPE;
            const expAmount = toNumber(exp.amount);
            const pct = grandTotal > 0 ? parseFloat(((expAmount / grandTotal) * 100).toFixed(2)) : 0;
            const r = s2.getRow(6 + idx); r.height = 20;
            const vals = [
                idx + 1, (parseDateValue(getExpenseDateValue(exp)) || new Date()).toLocaleDateString('vi-VN'),
                exp.title, exp.description || '',
                getExpenseTypeLabel(exp),
                expAmount, pct, '', exp.id || '',
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

        s2.views = [{ state: 'frozen', ySplit: 5, activeCell: 'A6' }];
        s2.autoFilter = { from: 'A5', to: 'H5' };
        [6, 14, 36, 36, 20, 20, 12, 16, 8].forEach((w, i) => { s2.getColumn(i + 1).width = w; });
        s2.getColumn(9).hidden = true;

        // ── SHEET 3: THỐNG KÊ THEO LOẠI ──
        const s3 = wb.addWorksheet('Thong Ke Theo Loai');

        s3.mergeCells('A1:E1');
        const s3h = s3.getCell('A1');
        s3h.value = 'THỐNG KÊ CHI PHÍ THEO PHÂN LOẠI'; s3h.font = fn(true, 14, GOLD); s3h.fill = fl(NAVY); s3h.alignment = { horizontal: 'center', vertical: 'middle' };
        s3.getRow(1).height = 30;
        s3.mergeCells('A2:E2');
        const s3h2 = s3.getCell('A2');
        s3h2.value = 'Ngày xuất: ' + (todayFull); s3h2.font = fn(false, 10, 'FF1E293B'); s3h2.fill = fl(LIGHT); s3h2.alignment = { horizontal: 'center', vertical: 'middle' }; s3h2.border = bT;
        s3.getRow(2).height = 18; s3.getRow(3).height = 10;

        ['PHÂN LOẠI CHI PHÍ', 'SỐ KHOẢN CHI', 'TỔNG SỐ TIỀN (VNĐ)', 'TỶ LỆ (%)', 'XẾP HẠNG'].forEach((hdr, i) => {
            const c = s3.getCell(4, i + 1);
            c.value = hdr; c.font = fn(true, 10, WHITE); c.fill = fl(NAVY);
            c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; c.border = bT;
        });
        s3.getRow(4).height = 24;

        const grouped = {};
        dataToExport.forEach((exp) => {
            const label = getExpenseTypeLabel(exp);
            if (!grouped[label]) grouped[label] = { count: 0, amount: 0 };
            grouped[label].count++; grouped[label].amount += toNumber(exp.amount);
        });
        const totalByType = Object.values(grouped).reduce((a, b) => a + b.amount, 0);
        const sortedTypes = Object.entries(grouped).sort((a, b) => b[1].amount - a[1].amount);

        sortedTypes.forEach(([label, { count, amount }], ri) => {
            const bg = ri % 2 === 0 ? WHITE : STRIPE;
            const pct = totalByType > 0 ? parseFloat(((amount / totalByType) * 100).toFixed(1)) : 0;
            const r = s3.getRow(5 + ri); r.height = 22;
            [label, count, amount, pct, ri + 1].forEach((v, ci) => {
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
            [['TỔNG CỘNG', WHITE, NAVY, 'center'], [totalCount, WHITE, NAVY, 'center'], [totalByType, WHITE, NAVY, 'right'], ['100%', WHITE, NAVY, 'center'], ['—', WHITE, NAVY, 'center']].forEach(([v, fg, bg, align], ci) => {
                const c = tr3.getCell(ci + 1); c.value = v; c.font = fn(true, 11, fg); c.fill = fl(bg); c.border = bM; c.alignment = { horizontal: align, vertical: 'middle' };
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
        s4h2.value = 'Báo cáo tài chính tổng hợp | Ngày xuất: ' + (todayFull); s4h2.font = fn(false, 10, WHITE); s4h2.fill = fl('FF1E293B'); s4h2.alignment = { horizontal: 'center', vertical: 'middle' };
        s4.getRow(2).height = 20;

        const sections = [
            { title: 'I. DOANH THU & LỢI NHUẬN', color: BLUE, rows: [
                ['Tổng Doanh Thu', exportStats.totalRevenue, 'VNĐ', '= Tổng đơn đã thanh toán'],
                ['Tổng Chi Phí Vận Hành', exportStats.totalExpenses, 'VNĐ', '= Tổng các khoản chi'],
                ['Lợi Nhuận Ròng (Net Profit)', exportStats.totalProfit, 'VNĐ', '= Doanh Thu − Chi Phí'],
                ['Biên Lợi Nhuận (Net Margin)', parseFloat(margin), '%', '= ' + (margin) + '% (LN / DT × 100)'],
            ]},
            { title: 'II. HIỆU SUẤT ĐƠN HÀNG', color: ORANGE, rows: [
                ['Tổng Số Đơn Hàng', exportStats.totalOrders, 'Đơn', 'Tất cả trạng thái'],
                ['Đơn Hàng Chờ Xử Lý', exportStats.pendingOrders, 'Đơn', 'Trạng thái PENDING'],
                ['Đơn Hàng Trong Ngày', exportStats.todayOrders, 'Đơn', 'Tính đến thời điểm xuất'],
                ['Giá Trị Đơn TB (AOV)', aov, 'VNĐ', 'Average Order Value'],
            ]},
            { title: 'III. KHO & KHÁCH HÀNG', color: GREEN, rows: [
                ['Tổng Số Sản Phẩm', exportStats.totalProducts, 'SP', 'Sản phẩm trong hệ thống'],
                ['Tổng Khách Hàng Đăng Ký', exportStats.totalUsers, 'User', 'Tài khoản đã đăng ký'],
                ['Doanh Thu / Khách Hàng (RPU)', exportStats.totalUsers > 0 ? Math.round(exportStats.totalRevenue / exportStats.totalUsers) : 0, 'VNĐ', 'Revenue per User'],
            ]},
            { title: 'IV. CHI PHÍ THEO LOẠI', color: RED, rows: sortedTypes.map(([label, { count, amount }]) => [label, amount, 'VNĐ', (count) + ' khoản chi']) },
        ];

        let curRow = 4;
        sections.forEach(({ title, color, rows }) => {
            s4.mergeCells('A' + (curRow) + ':D' + (curRow));
            const sh = s4.getCell('A' + (curRow));
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
                const vc = r.getCell(2); vc.value = val; vc.font = fn(true, 10, color); vc.fill = fl(bg); vc.border = bT; vc.alignment = { horizontal: 'right', vertical: 'middle' };
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

        // ── SHEET 5: CHI TIẾT SẢN PHẨM / TỒN KHO ──
        const productRows = productsToExport;
        const totalStock = productRows.reduce((sum, p) => sum + toNumber(p.stock), 0);
        const totalSold = productRows.reduce((sum, p) => sum + toNumber(p.soldCount), 0);
        const totalInventoryValue = productRows.reduce((sum, p) => sum + (toNumber(p.stock) * toNumber(p.price)), 0);
        const s5 = wb.addWorksheet('Chi Tiet San Pham');

        s5.mergeCells('A1:M1');
        const s5h1 = s5.getCell('A1');
        s5h1.value = 'CHI TIẾT SẢN PHẨM & TỒN KHO';
        s5h1.font = fn(true, 14, GOLD); s5h1.fill = fl(NAVY); s5h1.alignment = { horizontal: 'center', vertical: 'middle' };
        s5.getRow(1).height = 32;

        s5.mergeCells('A2:M2');
        const s5h2 = s5.getCell('A2');
        s5h2.value = 'Tổng sản phẩm: ' + productRows.length + '  |  Tổng tồn: ' + totalStock + '  |  Đã bán: ' + totalSold + '  |  Giá trị bán tồn: ' + new Intl.NumberFormat('vi-VN').format(totalInventoryValue) + ' đ';
        s5h2.font = fn(true, 10, WHITE); s5h2.fill = fl('FF1E293B'); s5h2.alignment = { horizontal: 'center', vertical: 'middle' };
        s5.getRow(2).height = 22;

        s5.mergeCells('A3:M3');
        const s5h3 = s5.getCell('A3');
        s5h3.value = 'Import sẽ cập nhật theo ID hoặc Slug. Cột "Đã bán" chỉ để xem, không dùng để sửa thủ công.';
        s5h3.font = { size: 9, name: 'Calibri', color: { argb: 'FF64748B' }, italic: true };
        s5h3.fill = fl(LIGHT); s5h3.border = bT; s5h3.alignment = { horizontal: 'center', vertical: 'middle' };
        s5.getRow(3).height = 20;
        s5.getRow(4).height = 8;

        ['STT', 'ID', 'TÊN SẢN PHẨM', 'SLUG', 'GIÁ BÁN (VNĐ)', 'TỒN KHO', 'ĐÃ BÁN', 'GIÁ TRỊ BÁN TỒN', 'DANH MỤC', 'DANH MỤC PHỤ', 'SUBCATEGORY ID', 'HÌNH ẢNH', 'MÔ TẢ'].forEach((hdr, i) => {
            const c = s5.getCell(5, i + 1);
            c.value = hdr; c.font = fn(true, 10, WHITE); c.fill = fl(NAVY);
            c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; c.border = bT;
        });
        s5.getRow(5).height = 26;

        productRows.forEach((product, idx) => {
            const bg = idx % 2 === 0 ? WHITE : STRIPE;
            const stock = toNumber(product.stock);
            const sold = toNumber(product.soldCount);
            const price = toNumber(product.price);
            const r = s5.getRow(6 + idx); r.height = 22;
            const vals = [
                idx + 1,
                product.id || '',
                product.name || '',
                product.slug || '',
                price,
                stock,
                sold,
                stock * price,
                product.subcategory?.category?.name || '',
                product.subcategory?.name || '',
                product.subcategoryId || '',
                product.image || '',
                product.description || '',
            ];

            vals.forEach((val, ci) => {
                const c = r.getCell(ci + 1);
                c.value = val; c.fill = fl(bg); c.border = bH; c.font = fn(false, 10, 'FF1E293B'); c.alignment = { vertical: 'middle', wrapText: ci === 12 };
            });
            [1, 2, 6, 7, 11].forEach((ci) => { r.getCell(ci).alignment = { horizontal: 'center', vertical: 'middle' }; });
            [5, 8].forEach((ci) => { r.getCell(ci).numFmt = '#,##0'; r.getCell(ci).alignment = { horizontal: 'right', vertical: 'middle' }; });
            r.getCell(5).font = fn(true, 10, BLUE);
            r.getCell(6).font = fn(true, 10, stock === 0 ? RED : stock <= 5 ? ORANGE : GREEN);
        });

        s5.views = [{ state: 'frozen', ySplit: 5, activeCell: 'A6' }];
        s5.autoFilter = { from: 'A5', to: 'M5' };
        [6, 8, 36, 28, 18, 12, 12, 20, 22, 24, 14, 32, 48].forEach((w, i) => { s5.getColumn(i + 1).width = w; });
        s5.getColumn(11).hidden = true;

        // ── XUẤT FILE ──
        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeTime = reportTime.replace(/\//g, '_').replace(/ /g, '_');
        a.download = 'Bao_Cao_Tai_Chinh_' + (safeTime) + '.xlsx';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = async (e) => {
        const file = e.target.files?.[0]; if (!file) return;
        try {
            const wb2 = new ExcelJS.Workbook();
            const arrayBuffer = await file.arrayBuffer();
            await wb2.xlsx.load(arrayBuffer);

            const productWs = wb2.getWorksheet('Chi Tiet San Pham');
            const expenseWs = wb2.getWorksheet('Chi Tiet Chi Phi') || (!productWs ? wb2.worksheets[0] : null);
            if (!expenseWs && !productWs) { alert('Không đọc được dữ liệu từ file.'); return; }

            const importHeaders = { 'Content-Type': 'application/json', ...getAuthHeaders() };
            const formattedExpenses = [];
            const formattedProducts = [];

            if (expenseWs) {
                expenseWs.eachRow((row, rowNumber) => {
                    if (rowNumber < 6) return;

                    const firstCell = stripTones(getCellText(row.getCell(1)));
                    const title = getCellText(row.getCell(3));
                    if (firstCell.includes('tong cong') || stripTones(title).includes('tong cong')) return;
                    const amount = getCellNumber(row.getCell(6));

                    if (!title || !amount || amount <= 0) return;

                    const dateRaw = row.getCell(2).value;
                    let expenseDate = new Date();
                    if (dateRaw instanceof Date) {
                        expenseDate = dateRaw;
                    } else {
                        const dateText = getCellText(row.getCell(2));
                        const pts = dateText.split('/');
                        if (pts.length === 3) expenseDate = new Date(Number(pts[2]), Number(pts[1]) - 1, Number(pts[0]));
                    }

                    const typeRaw = stripTones(getCellText(row.getCell(5)));
                    const importType = /(^|\s)(nhap|hang)(\s|$)/.test(typeRaw) ? 'HangHoa' :
                        typeRaw.includes('luong') ? 'Luong' :
                        typeRaw.includes('marketing') ? 'Marketing' :
                        typeRaw.includes('mat bang') || typeRaw.includes('thue') ? 'MatBang' :
                        typeRaw.includes('dien') || typeRaw.includes('nuoc') ? 'DienNuoc' : 'Khac';

                    formattedExpenses.push({
                        id: getCellNumber(row.getCell(9)) || null,
                        title,
                        amount,
                        type: importType,
                        date: expenseDate.toISOString(),
                        description: getCellText(row.getCell(4)),
                    });
                });
            }

            if (productWs) {
                productWs.eachRow((row, rowNumber) => {
                    if (rowNumber < 6) return;

                    const firstCell = stripTones(getCellText(row.getCell(1)));
                    const name = getCellText(row.getCell(3));
                    const slug = getCellText(row.getCell(4));
                    if (firstCell.includes('tong cong') || stripTones(name).includes('tong cong')) return;
                    if (!name && !slug && !getCellNumber(row.getCell(2))) return;

                    formattedProducts.push({
                        id: getCellNumber(row.getCell(2)) || null,
                        name,
                        slug,
                        price: getCellNumber(row.getCell(5)),
                        stock: getCellNumber(row.getCell(6)),
                        subcategoryId: getCellNumber(row.getCell(11)),
                        image: getCellText(row.getCell(12)),
                        description: getCellText(row.getCell(13)),
                    });
                });
            }

            if (formattedExpenses.length === 0 && formattedProducts.length === 0) {
                alert('Không tìm thấy dữ liệu hợp lệ. Dữ liệu chi phí nằm trong "Chi Tiet Chi Phi", dữ liệu sản phẩm nằm trong "Chi Tiet San Pham" từ dòng 6.');
                return;
            }

            const expenseUpdates = formattedExpenses.filter((item) => item.id);
            const expenseCreates = formattedExpenses.filter((item) => !item.id).map(({ id, ...item }) => item);
            const expenseUpdateResults = await Promise.all(expenseUpdates.map(({ id, ...item }) =>
                fetch((API_URL) + '/api/expenses/' + id, {
                    method: 'PUT',
                    headers: importHeaders,
                    body: JSON.stringify(item)
                })
            ));

            let expenseCreateRes = null;
            if (expenseCreates.length > 0) {
                expenseCreateRes = await fetch((API_URL) + '/api/expenses/bulk', {
                    method: 'POST',
                    headers: importHeaders,
                    body: JSON.stringify(expenseCreates)
                });
            }

            const existingProducts = productsData.length > 0
                ? productsData
                : await fetch(API_URL + '/api/products').then((res) => res.json()).catch(() => []);
            const productById = new Map((Array.isArray(existingProducts) ? existingProducts : []).map((product) => [Number(product.id), product]));
            const productBySlug = new Map((Array.isArray(existingProducts) ? existingProducts : []).filter((product) => product.slug).map((product) => [String(product.slug), product]));

            const productResults = [];
            let productUpdated = 0;
            let productCreated = 0;
            let productSkipped = 0;

            for (const row of formattedProducts) {
                const current = (row.id ? productById.get(Number(row.id)) : null) || (row.slug ? productBySlug.get(row.slug) : null);
                const nextName = row.name || current?.name || '';
                const nextSlug = row.slug || current?.slug || generateSlug(nextName);
                const nextPrice = row.price !== null ? row.price : current ? toNumber(current.price) : null;
                const nextStock = row.stock !== null ? Math.max(0, Math.floor(row.stock)) : current ? Math.max(0, Math.floor(toNumber(current.stock))) : 0;
                const nextImage = row.image || current?.image || '';

                if (current) {
                    const payload = {
                        name: nextName,
                        slug: nextSlug,
                        description: row.description || current.description || '',
                        price: nextPrice,
                        image: nextImage,
                        images: Array.isArray(current.images) ? current.images : [],
                        subcategoryId: row.subcategoryId !== null ? Number(row.subcategoryId) : current.subcategoryId ?? null,
                        stock: nextStock,
                        specs: current.specs || {},
                    };
                    productResults.push(await fetch((API_URL) + '/api/products/' + current.id, {
                        method: 'PATCH',
                        headers: importHeaders,
                        body: JSON.stringify(payload)
                    }));
                    productUpdated++;
                } else if (nextName && nextPrice !== null && nextImage) {
                    const payload = {
                        name: nextName,
                        slug: nextSlug,
                        description: row.description || '',
                        price: nextPrice,
                        image: nextImage,
                        images: [],
                        subcategoryId: row.subcategoryId !== null ? Number(row.subcategoryId) : null,
                        stock: nextStock,
                        specs: {},
                    };
                    productResults.push(await fetch((API_URL) + '/api/products', {
                        method: 'POST',
                        headers: importHeaders,
                        body: JSON.stringify(payload)
                    }));
                    productCreated++;
                } else {
                    productSkipped++;
                }
            }

            const hasExpenseError = expenseUpdateResults.some((res) => !res.ok) || (expenseCreateRes && !expenseCreateRes.ok);
            const hasProductError = productResults.some((res) => !res.ok);
            if (!hasExpenseError && !hasProductError) {
                alert(
                    'Import thành công: cập nhật ' + expenseUpdates.length + ', thêm mới ' + expenseCreates.length + ' khoản chi; ' +
                    'cập nhật ' + productUpdated + ', thêm mới ' + productCreated + ' sản phẩm' +
                    (productSkipped > 0 ? '; bỏ qua ' + productSkipped + ' dòng sản phẩm thiếu dữ liệu.' : '.')
                );
                fetchData();
            } else {
                alert('Lỗi import: có dòng chưa được lưu. Kiểm tra lại file Excel rồi thử lại.');
            }
        } catch (err) { alert('Lỗi đọc file Excel: ' + (err.message || 'Lỗi định dạng')); }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;

    const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
    const fmtCompact = (n) => {
        const value = toNumber(n);
        if (Math.abs(value) >= 1000000000) return (value / 1000000000).toFixed(1).replace('.0', '') + ' tỷ';
        if (Math.abs(value) >= 1000000) return (value / 1000000).toFixed(1).replace('.0', '') + 'tr';
        if (Math.abs(value) >= 1000) return Math.round(value / 1000) + 'k';
        return String(value);
    };
    const chartStateData = Array.isArray(revenueData) ? revenueData : [];
    const chartStateHasData = chartStateData.some((item) => toNumber(item.revenue) > 0 || toNumber(item.expenses) > 0 || toNumber(item.orders) > 0);
    const chartFallbackData = [{ name: 'Tổng kỳ', revenue: rangeRevenue, expenses: totalReportExpenses, orders: rangePaidOrders.length }];
    const chartData = chartStateHasData || (rangeRevenue === 0 && totalReportExpenses === 0)
        ? chartStateData
        : chartFallbackData;
    const chartTotals = chartData.reduce((acc, item) => ({
        revenue: acc.revenue + toNumber(item.revenue),
        expenses: acc.expenses + toNumber(item.expenses),
        orders: acc.orders + toNumber(item.orders),
    }), { revenue: 0, expenses: 0, orders: 0 });
    const chartHasData = chartData.some((item) => toNumber(item.revenue) > 0 || toNumber(item.expenses) > 0 || toNumber(item.orders) > 0);
    const showChartLabels = chartData.length <= 18;
    const chartTooltipFormatter = (value, name, props) => {
        const key = props?.dataKey || name;
        const label = key === 'revenue' || name === 'Doanh thu'
            ? 'Doanh thu'
            : key === 'expenses' || name === 'Chi phí'
                ? 'Chi phí'
                : String(name);
        return [fmt(toNumber(value)), label];
    };

    const content = (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        Dashboard <span className="text-[10px] font-normal bg-slate-100 px-1.5 py-0.5 rounded text-slate-400">v{APP_VERSION}</span>
                    </h1>
                    <p className="text-sm text-slate-500">Tổng quan hoạt động kinh doanh</p>
                </div>
                <div className="flex border border-slate-200 bg-white rounded overflow-hidden self-start">
                    <button onClick={() => setActiveTab('overview')} className={'px-4 py-2 text-sm font-medium transition-colors ' + (activeTab === 'overview' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50')}>
                        Tổng quan
                    </button>
                    <button onClick={() => setActiveTab('expenses')} className={'px-4 py-2 text-sm font-medium transition-colors ' + (activeTab === 'expenses' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50')}>
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
                        <p className={'font-bold mt-1 truncate ' + (s.isNum ? 'text-2xl' : 'text-sm') + ' ' + (s.color)}>{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Khoảng dữ liệu</p>
                    <p className="text-sm font-semibold text-slate-800">{showAllRecords ? 'Tất cả dữ liệu' : reportLabel}</p>
                </div>
                <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                        Từ ngày
                        <input type="date" value={reportStartDate} max={reportEndDate > maxDate ? maxDate : reportEndDate} onChange={(e) => handleReportStartChange(e.target.value)}
                            className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#21246b]" />
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                        Đến ngày
                        <input type="date" value={reportEndDate} min={reportStartDate} max={maxDate} onChange={(e) => handleReportEndChange(e.target.value)}
                            className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#21246b]" />
                    </label>
                    <button type="button" onClick={handleShowAllData}
                        className={'rounded-lg border px-3 py-2 text-xs font-bold hover:bg-slate-50 ' + (showAllRecords ? 'border-[#21246b] text-[#21246b] bg-blue-50' : 'border-slate-300 text-slate-700')}>
                        Tất cả dữ liệu
                    </button>
                </div>
            </div>

            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800">Xu hướng Tài chính</h2>
                                    <p className="text-xs text-slate-500">So sánh biến động Doanh thu và Chi phí</p>
                                </div>
                                <div className="text-[10px] font-bold text-[#21246b] bg-slate-50 px-3 py-2 rounded-lg">
                                    {showAllRecords ? 'Tất cả dữ liệu' : reportLabel}
                                </div>
                            </div>
                            
                            <div className="mb-4 flex flex-row flex-nowrap gap-2 overflow-x-auto">
                                <div className="min-w-[160px] flex-1 rounded-lg bg-blue-50 px-3 py-2">
                                    <p className="text-[10px] font-bold uppercase text-blue-700">Doanh thu</p>
                                    <p className="text-sm font-bold text-blue-900">{fmt(chartTotals.revenue)}</p>
                                </div>
                                <div className="min-w-[160px] flex-1 rounded-lg bg-red-50 px-3 py-2">
                                    <p className="text-[10px] font-bold uppercase text-red-700">Chi phí</p>
                                    <p className="text-sm font-bold text-red-900">{fmt(chartTotals.expenses)}</p>
                                </div>
                                <div className="min-w-[160px] flex-1 rounded-lg bg-slate-50 px-3 py-2">
                                    <p className="text-[10px] font-bold uppercase text-slate-600">Đơn hàng</p>
                                    <p className="text-sm font-bold text-slate-900">{chartTotals.orders}</p>
                                </div>
                            </div>

                            <div className="h-[320px] min-h-[320px] w-full">
                                {chartHasData ? (
                                    <ResponsiveContainer width="100%" height={320}>
                                        <BarChart data={chartData} margin={{ top: 20, right: 12, left: 0, bottom: 12 }} barCategoryGap="24%">
                                            <defs>
                                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.25}/>
                                                </linearGradient>
                                                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.85}/>
                                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.25}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={fmtCompact} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                formatter={chartTooltipFormatter}
                                            />
                                            <Legend verticalAlign="top" align="right" iconType="circle" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                                            <Bar dataKey="revenue" name="Doanh thu" fill="url(#colorRev)" radius={[4, 4, 0, 0]} maxBarSize={36} minPointSize={3}>
                                                {showChartLabels && <LabelList dataKey="revenue" position="top" formatter={(v) => toNumber(v) > 0 ? fmtCompact(v) : ''} style={{ fill: '#1d4ed8', fontSize: 10, fontWeight: 700 }} />}
                                            </Bar>
                                            <Bar dataKey="expenses" name="Chi phí" fill="url(#colorExp)" radius={[4, 4, 0, 0]} maxBarSize={36} minPointSize={3}>
                                                {showChartLabels && <LabelList dataKey="expenses" position="top" formatter={(v) => toNumber(v) > 0 ? fmtCompact(v) : ''} style={{ fill: '#dc2626', fontSize: 10, fontWeight: 700 }} />}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full rounded-lg border border-dashed border-slate-200 bg-slate-50/60 flex flex-col items-center justify-center text-center px-4">
                                        <p className="text-sm font-semibold text-slate-700">Không có doanh thu hoặc chi phí trong khoảng này.</p>
                                        <p className="text-xs text-slate-500 mt-1">Bấm "Tất cả dữ liệu" hoặc mở rộng khoảng ngày để xem dữ liệu cũ.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                                <h3 className="text-sm font-bold text-slate-800 mb-4">Cơ cấu Chi phí</h3>
                                {expenseTypeStats.length > 0 ? (
                                    <>
                                        <div className="h-40">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={expenseTypeStats} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value" stroke="none">
                                                        {expenseTypeStats.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                                                    </Pie>
                                                    <Tooltip formatter={(val) => fmt(Number(val))} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="mt-4 grid grid-cols-2 gap-2">
                                            {expenseTypeStats.slice(0, 4).map((s, i) => (
                                                <div key={i} className="flex flex-col p-2 bg-slate-50 rounded-lg">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                        <span className="text-[10px] text-slate-500 font-medium truncate">{s.name}</span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-700">{fmt(s.value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-40 flex items-center justify-center text-slate-400 text-xs italic">Chưa có dữ liệu chi phí</div>
                                )}
                            </div>

                            {/* Efficiency Metrics */}
                            <div className="bg-[#21246b] p-5 rounded-xl text-white shadow-lg shadow-blue-900/20">
                                <h3 className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-4">Hiệu suất vận hành</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end border-b border-blue-800/50 pb-3">
                                        <div>
                                            <p className="text-[10px] text-blue-300 mb-0.5">Biên lợi nhuận</p>
                                            <p className="text-xl font-bold">{stats.totalRevenue > 0 ? ((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1) : 0}%</p>
                                        </div>
                                        <div className={'text-[10px] font-bold px-1.5 py-0.5 rounded ' + (stats.totalProfit >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}>
                                            {stats.totalProfit >= 0 ? 'CÓ LÃI' : 'LỖ VỐN'}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] text-blue-300">Giá trị đơn TB (AOV)</p>
                                            <p className="text-sm font-bold">{fmt(stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-blue-300">Tỷ lệ chi phí</p>
                                            <p className="text-sm font-bold text-orange-400">{stats.totalRevenue > 0 ? ((stats.totalExpenses / stats.totalRevenue) * 100).toFixed(1) : 0}%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Row: Top Products */}
                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-[#21246b]" /> Top sản phẩm bán chạy
                                </h2>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">DOANH THU CAO NHẤT</span>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {topProducts.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:border-blue-200 transition-colors bg-slate-50/30">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-100">
                                                {i + 1}
                                            </div>
                                            <div className="max-w-[140px]">
                                                <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                                                <p className="text-[10px] text-slate-500">{p.quantity} lượt bán</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-blue-700">{fmt(p.revenue)}</p>
                                            <div className="w-16 h-1 bg-slate-200 rounded-full mt-1 overflow-hidden">
                                                <div className="h-full bg-[#21246b]" style={{ width: topProducts[0]?.revenue > 0 ? ((p.revenue / topProducts[0].revenue) * 100) + '%' : '0%' }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-[#21246b]" /> Top khách hàng
                                </h2>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">MUA NHIỀU</span>
                            </div>
                            <div className="space-y-3">
                                {topCustomers.length === 0 ? (
                                    <div className="py-8 text-center text-xs italic text-slate-400">Chưa có khách hàng trong khoảng này</div>
                                ) : topCustomers.map((c, i) => (
                                    <div key={i} className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">{i + 1}</div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-slate-800 truncate">{c.name}</p>
                                                <p className="text-[10px] text-slate-500 truncate">{c.orders} đơn · {c.quantity} sản phẩm</p>
                                            </div>
                                        </div>
                                        <p className="text-xs font-bold text-[#21246b] whitespace-nowrap">{fmt(c.revenue)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col items-center justify-center text-center space-y-4 lg:col-start-3">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                                <Download className="w-8 h-8 text-[#21246b]" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Báo cáo tài chính</h3>
                                <p className="text-xs text-slate-500 mt-1 px-4">
                                    Tải file Excel để có cái nhìn chi tiết và đầy đủ nhất về mọi hoạt động thu chi.
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 mt-2">{reportLabel}</p>
                            </div>
                            <button onClick={handleExport} className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-all shadow-md">
                                XUẤT BÁO CÁO NGAY
                            </button>
                        </div>
                    </div>
                </div>
        )}

            {/* TAB: THU - CHI */}
            {activeTab === 'expenses' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Doanh thu kỳ này</p>
                            <p className="text-xl font-bold text-[#21246b]">{fmt(rangeRevenue)}</p>
                        </div>
                        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Chi phí kỳ này</p>
                            <p className="text-xl font-bold text-red-600">{fmt(totalReportExpenses)}</p>
                        </div>
                        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Lợi nhuận kỳ này</p>
                            <p className="text-xl font-bold text-green-600">{fmt(rangeProfit)}</p>
                        </div>
                        <div className="bg-[#21246b] p-4 rounded-xl shadow-md text-white flex flex-col justify-center">
                            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider mb-1">Tỷ lệ chi phí</p>
                            <p className="text-xl font-bold">
                                { rangeRevenue > 0
                                    ? ((totalReportExpenses / rangeRevenue) * 100).toFixed(1)
                                    : 0 }%
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                    {/* Form thêm chi phí */}
                    <div className="md:col-span-1">
                        <div className="bg-white border border-slate-200 p-4 rounded shadow-sm">
                            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <Plus className={'w-5 h-5 ' + (editingExpense ? 'text-[#21246b]' : 'text-[#21246b]')} /> 
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
                                        <input required type="date" value={date} max={maxDate} onChange={e => e.target.value && setDate(e.target.value > maxDate ? maxDate : e.target.value)}
                                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Ghi chú</label>
                                    <textarea value={description} onChange={e => setDescription(e.target.value)}
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm h-16" placeholder="Chi tiết..." />
                                </div>
                                <div className={editingExpense ? "grid grid-cols-2 gap-2" : ""}>
                                    {editingExpense && (
                                        <button type="button" onClick={resetExpenseForm}
                                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 rounded text-sm">
                                            Hủy
                                        </button>
                                    )}
                                    <button type="submit" disabled={isSubmitting}
                                        className={'w-full text-white font-medium py-2 rounded text-sm flex items-center justify-center ' + (editingExpense ? 'bg-[#21246b] hover:bg-[#1a1d56]' : 'bg-[#21246b] hover:bg-blue-800')}>
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
                                <input type="file" accept=".xlsx,.xls" ref={fileInputRef} onChange={handleImport} className="hidden" />
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
                            <div className="grid gap-3 border-t pt-3 lg:grid-cols-[auto_1fr_1fr_auto_auto] lg:items-center">
                                <span className="text-xs font-medium text-slate-500">Xem dữ liệu:</span>
                                <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                    Từ ngày
                                    <input type="date" value={reportStartDate} max={reportEndDate > maxDate ? maxDate : reportEndDate} onChange={(e) => handleReportStartChange(e.target.value)}
                                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs outline-none" />
                                </label>
                                <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                    Đến ngày
                                    <input type="date" value={reportEndDate} min={reportStartDate} max={maxDate} onChange={(e) => handleReportEndChange(e.target.value)}
                                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs outline-none" />
                                </label>
                                <button type="button" onClick={handleShowAllData}
                                    className={'rounded border px-2 py-1 text-xs font-bold hover:bg-slate-50 ' + (showAllRecords ? 'border-[#21246b] text-[#21246b] bg-blue-50' : 'border-slate-300 text-slate-700')}>
                                    Tất cả
                                </button>
                                <div className="text-xs font-bold text-slate-700 lg:text-right">
                                    {showAllRecords ? 'Tổng chi tất cả: ' : 'Tổng chi kỳ này: '}
                                    <span className="text-red-600">{new Intl.NumberFormat('vi-VN').format(totalFilteredExpenses)}đ</span>
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
                                            <tr key={exp.id} className={'border-b border-slate-100 hover:bg-slate-50 ' + (editingExpense?.id === exp.id ? 'bg-blue-50' : '')}>
                                                <td className="px-4 py-3 text-sm text-slate-500">{(parseDateValue(getExpenseDateValue(exp)) || new Date()).toLocaleDateString('vi-VN')}</td>
                                                <td className="px-4 py-3">
                                                    <p className="text-sm font-medium text-slate-800">{exp.title}</p>
                                                    {exp.description && <p className="text-xs text-slate-400 truncate max-w-xs">{exp.description}</p>}
                                                </td>
                                                <td className="px-4 py-3 text-xs">
                                                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded">{getExpenseTypeLabel(exp)}</span>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-semibold text-red-600 text-right whitespace-nowrap">
                                                    -{new Intl.NumberFormat('vi-VN').format(toNumber(exp.amount))}đ
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => handleEditClick(exp)} className="text-slate-400 hover:text-blue-600 transition-colors">
                                                            <Pencil className="w-4 h-4" />
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
                </div>
            )}
        </div>
);
    return content;
}
