"use client";
import { API_URL } from '@/config';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, X, Package, User, Phone, Calendar, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

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
    items: OrderItem[];
}

export default function AdminOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    useEffect(() => { fetchOrders(); }, []);

    const fetchOrders = async () => {
        const res = await fetch(`${API_URL}/api/orders/all`);
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    const updateStatus = async (id: number, status: string) => {
        await fetch(`${API_URL}/api/orders/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        fetchOrders();
    };

    const getStatusBadge = (status: string) => {
        const styles: any = {
            'Chờ thanh toán': 'bg-yellow-100 text-yellow-700',
            'Đã thanh toán': 'bg-blue-100 text-blue-700',
            'Đang chuẩn bị': 'bg-orange-100 text-orange-700',
            'Đang giao hàng': 'bg-purple-100 text-purple-700',
            'Đã giao thành công': 'bg-green-100 text-green-700',
            'Hoàn hàng': 'bg-red-100 text-red-700',
            'Đã hủy': 'bg-slate-100 text-slate-700'
        };
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-100'}`}>{status}</span>;
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Quản lý đơn hàng</h1>
                <p className="text-slate-500">Xem và cập nhật trạng thái đơn hàng - Nhấn vào mã đơn để xem chi tiết</p>
            </div>

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
                                    <p><span className="text-slate-500">Họ tên:</span> <strong>{selectedOrder.customerName || 'N/A'}</strong></p>
                                    <p className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-slate-400" />
                                        {selectedOrder.customerPhone || 'Không có SĐT'}
                                    </p>
                                    {selectedOrder.customerAddress && (
                                        <p><span className="text-slate-500">📍 Địa chỉ:</span> {selectedOrder.customerAddress}</p>
                                    )}
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-[#21246b]" /> Thông tin đơn hàng
                                    </h3>
                                    <p><span className="text-slate-500">Mã đơn:</span> <strong className="text-[#21246b]">{selectedOrder.paymentContent}</strong></p>
                                    <p><span className="text-slate-500">Ngày tạo:</span> {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
                                    <p><span className="text-slate-500">Trạng thái:</span> {getStatusBadge(selectedOrder.status)}</p>
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
                                                <p className="text-sm text-slate-500">Đơn giá: ${item.product?.price}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-slate-500">x{item.quantity}</p>
                                                <p className="font-bold">${(item.product?.price || 0) * item.quantity}</p>
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
                                <span className="text-2xl font-bold text-[#21246b]">${selectedOrder.total}</span>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <select
                                    value={selectedOrder.status}
                                    onChange={(e) => {
                                        updateStatus(selectedOrder.id, e.target.value);
                                        setSelectedOrder({ ...selectedOrder, status: e.target.value });
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
                            <tr className="border-b text-left text-sm text-slate-500">
                                <th className="pb-3">Mã đơn</th>
                                <th className="pb-3">Khách hàng</th>
                                <th className="pb-3">Tổng tiền</th>
                                <th className="pb-3">Trạng thái</th>
                                <th className="pb-3">Ngày tạo</th>
                                <th className="pb-3">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(o => (
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
                                        <p className="text-sm text-slate-500">{o.customerPhone}</p>
                                    </td>
                                    <td className="py-4 font-bold">${o.total}</td>
                                    <td className="py-4">{getStatusBadge(o.status)}</td>
                                    <td className="py-4 text-slate-500">{new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
                                    <td className="py-4">
                                        <select
                                            value={o.status}
                                            onChange={(e) => updateStatus(o.id, e.target.value)}
                                            className="border rounded px-2 py-1 text-sm"
                                        >
                                            <option value="PENDING">Chờ thanh toán</option>
                                            <option value="PAID">Đã thanh toán</option>
                                            <option value="CANCELLED">Đã hủy</option>
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
