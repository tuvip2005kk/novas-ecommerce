"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Star, User, CheckCircle, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";

interface Review {
    id: number;
    rating: number;
    comment: string | null;
    createdAt: string;
    user: { id: number; name: string | null; email: string };
}

interface ReviewStats {
    averageRating: number;
    totalReviews: number;
    distribution: { [key: number]: number };
}

export function ReviewsSection({ productId, productName }: { productId: number; productName?: string }) {
    const { user, token } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);
    const [canReview, setCanReview] = useState(false);
    const [checkingPermission, setCheckingPermission] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, [productId]);

    useEffect(() => {
        if (token && user) {
            checkCanReview();
        }
    }, [token, user, productId]);

    const fetchReviews = async () => {
        try {
            const [reviewsRes, statsRes] = await Promise.all([
                fetch(`http://localhost:3005/reviews/product/${productId}`),
                fetch(`http://localhost:3005/reviews/product/${productId}/stats`)
            ]);
            setReviews(await reviewsRes.json());
            setStats(await statsRes.json());
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const checkCanReview = async () => {
        setCheckingPermission(true);
        try {
            const res = await fetch(`http://localhost:3005/reviews/product/${productId}/can-review`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            setCanReview(result === true);
        } catch (error) {
            console.error(error);
            setCanReview(false);
        } finally {
            setCheckingPermission(false);
        }
    };

    const submitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return alert('Vui lòng đăng nhập để đánh giá');
        setSubmitting(true);
        setSubmitError('');
        try {
            const res = await fetch(`http://localhost:3005/reviews/product/${productId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ rating, comment })
            });
            if (!res.ok) {
                const error = await res.json();
                setSubmitError(error.message || 'Không thể gửi đánh giá');
                return;
            }
            setComment('');
            setRating(5);
            setShowForm(false);
            fetchReviews();
        } catch (error) {
            setSubmitError('Lỗi kết nối');
        } finally {
            setSubmitting(false);
        }
    };

    const ratingLabels = ['Rất tệ', 'Không tệ', 'Trung bình', 'Tốt', 'Tuyệt vời'];

    if (loading) {
        return <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    }

    return (
        <div id="reviews" className="bg-white border-t border-slate-200 py-8">
            <div className="max-w-[1200px] mx-auto px-4">
                {/* Title */}
                <h2 className="text-xl font-bold text-slate-900 mb-6">
                    {stats?.totalReviews || 0} đánh giá cho <span className="text-[#21246b]">{productName || 'sản phẩm'}</span>
                </h2>

                {/* Stats Box */}
                <div className="bg-slate-50 border border-slate-200 p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Average Rating */}
                        <div className="flex items-center gap-3 md:border-r md:pr-6 border-slate-200">
                            <div className="text-center">
                                <div className="text-4xl font-bold text-[#21246b] flex items-center gap-1">
                                    {stats?.averageRating.toFixed(1) || '0.0'}
                                    <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                                </div>
                                <p className="text-sm text-slate-600 font-medium">Đánh giá trung bình</p>
                            </div>
                        </div>

                        {/* Distribution Bars */}
                        <div className="flex-1 space-y-2">
                            {[5, 4, 3, 2, 1].map(star => {
                                const count = stats?.distribution[star] || 0;
                                const total = stats?.totalReviews || 0;
                                const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                                return (
                                    <div key={star} className="flex items-center gap-3 text-sm">
                                        <span className="w-4 font-medium">{star}</span>
                                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                        <div className="flex-1 h-3 bg-slate-200 rounded overflow-hidden">
                                            <div
                                                className="h-full bg-yellow-500 transition-all"
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                        <span className="w-24 text-slate-600">
                                            <strong>{percent}%</strong> | {count} đánh giá
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Review Button */}
                        <div className="flex items-center justify-center md:border-l md:pl-6 border-slate-200">
                            {user ? (
                                checkingPermission ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : canReview ? (
                                    <button
                                        onClick={() => setShowForm(!showForm)}
                                        className="px-6 py-3 bg-[#21246b] text-white font-medium hover:bg-[#1a1d55] transition-colors"
                                    >
                                        Đánh giá ngay
                                    </button>
                                ) : (
                                    <div className="text-center text-sm text-slate-500">
                                        <p>Mua hàng để đánh giá</p>
                                    </div>
                                )
                            ) : (
                                <a href="/login" className="px-6 py-3 bg-[#21246b] text-white font-medium hover:bg-[#1a1d55] transition-colors">
                                    Đăng nhập để đánh giá
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Review Form */}
                {showForm && canReview && (
                    <div className="bg-blue-50 border border-blue-200 p-6 mb-6">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Đánh giá {productName || 'sản phẩm'}
                        </h3>
                        {submitError && (
                            <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm">
                                {submitError}
                            </div>
                        )}
                        <form onSubmit={submitReview}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Bạn cảm thấy thế nào về sản phẩm? (Chọn sao)</label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            className={`px-3 py-2 border transition-colors ${star <= (hoverRating || rating)
                                                    ? 'bg-yellow-500 text-white border-yellow-500'
                                                    : 'bg-white border-slate-300 hover:border-yellow-500'
                                                }`}
                                        >
                                            {ratingLabels[star - 1]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Mời bạn chia sẻ thêm cảm nhận...</label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="w-full p-3 border border-slate-300 h-24"
                                    placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                                    minLength={10}
                                />
                                <p className="text-xs text-slate-500 mt-1">{comment.length} ký tự (Tối thiểu 10)</p>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={submitting || comment.length < 10} className="bg-[#21246b] hover:bg-[#1a1d55]">
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Gửi đánh giá
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                    Hủy
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Reviews List */}
                <div className="space-y-0">
                    {reviews.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
                    ) : (
                        reviews.map(review => (
                            <div key={review.id} className="border-b border-slate-200 py-4">
                                <div className="flex gap-4">
                                    {/* Avatar */}
                                    <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                                        <User className="h-6 w-6 text-slate-500" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <strong className="text-slate-900">{review.user.name || review.user.email.split('@')[0]}</strong>
                                            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                                ✓ Đã mua hàng tại Novas.vn
                                            </span>
                                        </div>

                                        {/* Rating Stars */}
                                        <div className="flex items-center gap-1 mb-2">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <Star
                                                    key={star}
                                                    className={`h-4 w-4 ${star <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300'}`}
                                                />
                                            ))}
                                        </div>

                                        {/* Comment */}
                                        {review.comment && (
                                            <p className="text-slate-700 mb-2">{review.comment}</p>
                                        )}

                                        {/* Bottom Actions */}
                                        <div className="flex items-center gap-4 text-sm text-slate-500">
                                            <span>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                                            <button className="flex items-center gap-1 hover:text-[#21246b]">
                                                <ThumbsUp className="h-3 w-3" /> Thích
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
