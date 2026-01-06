'use client';
import { API_URL } from '@/config';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Loader2, Star, MessageSquare, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Review {
    id: number;
    rating: number;
    comment?: string;
    createdAt: string;
    user: {
        id: number;
        name?: string;
        email: string;
    };
    product: {
        id: number;
        name: string;
        slug: string;
        image: string;
    };
}

export default function ReviewsPage() {
    const { token } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterRating, setFilterRating] = useState<number | ''>('');

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const res = await fetch(`${API_URL}/api/reviews`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setReviews(data);
        } catch (error) {
            console.error('Failed to fetch reviews', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteReview = async (id: number) => {
        if (!confirm('Xác nhận xóa đánh giá này?')) return;
        await fetch(`${API_URL}/api/reviews/admin/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchReviews();
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredReviews = filterRating
        ? reviews.filter(r => r.rating === filterRating)
        : reviews;

    const stats = {
        total: reviews.length,
        avg: reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0',
        distribution: [5, 4, 3, 2, 1].map(rating => ({
            rating,
            count: reviews.filter(r => r.rating === rating).length
        }))
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#21246b]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Quản lý Đánh giá</h1>
                <p className="text-slate-500 font-normal">Xem và quản lý đánh giá sản phẩm từ khách hàng</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <div className="text-3xl font-bold text-[#21246b]">{stats.total}</div>
                        <div className="text-sm text-slate-500 font-normal">Tổng đánh giá</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <div className="flex items-center justify-center gap-1">
                            <span className="text-3xl font-bold text-[#21246b]">{stats.avg}</span>
                            <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                        </div>
                        <div className="text-sm text-slate-500 font-normal">Điểm trung bình</div>
                    </CardContent>
                </Card>
                <Card className="md:col-span-2">
                    <CardContent className="pt-6">
                        <div className="text-sm text-slate-500 font-normal mb-2">Phân bố đánh giá</div>
                        <div className="flex gap-4">
                            {stats.distribution.map(d => (
                                <div key={d.rating} className="flex items-center gap-1">
                                    <span className="text-sm font-medium">{d.rating}</span>
                                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                    <span className="text-sm text-slate-500 font-normal">({d.count})</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
                <button
                    onClick={() => setFilterRating('')}
                    className={`px-4 py-2 rounded-lg text-sm ${filterRating === '' ? 'bg-[#21246b] text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                    Tất cả
                </button>
                {[5, 4, 3, 2, 1].map(r => (
                    <button
                        key={r}
                        onClick={() => setFilterRating(r)}
                        className={`px-4 py-2 rounded-lg text-sm flex items-center gap-1 ${filterRating === r ? 'bg-[#21246b] text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                        {r} <Star className={`h-3 w-3 ${filterRating === r ? 'text-white fill-white' : 'text-yellow-400 fill-yellow-400'}`} />
                    </button>
                ))}
            </div>

            {/* Reviews List */}
            <Card>
                <CardContent className="pt-6">
                    {filteredReviews.length === 0 ? (
                        <p className="text-center text-slate-400 font-normal py-8">Chưa có đánh giá nào</p>
                    ) : (
                        <div className="space-y-4">
                            {filteredReviews.map(review => (
                                <div key={review.id} className="border-b pb-4 last:border-0">
                                    <div className="flex gap-4">
                                        {/* Product Image */}
                                        <img
                                            src={review.product.image}
                                            alt={review.product.name}
                                            className="h-16 w-16 object-cover rounded"
                                        />

                                        {/* Review Content */}
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-medium text-slate-800">{review.product.name}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="flex">
                                                            {[1, 2, 3, 4, 5].map(s => (
                                                                <Star
                                                                    key={s}
                                                                    className={`h-4 w-4 ${s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`}
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-sm text-slate-500 font-normal">
                                                            {formatDate(review.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => deleteReview(review.id)}
                                                    className="p-2 hover:bg-red-50 rounded"
                                                    title="Xóa đánh giá"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </button>
                                            </div>

                                            {review.comment && (
                                                <p className="mt-2 text-sm text-slate-600 flex items-start gap-2">
                                                    <MessageSquare className="h-4 w-4 mt-0.5 text-slate-400 font-normal" />
                                                    {review.comment}
                                                </p>
                                            )}

                                            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500 font-normal">
                                                <User className="h-4 w-4" />
                                                <span>{review.user.name || review.user.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

