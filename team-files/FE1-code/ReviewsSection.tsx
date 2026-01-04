"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Star, User } from "lucide-react";
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

export function ReviewsSection({ productId }: { productId: number }) {
    const { user, token } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);

    useEffect(() => {
        fetchReviews();
    }, [productId]);

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

    const submitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return alert('Vui lòng đăng nhập để đánh giá');
        setSubmitting(true);
        try {
            await fetch(`http://localhost:3005/reviews/product/${productId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ rating, comment })
            });
            setComment('');
            setRating(5);
            fetchReviews();
        } finally {
            setSubmitting(false);
        }
    };

    const StarRating = ({ value, interactive = false }: { value: number; interactive?: boolean }) => (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
                <Star
                    key={star}
                    className={`h-5 w-5 cursor-${interactive ? 'pointer' : 'default'} transition-colors ${star <= (interactive ? (hoverRating || rating) : value)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-slate-300'
                        }`}
                    onMouseEnter={() => interactive && setHoverRating(star)}
                    onMouseLeave={() => interactive && setHoverRating(0)}
                    onClick={() => interactive && setRating(star)}
                />
            ))}
        </div>
    );

    if (loading) {
        return <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    }

    return (
        <div className="mt-12 border-t pt-12">
            <h2 className="text-2xl font-bold mb-6">Đánh giá sản phẩm</h2>

            {/* Stats Summary */}
            {stats && (
                <div className="grid md:grid-cols-2 gap-8 mb-8 p-6 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-4">
                        <div className="text-5xl font-bold text-slate-900">{stats.averageRating}</div>
                        <div>
                            <StarRating value={Math.round(stats.averageRating)} />
                            <p className="text-slate-500 mt-1">{stats.totalReviews} đánh giá</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map(star => (
                            <div key={star} className="flex items-center gap-2 text-sm">
                                <span className="w-3">{star}</span>
                                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-yellow-400"
                                        style={{ width: `${stats.totalReviews > 0 ? (stats.distribution[star] / stats.totalReviews) * 100 : 0}%` }}
                                    />
                                </div>
                                <span className="w-8 text-slate-500">{stats.distribution[star]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Write Review Form */}
            {user ? (
                <form onSubmit={submitReview} className="mb-8 p-6 bg-blue-50 rounded-xl">
                    <h3 className="font-semibold mb-4">Viết đánh giá của bạn</h3>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Đánh giá sao</label>
                        <StarRating value={rating} interactive />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Nhận xét</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full p-3 border rounded-lg h-24"
                            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                        />
                    </div>
                    <Button type="submit" disabled={submitting}>
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Gửi đánh giá
                    </Button>
                </form>
            ) : (
                <div className="mb-8 p-6 bg-slate-50 rounded-xl text-center">
                    <p className="text-slate-600">Vui lòng <a href="/login" className="text-blue-600 font-medium">đăng nhập</a> để viết đánh giá</p>
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-6">
                {reviews.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
                ) : (
                    reviews.map(review => (
                        <div key={review.id} className="border-b pb-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-medium">{review.user.name || review.user.email}</p>
                                    <div className="flex items-center gap-2">
                                        <StarRating value={review.rating} />
                                        <span className="text-sm text-slate-500">
                                            {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {review.comment && <p className="text-slate-600 mt-2">{review.comment}</p>}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
