"use client";
import { API_URL } from '@/config';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { Heart, Loader2, ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";

interface LikeItem {
    id: number;
    product: {
        id: number;
        name: string;
        description: string;
        price: number;
        image: string;
        category: string;
    };
}

export default function LikesPage() {
    const { user, token, isLoading } = useAuth();
    const { addItem } = useCart();
    const router = useRouter();
    const [items, setItems] = useState<LikeItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (token) {
            fetchLikes();
        }
    }, [token]);

    const fetchLikes = async () => {
        try {
            const res = await fetch(`${API_URL}/api/likes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setItems(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const removeLike = async (productId: number) => {
        await fetch(`${API_URL}/api/likes/${productId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        setItems(items.filter(item => item.product.id !== productId));
    };

    const handleAddToCart = (product: any) => {
        addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image
        });
    };

    if (isLoading || loading) {
        return (
            <>
                <Header />
                <main className="min-h-screen bg-slate-50 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </main>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <main className="min-h-screen bg-slate-50 pt-20 pb-12">
                <div className="max-w-[1200px] mx-auto px-4 md:px-6">
                    <div className="flex items-center gap-3 mb-8">
                        <Heart className="h-8 w-8 text-red-500 fill-red-500" />
                        <h1 className="text-3xl font-bold">Sản phẩm yêu thích</h1>
                        <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium">
                            {items.length} sản phẩm
                        </span>
                    </div>

                    {items.length === 0 ? (
                        <Card>
                            <CardContent className="py-16 text-center">
                                <Heart className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                                <h2 className="text-xl font-semibold text-slate-700">Chưa có sản phẩm yêu thích</h2>
                                <p className="text-slate-500 mt-2">Hãy thêm sản phẩm vào danh sách yêu thích của bạn!</p>
                                <Link href="/">
                                    <Button className="mt-6">Khám phá sản phẩm</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {items.map(item => (
                                <Card key={item.id} className="overflow-hidden group hover:shadow-xl transition-all">
                                    <Link href={`/products/${item.product.id}`}>
                                        <div
                                            className="h-48 bg-slate-100 bg-cover bg-center group-hover:scale-105 transition-transform"
                                            style={{ backgroundImage: `url(${item.product.image?.startsWith('http') ? item.product.image : `${API_URL}${item.product.image}`})` }}
                                        />
                                    </Link>
                                    <CardContent className="p-4">
                                        <Link href={`/products/${item.product.id}`}>
                                            <h3 className="font-semibold text-lg hover:text-blue-600 transition-colors">{item.product.name}</h3>
                                        </Link>
                                        <p className="text-slate-500 text-sm mt-1 line-clamp-2">{item.product.description}</p>
                                        <p className="text-xl font-bold text-blue-600 mt-2">${item.product.price}</p>
                                        <div className="flex gap-2 mt-4">
                                            <Button
                                                className="flex-1"
                                                onClick={() => handleAddToCart(item.product)}
                                            >
                                                <ShoppingCart className="h-4 w-4 mr-2" />
                                                Thêm vào giỏ
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="text-red-500 hover:bg-red-50"
                                                onClick={() => removeLike(item.product.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
