"use client";
import { API_URL } from '@/config';
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { User, ShoppingBag, Loader2, Star, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Product {
    id: number;
    name: string;
    image: string;
    price: number;
}

interface OrderItem {
    id: number;
    quantity: number;
    price: number;
    product: Product;
    productId: number;
}

interface Review {
    id: number;
    rating: number;
    comment: string;
    productId: number;
    userId: number;
    createdAt: string;
}

interface Order {
    id: number;
    total: number;
    status: string;
    paymentContent: string;
    createdAt: string;
    discount?: number;
    items: OrderItem[];
}

interface ProfileData {
    id: number;
    email: string;
    name: string | null;
    createdAt: string;
    orders: Order[];
    reviews?: Review[];
}

export default function ProfilePage() {
    const { user, token, isLoading, logout } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    // Debug Version
    useEffect(() => {
        console.log('ProfilePage Version: 1.0.5 (Normal Font & Toast)');
    }, []);

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [activeTab, setActiveTab] = useState<'info' | 'orders'>('info');

    // Edit Profile State
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [saving, setSaving] = useState(false);

    // Review Modal State
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [reviewingProduct, setReviewingProduct] = useState<Product | null>(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) router.push('/login');
    }, [user, isLoading, router]);

    useEffect(() => {
        if (token) {
            fetch(`${API_URL}/api/auth/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    setProfile(data);
                    setEditName(data.name || '');
                })
                .catch(console.error)
                .finally(() => setLoadingProfile(false));
        }
    }, [token]);

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            await fetch(`${API_URL}/api/auth/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: editName })
            });
            setProfile(prev => prev ? { ...prev, name: editName } : null);
            setIsEditing(false);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleOpenReview = (order: Order) => {
        setSelectedOrder(order);
        setReviewModalOpen(true);
        setReviewingProduct(null); // Reset product selection
    };

    const handleProductReviewClick = (product: Product) => {
        setReviewingProduct(product);
        setRating(5);
        setComment('');
    };

    const handleSubmitReview = async () => {
        if (!reviewingProduct) return;
        setSubmittingReview(true);
        try {
            const res = await fetch(`${API_URL}/api/reviews/product/${reviewingProduct.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ rating, comment })
            });

            if (res.ok) {
                const newReview = await res.json();
                // Update local profile reviews to reflect change
                setProfile(prev => prev ? {
                    ...prev,
                    reviews: [...(prev.reviews || []), newReview]
                } : null);

                // Reset form
                setReviewingProduct(null);
                // Reset form
                setReviewingProduct(null);
                showToast('Đánh giá thành công!');
                setReviewModalOpen(false); // Close modal on success
            } else {
                const errorData = await res.json().catch(() => ({}));
                const errorMessage = errorData.message || 'Có lỗi xảy ra khi gửi đánh giá';
                showToast(`Không thể gửi đánh giá: ${errorMessage}`);
            }
        } catch (error: any) {
            console.error(error);
            showToast(`Lỗi kết nối: ${error.message}`);
        } finally {
            setSubmittingReview(false);
        }
    };

    const isReviewed = (productId: number) => {
        return profile?.reviews?.some(r => r.productId === productId);
    };

    if (isLoading || loadingProfile) {
        return (
            <main className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
            </main>
        );
    }

    if (!user || !profile) return null;

    const orders = [...(profile.orders || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const paidOrders = orders.filter(o => ['Đã thanh toán', 'Đang chuẩn bị', 'Đang giao', 'Đã giao'].includes(o.status));
    const totalSpent = paidOrders.reduce((sum, o) => sum + o.total, 0);

    const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';
    const formatDate = (date: string) => new Date(date).toLocaleDateString('vi-VN');

    return (
        <>
            <Header />
            <main className="min-h-screen bg-gray-50 pt-24 pb-12">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Sidebar Menu */}
                        <div className="w-full md:w-1/4">
                            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
                                <div className="flex items-center gap-3 mb-6 p-2 border-b pb-4">
                                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                                        {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-medium truncate">{profile.name || 'Thành viên'}</p>
                                        <p className="text-xs text-gray-500 truncate">{profile.email}</p>
                                    </div>
                                </div>

                                <nav className="space-y-1">
                                    <button
                                        onClick={() => setActiveTab('info')}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                                            activeTab === 'info'
                                                ? "bg-blue-50 text-blue-700"
                                                : "text-gray-700 hover:bg-gray-100"
                                        )}
                                    >
                                        <User className="h-4 w-4" />
                                        Thông tin cá nhân
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('orders')}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                                            activeTab === 'orders'
                                                ? "bg-blue-50 text-blue-700"
                                                : "text-gray-700 hover:bg-gray-100"
                                        )}
                                    >
                                        <ShoppingBag className="h-4 w-4" />
                                        Lịch sử đơn hàng
                                    </button>
                                </nav>

                                <div className="mt-6 pt-4 border-t">
                                    <Button variant="ghost" onClick={logout} className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                                        Đăng xuất
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="w-full md:w-3/4">
                            {activeTab === 'info' ? (
                                <div className="bg-white rounded-lg shadow-sm p-6">
                                    <h2 className="text-xl font-bold mb-6">Thông tin cá nhân</h2>
                                    <div className="space-y-6 max-w-lg">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                            <input
                                                type="email"
                                                value={profile.email}
                                                disabled
                                                className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                                            {isEditing ? (
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                        placeholder="Nhập họ tên của bạn"
                                                    />
                                                    <Button onClick={handleSaveProfile} disabled={saving}>
                                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lưu'}
                                                    </Button>
                                                    <Button variant="outline" onClick={() => setIsEditing(false)}>Hủy</Button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-between items-center group">
                                                    <p className="py-2 text-gray-900">{profile.name || 'Chưa cập nhật'}</p>
                                                    <Button variant="link" onClick={() => setIsEditing(true)} className="text-blue-600 p-0 h-auto">
                                                        Thay đổi
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tham gia</label>
                                            <p className="py-2 text-gray-900">{formatDate(profile.createdAt)}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white p-5 rounded-lg shadow-sm border border-blue-100">
                                            <p className="text-sm text-gray-500 mb-1">Tổng tiền đã chi</p>
                                            <p className="text-2xl font-bold text-blue-600">{formatPrice(totalSpent)}</p>
                                        </div>
                                        <div className="bg-white p-5 rounded-lg shadow-sm border border-blue-100">
                                            <p className="text-sm text-gray-500 mb-1">Tổng đơn hàng</p>
                                            <p className="text-2xl font-bold text-gray-900">{orders.length} đơn</p>
                                        </div>
                                    </div>

                                    {/* Order List */}
                                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                        <div className="p-4 border-b">
                                            <h3 className="font-bold">Đơn hàng gần đây</h3>
                                        </div>
                                        {orders.length === 0 ? (
                                            <div className="p-12 text-center text-gray-500">
                                                <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                                <p>Bạn chưa có đơn hàng nào</p>
                                                <Link href="/" className="text-blue-600 hover:underline mt-2 inline-block">
                                                    Mua sắm ngay
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="divide-y">
                                                {orders.map(order => (
                                                    <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-bold text-lg">#{order.paymentContent}</span>
                                                                    <span className={cn(
                                                                        "px-2 py-0.5 rounded text-xs font-medium",
                                                                        order.status === 'Đã hủy' ? "bg-red-100 text-red-700" :
                                                                            order.status === 'Đã giao' ? "bg-green-100 text-green-700" :
                                                                                "bg-yellow-100 text-yellow-700"
                                                                    )}>
                                                                        {order.status}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-bold text-blue-600">{formatPrice(order.total)}</p>
                                                                <p className="text-xs text-gray-500">{order.items.length} sản phẩm</p>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3 mb-4">
                                                            {order.items.slice(0, 2).map(item => (
                                                                <div key={item.id} className="flex gap-3 text-sm">
                                                                    <img src={item.product?.image} alt="" className="w-12 h-12 object-cover rounded border" />
                                                                    <div className="flex-1">
                                                                        <p className="font-medium line-clamp-1">{item.product?.name}</p>
                                                                        <p className="text-gray-500">x{item.quantity}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {order.items.length > 2 && (
                                                                <p className="text-xs text-gray-500 pl-16">Xem thêm {order.items.length - 2} sản phẩm...</p>
                                                            )}
                                                        </div>

                                                        <div className="flex justify-end gap-3 pt-3 border-t">
                                                            <Link href={`/order/${order.id}`}>
                                                                <Button variant="outline" size="sm">Chi tiết</Button>
                                                            </Link>
                                                            {order.status === 'Đã giao' && (
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                                                    onClick={() => handleOpenReview(order)}
                                                                >
                                                                    <Star className="h-4 w-4 mr-1" /> Đánh giá
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />

            {/* Review Modal */}
            {reviewModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="font-normal text-lg">Đánh giá đơn hàng #{selectedOrder.paymentContent}</h3>
                            <button onClick={() => setReviewModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-4">
                            {!reviewingProduct ? (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-600 mb-2">Chọn sản phẩm để viết đánh giá:</p>
                                    {selectedOrder.items.map(item => (
                                        <div key={item.id} className="flex gap-4 p-3 border rounded hover:bg-gray-50 transition-colors items-center">
                                            <img src={item.product?.image} alt="" className="w-16 h-16 object-cover rounded" />
                                            <div className="flex-1">
                                                <p className="font-medium line-clamp-1">{item.product?.name}</p>
                                                {isReviewed(item.productId) ? (
                                                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                                        <Star className="h-3 w-3 fill-green-600" /> Đã đánh giá
                                                    </span>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="mt-2 h-8"
                                                        onClick={() => handleProductReviewClick(item.product)}
                                                    >
                                                        Viết đánh giá
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <button
                                        onClick={() => setReviewingProduct(null)}
                                        className="text-sm text-blue-600 hover:underline mb-2"
                                    >
                                        &larr; Quay lại danh sách
                                    </button>

                                    <div className="flex gap-3 mb-4">
                                        <img src={reviewingProduct.image} alt="" className="w-16 h-16 object-cover rounded" />
                                        <div>
                                            <p className="font-medium">{reviewingProduct.name}</p>
                                            <p className="text-sm text-gray-500">Đánh giá sản phẩm này</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-normal mb-1">Chất lượng sản phẩm</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setRating(star)}
                                                    className="focus:outline-none transition-transform hover:scale-110"
                                                >
                                                    <Star
                                                        className={cn(
                                                            "h-8 w-8",
                                                            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                                        )}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {rating === 5 ? 'Tuyệt vời' : rating === 4 ? 'Hài lòng' : rating === 3 ? 'Bình thường' : rating === 2 ? 'Không hài lòng' : 'Tệ'}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-normal mb-1">Nhận xét của bạn</label>
                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            rows={4}
                                            className="w-full border rounded-md p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm này..."
                                        ></textarea>
                                    </div>

                                    <div className="pt-2">
                                        <Button className="w-full" onClick={handleSubmitReview} disabled={submittingReview}>
                                            {submittingReview ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                            Gửi đánh giá
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
