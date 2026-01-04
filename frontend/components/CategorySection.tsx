"use client";
import { API_URL } from '@/config';

import Link from "next/link";
import { useEffect, useState } from "react";

interface Category {
    id: number;
    name: string;
    slug: string;
    image: string;
}

export default function CategorySection({ hideTitle = false }: { hideTitle?: boolean }) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${API_URL}/api/categories`);
                const data = await res.json();
                setCategories(data);
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    if (loading) {
        return (
            <section className="py-6 bg-slate-50">
                <div className="max-w-[1200px] mx-auto px-4 md:px-6">
                    <div className="text-center">Đang tải danh mục...</div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-6 bg-slate-50">
            <div className="max-w-[1200px] mx-auto px-4 md:px-6">
                {!hideTitle && (
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="flex-1 h-[2px] bg-[#21246b]"></div>
                        <h2 className="text-lg font-bold text-[#21246b] uppercase tracking-wide whitespace-nowrap">
                            DANH MỤC SẢN PHẨM
                        </h2>
                        <div className="flex-1 h-[2px] bg-[#21246b]"></div>
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {categories.map((cat) => (
                        <Link href={`/${cat.slug}`} key={cat.id} className="danhmuc-them-col group">
                            <div className="box-col h-full rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:ring-2 hover:ring-[#21246b] transition-all duration-300 flex flex-col">
                                {/* Image Container */}
                                <div className="aspect-[4/5] bg-gradient-to-b from-blue-100 via-blue-50 to-white overflow-hidden">
                                    <img
                                        src={cat.image || '/images/placeholder.png'}
                                        alt={cat.name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                </div>

                                {/* Category Name - Dark blue footer */}
                                <div className="tendm bg-[#21246b] py-2 text-center">
                                    <span className="text-white font-bold text-xs uppercase tracking-wide">
                                        {cat.name}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
