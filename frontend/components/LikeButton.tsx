"use client";
import { API_URL } from '@/config';

import { Heart, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface LikeButtonProps {
    productId: number;
    className?: string;
}

export function LikeButton({ productId, className = "" }: LikeButtonProps) {
    const { user, token } = useAuth();
    const router = useRouter();
    const [isLiked, setIsLiked] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (token) {
            checkLikeStatus();
        }
    }, [token, productId]);

    const checkLikeStatus = async () => {
        try {
            const res = await fetch(`${API_URL}/likes/check/${productId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setIsLiked(data.isLiked);
        } catch (error) {
            console.error(error);
        }
    };

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        console.log('Like clicked! User:', user, 'Token:', token?.substring(0, 20) + '...');

        if (!user) {
            router.push('/login');
            return;
        }

        if (!token) {
            console.error('No token available!');
            alert('Vui lòng đăng nhập lại!');
            return;
        }

        setLoading(true);
        console.log('Sending request to:', `${API_URL}/likes/${productId}`);
        try {
            if (isLiked) {
                const res = await fetch(`${API_URL}/likes/${productId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    setIsLiked(false);
                } else {
                    console.error('Delete failed:', await res.text());
                }
            } else {
                const res = await fetch(`${API_URL}/likes/${productId}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    setIsLiked(true);
                } else {
                    console.error('Add failed:', await res.text());
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className={`p-2 rounded-full transition-all hover:scale-110 ${isLiked
                ? 'bg-red-100 text-red-500'
                : 'bg-white/80 text-slate-400 hover:text-red-500 hover:bg-red-50'
                } ${className}`}
            title={isLiked ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
        >
            {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500' : ''}`} />
            )}
        </button>
    );
}
