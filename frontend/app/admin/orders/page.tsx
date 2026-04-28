"use client";
import { API_URL } from '@/config';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, X, Package, User, Phone, Calendar, DollarSign } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import CreateOrder from "@/components/admin/CreateOrder";
import { useToast, ToastContainer } from "@/components/Toast";

interface OrderItem {
    id: number;
    quantity: number;
    price: number;
    product: {
        id: number;
        name: string;
        image: string;
        price: number;
    };
}

interface Order {
    id: number;
    total: number;
    status: string;
    paymentContent: string;
    customerName: string | null;
    customerPhone: string | null;
    customerAddress: string | null;
    note: string | null;
    createdAt: string;
    updatedAt: string;
    items: OrderItem[];
}

type TabType = 'all' | 'pending' | 'completed-today';

// Trạng thái coi là "chưa hoàn thành"
const PENDING_STATUSES = ['Chờ thanh toán', 'Đã thanh toán', 'Đang chuẩn bị', 'Đang giao hàng', 'Đang giao'];
// Trạng thái coi là "đã hoàn thành"
const COMPLETED_STATUSES = ['Đã giao thành công', 'Đã giao', 'Hoàn thành'];
// Trạng thái đã hủy
const CANCELLED_STATUSES = ['Đã hủy', 'Hoàn hàng'];

export default function AdminOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [showCreateOrder, setShowCreateOrder] = useState(false);
    const toast = useToast();

    useEffect(() => { fetchOrders(); }, []);

    const fetchOrders = async () => {
        const res = await fetch(`${API_URL}/api/orders/all`);
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    const updateStatus = async (id: number, status: string) => {
        try {
            const res = await fetch(`${API_URL}/api/orders/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                toast.showToast(data?.message || 'Không thể cập nhật trạng thái đơn hàng', 'error');
                fetchOrders();
                return false;
            }

            fetchOrders();
            return true;
        } catch (error) {
            toast.showToast('Lỗi kết nối', 'error');
            fetchOrders();
            return false;
        }
    };

    const confirmPayment = async (id: number) => {
        try {
            const res = await fetch(`${API_URL}/api/sepay/confirm-payment/${id}`, {
                method: 'POST',
            });
            const data = await res.json();
            if (data.success) {
                toast.showToast('Đã cập nhật thanh toán thành công!', 'success');
                fetchOrders();
            } else {
                toast.showToast(data.message || 'Lỗi khi cập nhật thanh toán', 'error');
            }
        } catch (error) {
            toast.showToast('Lỗi kết nối', 'error');
        }
    };

    // Tính toán số liệu
    const { pendingOrders, completedTodayOrders, filteredOrders } = useMemo(() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

        // Đơn cần xử lý: không phải Hoàn thành và không phải Đã hủy
        const pending = orders.filter(o =>
            PENDING_STATUSES.includes(o.status)
        );

        // Đã xử lý hôm nay: đơn có thay đổi trạng thái trong ngày hôm nay (dựa vào updatedAt)
        const completedToday = orders.filter(o => {
            const updatedAt = new Date(o.updatedAt);
            return updatedAt >= todayStart && updatedAt <= todayEnd;
        });

        // Filter theo tab
        let filtered = orders;
        if (activeTab === 'pending') {
            filtered = pending;
        } else if (activeTab === 'completed-today') {
            filtered = completedToday;
        }

        return {
            pendingOrders: pending,
            completedTodayOrders: completedToday,
            filteredOrders: filtered
        };
    }, [orders, activeTab]);

    const getStatusBadge = (status: string) => {
        const styles: any = {
            'Chờ thanh toán': 'text-yellow-600 font-medium',
            'Đã thanh toán': 'text-blue-600 font-medium',
            'Đang chuẩn bị': 'text-orange-600 font-medium',
            'Đang giao hàng': 'text-purple-600 font-medium',
            'Đang giao': 'text-purple-600 font-medium',
            'Đã giao thành công': 'text-green-600 font-medium',
            'Đã giao': 'text-green-600 font-medium',
            'Hoàn thành': 'text-green-700 font-bold',
            'Hoàn hàng': 'text-red-600 font-medium',
            'Đã hủy': 'text-slate-500 font-medium'
        };
        return <span className={`text-sm ${styles[status] || 'text-slate-600'}`}>{status}</span>;
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Quản lý đơn hàng</h1>
                        <p className="text-slate-500 font-normal">Xem và cập nhật trạng thái đơn hàng</p>
                    </div>
                </div>



                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card
                        className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'pending' ? 'ring-2 ring-orange-500' : ''}`}
                        onClick={() => setActiveTab(activeTab === 'pending' ? 'all' : 'pending')}
                    >
                        <CardContent className="pt-6 pb-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-slate-500 font-normal">Cần xử lý</p>
                                    <p className="text-3xl font-bold text-orange-600">{pendingOrders.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'completed-today' ? 'ring-2 ring-green-500' : ''}`}
                        onClick={() => setActiveTab(activeTab === 'completed-today' ? 'all' : 'completed-today')}
                    >
                        <CardContent className="pt-6 pb-4">
                            <p className="text-sm text-slate-500 font-normal">Đã xử lý hôm nay</p>
                            <p className="text-3xl font-bold text-green-600">{completedTodayOrders.length}</p>
                        </CardContent>
                    </Card>

                    <Card className="cursor-pointer transition-all hover:shadow-md" onClick={() => setActiveTab('all')}>
                        <CardContent className="pt-6 pb-4">
                            <p className="text-sm text-slate-500 font-normal">Tổng đơn hàng</p>
                            <p className="text-3xl font-bold text-slate-700">{orders.length}</p>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Button
                        className="bg-[#22246b] hover:bg-[#1a1d55] text-white font-normal rounded-none px-6 py-2 text-sm"
                        onClick={() => setShowCreateOrder(!showCreateOrder)}
                    >
                        {showCreateOrder ? 'Đóng' : '+ Tạo đơn'}
                    </Button>
                </div>

                {showCreateOrder && (
                    <div className="border border-slate-200 overflow-hidden">
                        <CreateOrder
                            onClose={() => setShowCreateOrder(false)}
                            onSuccess={() => {
                                fetchOrders();
                                setShowCreateOrder(false);
                                toast.showToast('Đơn hàng đã được tạo thành công!', 'success');
                            }}
                        />
                    </div>
                )}

                {/* Active Filter Indicator */}
                {activeTab !== 'all' && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg">
                        <span className="text-sm text-slate-600 font-normal">
                            Đang lọc: {activeTab === 'pending' ? 'Cần xử lý' : 'Đã xử lý hôm nay'}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab('all')} className="ml-auto text-slate-600 hover:text-slate-800">
                            Xem tất cả
                        </Button>
                    </div>
                )}

                {/* Order Detail Modal */}
                {selectedOrder && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
                            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white z-10">
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-[#21246b]" />
                                    Chi tiết đơn hàng #{selectedOrder.paymentContent}
                                </CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)}>
                                    <X className="h-5 w-5" />
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Order Info */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <User className="h-4 w-4 text-[#21246b]" /> Thông tin khách hàng
                                        </h3>
                                        <p><span className="text-slate-500 font-normal">Họ tên:</span> <strong>{selectedOrder.customerName || 'N/A'}</strong></p>
                                        <p className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-slate-400 font-normal" />
                                            {selectedOrder.customerPhone || 'Không có SĐT'}
                                        </p>
                                        {selectedOrder.customerAddress && (
                                            <p><span className="text-slate-500 font-normal">📍 Địa chỉ:</span> {selectedOrder.customerAddress}</p>
                                        )}
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-[#21246b]" /> Thông tin đơn hàng
                                        </h3>
                                        <p><span className="text-slate-500 font-normal">Mã đơn:</span> <strong className="text-[#21246b]">{selectedOrder.paymentContent}</strong></p>
                                        <p><span className="text-slate-500 font-normal">Ngày tạo:</span> {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
                                        <p><span className="text-slate-500 font-normal">Trạng thái:</span> {getStatusBadge(selectedOrder.status)}</p>
                                    </div>
                                </div>

                                {/* Note */}
                                {selectedOrder.note && (
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                        <h3 className="font-semibold text-amber-800 mb-1">📝 Ghi chú từ khách hàng</h3>
                                        <p className="text-amber-700">{selectedOrder.note}</p>
                                    </div>
                                )}

                                {/* Order Items */}
                                <div>
                                    <h3 className="font-semibold mb-3">📦 Sản phẩm trong đơn</h3>
                                    <div className="space-y-3">
                                        {selectedOrder.items?.map(item => (
                                            <div key={item.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                                                <div
                                                    className="w-16 h-16 bg-slate-200 rounded-lg bg-cover bg-center flex-shrink-0"
                                                    style={{ backgroundImage: `url(${item.product?.image?.startsWith('http') ? item.product.image : `${API_URL}${item.product?.image}`})` }}
                                                />
                                                <div className="flex-1">
                                                    <p className="font-medium">{item.product?.name || 'Sản phẩm không xác định'}</p>
                                                    <p className="text-sm text-slate-500 font-normal">Đơn giá: {new Intl.NumberFormat('vi-VN').format(item.product?.price || 0)}đ</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-slate-500 font-normal">x{item.quantity}</p>
                                                    <p className="font-bold">{new Intl.NumberFormat('vi-VN').format((item.product?.price || 0) * item.quantity)}đ</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="flex items-center justify-between p-4 bg-[#21246b]/10 rounded-xl">
                                    <span className="text-lg font-semibold flex items-center gap-2">
                                        <DollarSign className="h-5 w-5 text-[#21246b]" /> Tổng cộng
                                    </span>
                                    <span className="text-2xl font-bold text-[#21246b]">{new Intl.NumberFormat('vi-VN').format(selectedOrder.total)}đ</span>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <select
                                        value={selectedOrder.status}
                                        onChange={async (e) => {
                                            const nextStatus = e.target.value;
                                            const updated = await updateStatus(selectedOrder.id, nextStatus);
                                            if (updated) {
                                                setSelectedOrder({ ...selectedOrder, status: nextStatus });
                                            }
                                        }}
                                        className="flex-1 border rounded-lg px-4 py-2"
                                    >
                                        <option value="Chờ thanh toán">Chờ thanh toán</option>
                                        <option value="Đã thanh toán">Đã thanh toán</option>
                                        <option value="Đang chuẩn bị">Đang chuẩn bị</option>
                                        <option value="Đang giao hàng">Đang giao hàng</option>
                                        <option value="Đã giao thành công">Đã giao thành công</option>
                                        <option value="Hoàn hàng">Hoàn hàng</option>
                                        <option value="Đã hủy">Đã hủy</option>
                                    </select>
                                    <Button onClick={() => setSelectedOrder(null)}>Đóng</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <Card>
                    <CardContent className="pt-6">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-left text-sm text-slate-500 font-normal">
                                    <th className="pb-3">Mã đơn</th>
                                    <th className="pb-3">Khách hàng</th>
                                    <th className="pb-3">Tổng tiền</th>
                                    <th className="pb-3">Trạng thái</th>
                                    <th className="pb-3">Ngày tạo</th>
                                    <th className="pb-3">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map(o => (
                                    <tr key={o.id} className="border-b hover:bg-slate-50">
                                        <td className="py-4">
                                            <Link
                                                href={`/admin/orders/${o.id}`}
                                                className="font-medium text-[#21246b] hover:underline"
                                            >
                                                {o.paymentContent}
                                            </Link>
                                        </td>
                                        <td className="py-4">
                                            <p className="font-medium">{o.customerName || 'N/A'}</p>
                                            <p className="text-sm text-slate-500 font-normal">{o.customerPhone}</p>
                                        </td>
                                        <td className="py-4 font-bold">{new Intl.NumberFormat('vi-VN').format(o.total)}đ</td>
                                        <td className="py-4">{getStatusBadge(o.status)}</td>
                                        <td className="py-4 text-slate-500 font-normal">{new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
                                        <td className="py-4">
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={o.status}
                                                    onChange={(e) => updateStatus(o.id, e.target.value)}
                                                    className="border rounded px-2 py-1 text-sm"
                                                >
                                                    <option value="Chờ thanh toán">Chờ thanh toán</option>
                                                    <option value="Đã thanh toán">Đã thanh toán</option>
                                                    <option value="Đang chuẩn bị">Đang chuẩn bị</option>
                                                    <option value="Đang giao">Đang giao</option>
                                                    <option value="Đã giao">Đã giao</option>
                                                    <option value="Đã hủy">Đã hủy</option>
                                                </select>
                                                {o.status === 'Chờ thanh toán' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-blue-600 border-blue-600 hover:bg-blue-50 h-7 px-2 text-xs whitespace-nowrap"
                                                        onClick={() => confirmPayment(o.id)}
                                                        title="Kiểm tra tiền về & Cập nhật thanh toán"
                                                    >
                                                        Check Bank
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {showCreateOrder && (
                    <div className="hidden"></div>
                )}

            </div>
            <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
        </>
    );
}

