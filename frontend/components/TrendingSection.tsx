"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame } from "lucide-react";

interface Product {
    id: number;
    name: string;
    price: number;
    image: string;
    category: string;
    soldCount: number;
    slug?: string;
}

import { API_URL } from '../config';

export default function TrendingSection() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const res = await fetch(`${API_URL}/api/products?sort=sold`);
                if (res.ok) {
                    const data = await res.json();
                    setProducts(data.slice(0, 5));
                }
            } catch (error) {
                console.error("Failed to fetch trending products", error);
            }
        };

        fetchTrending();
    }, []);

    if (products.length === 0) return null;

    const categorySlugMap: Record<string, string> = {
        'boncau': 'bon-cau',
        'voisen': 'voi-sen',
        'bontam': 'bon-tam',
        'lavabo': 'lavabo',
        'phukien': 'phu-kien'
    };

    return (
        <section className="py-10 bg-gradient-to-b from-slate-900 to-slate-800 text-white">
            <div className="max-w-[1200px] mx-auto px-4 md:px-6">
                <div className="flex justify-between items-end mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500 rounded-lg animate-pulse">
                            <Flame className="w-6 h-6 text-white" fill="currentColor" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-1">
                                TOP TRENDING
                            </h2>
                            <p className="text-slate-400 text-xs">Sản phẩm bán chạy nhất tuần qua</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {products.map((product, index) => {
                        const catSlug = categorySlugMap[product.category] || 'san-pham';
                        return (
                            <Link href={`/${catSlug}/${product.slug || product.id}`} key={product.id} className="group relative bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-red-500/50 transition-colors">
                                {/* Rank Badge */}
                                <div className="absolute top-0 left-0 z-20">
                                    <div className={`
                                        w-8 h-8 flex items-center justify-center font-bold text-sm rounded-br-xl shadow-lg
                                        ${index === 0 ? 'bg-yellow-500 text-yellow-950' :
                                            index === 1 ? 'bg-slate-300 text-slate-800' :
                                                index === 2 ? 'bg-amber-700 text-amber-100' :
                                                    'bg-slate-700 text-slate-400'}
                                    `}>
                                        #{index + 1}
                                    </div>
                                </div>

                                {/* Image */}
                                <div className="aspect-square relative overflow-hidden bg-white">
                                    <img
                                        src={product.image.startsWith('http') ? product.image : `${API_URL}${product.image}`}
                                        alt={product.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    {product.soldCount > 0 && (
                                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-medium text-white">
                                            Đã bán {product.soldCount}
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-3">
                                    <h3 className="font-semibold text-sm mb-1 truncate group-hover:text-red-400 transition-colors">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center justify-between">
                                        <span className="text-red-400 font-bold text-sm">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
