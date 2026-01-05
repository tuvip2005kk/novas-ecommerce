"use client";
import { API_URL } from '@/config';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { CommitmentSection } from "@/components/CommitmentSection";
import CategorySection from "@/components/CategorySection";
import { Star, ChevronDown, ChevronUp } from "lucide-react";

interface Product {
    id: number;
    name: string;
    price: number;
    image: string;
    slug: string;
    soldCount: number;
}

interface Subcategory {
    id: number;
    name: string;
    slug: string;
    image: string;
    categoryId: number;
    products: Product[];
}

interface Category {
    id: number;
    name: string;
    slug: string;
    image: string;
}

interface CategoryWithSubcategories extends Category {
    subcategories: Subcategory[];
}

export default function ThietBiVeSinhPage() {
    const [categoriesWithSubs, setCategoriesWithSubs] = useState<CategoryWithSubcategories[]>([]);
    const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const catRes = await fetch(`${API_URL}/api/categories`);
                const categoriesData: Category[] = await catRes.json();

                const subRes = await fetch(`${API_URL}/api/subcategories`);
                const subcategoriesData: Subcategory[] = await subRes.json();

                const subcatsWithProducts = await Promise.all(
                    subcategoriesData.map(async (sub: Subcategory) => {
                        const prodRes = await fetch(`${API_URL}/api/products?subcategoryId=${sub.id}`);
                        const products = await prodRes.json();
                        return { ...sub, products };
                    })
                );

                // Group subcategories by categoryId
                const grouped: CategoryWithSubcategories[] = categoriesData.map(cat => ({
                    ...cat,
                    subcategories: subcatsWithProducts.filter(sub => sub.categoryId === cat.id)
                }));

                setCategoriesWithSubs(grouped);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const toggleExpand = (categoryId: number) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Đang tải...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
            <Header />

            {/* Banner */}
            <section className="pt-16">
                <div className="max-w-[1200px] mx-auto">
                    <img
                        src="/images/showroom-banner.png"
                        alt="Novas - Thiết bị vệ sinh thông minh cao cấp"
                        className="w-full"
                    />
                </div>
            </section>

            {/* Commitment Section */}
            <CommitmentSection />

            {/* Product Categories Title with Lines */}
            <section className="py-4 bg-slate-50">
                <div className="max-w-[1200px] mx-auto px-4 md:px-6">
                    <div className="flex items-center justify-center gap-4">
                        <div className="flex-1 h-[2px] bg-[#21246b]"></div>
                        <h2 className="text-lg font-bold text-[#21246b] uppercase tracking-wide whitespace-nowrap">
                            DANH MỤC SẢN PHẨM
                        </h2>
                        <div className="flex-1 h-[2px] bg-[#21246b]"></div>
                    </div>
                </div>
            </section>

            {/* Category Cards */}
            <CategorySection hideTitle />

            {/* Categories with Subcategories - Grouped */}
            <section className="py-4 bg-white">
                <div className="max-w-[1200px] mx-auto px-4 md:px-6">
                    {categoriesWithSubs.map((category) => {
                        const isExpanded = expandedCategories.has(category.id);
                        const hasSubcategories = category.subcategories.length > 0;
                        const firstSubcategory = category.subcategories[0];

                        if (!hasSubcategories) return null;

                        return (
                            <div key={category.id} className="mb-8">
                                {!isExpanded ? (
                                    <>
                                        {/* Preview: First subcategory name + 1 row of products */}
                                        <div className="flex items-center gap-4 mb-4">
                                            <h3 className="text-xl font-bold text-[#21246b] uppercase whitespace-nowrap">
                                                {firstSubcategory.name}
                                            </h3>
                                            <div className="flex-1 h-[1px] bg-slate-300"></div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {firstSubcategory.products.slice(0, 8).map((product) => (
                                                <ProductCard key={product.id} product={product} categorySlug={category.slug} />
                                            ))}
                                        </div>

                                        {/* View More Button - shows all subcategories of this category */}
                                        {category.subcategories.length > 1 && (
                                            <div className="text-center mt-4">
                                                <button
                                                    onClick={() => toggleExpand(category.id)}
                                                    className="inline-flex items-center gap-2 px-5 py-2 border-2 border-[#21246b] text-[#21246b] text-sm font-bold rounded-lg hover:bg-[#21246b] hover:text-white transition-colors"
                                                >
                                                    Xem thêm sản phẩm
                                                    <ChevronDown className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {/* Expanded: Show all subcategories of this category */}
                                        {category.subcategories.map((subcategory) => (
                                            <div key={subcategory.id} className="mb-6">
                                                {/* Subcategory Name */}
                                                <div className="flex items-center gap-4 mb-4">
                                                    <h3 className="text-xl font-bold text-[#21246b] uppercase whitespace-nowrap">
                                                        {subcategory.name}
                                                    </h3>
                                                    <div className="flex-1 h-[1px] bg-slate-300"></div>
                                                </div>

                                                {/* Products Grid - 2 rows */}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                    {subcategory.products.slice(0, 8).map((product) => (
                                                        <ProductCard key={product.id} product={product} categorySlug={category.slug} />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Collapse Button */}
                                        <div className="text-center mt-4">
                                            <button
                                                onClick={() => toggleExpand(category.id)}
                                                className="inline-flex items-center gap-2 px-5 py-2 border-2 border-[#21246b] text-[#21246b] text-sm font-bold rounded-lg hover:bg-[#21246b] hover:text-white transition-colors"
                                            >
                                                Thu gọn
                                                <ChevronUp className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>
            <Footer />
        </div>
    );
}

// Product Card Component - Enic Style
function ProductCard({ product, categorySlug }: { product: Product; categorySlug: string }) {
    return (
        <Link
            href={`/${categorySlug}/${product.slug}`}
            className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-[#21246b] transition-all"
        >
            {/* Product Image - Full Width */}
            <div className="relative aspect-square overflow-hidden">
                <div className="absolute top-3 left-3 z-10">
                    <span className="px-3 py-1 bg-[#21246b] text-white text-xs font-bold rounded">
                        Novas
                    </span>
                </div>
                <div className="absolute top-3 right-3 z-10">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex flex-col items-center justify-center text-white text-center shadow-lg border-2 border-amber-300">
                        <span className="text-[7px] font-bold">MIỄN PHÍ</span>
                        <span className="text-[8px] font-bold">LẮP ĐẶT</span>
                    </div>
                </div>
                <img
                    src={product.image ? (product.image.startsWith('http') ? product.image : `${API_URL}${product.image.startsWith('/') ? '' : '/'}${product.image}`) : '/images/placeholder.png'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
            </div>

            {/* Product Info */}
            <div className="p-4 bg-white">
                {/* Product Name - Larger, Bold, Blue */}
                <h4 className="font-bold text-[#21246b] text-lg mb-3 line-clamp-2 min-h-[52px] group-hover:text-blue-800 transition-colors">
                    {product.name}
                </h4>

                {/* Rating - Bigger Stars */}
                <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                </div>

                {/* Price - Larger */}
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-[#21246b] font-bold text-xl">
                        {new Intl.NumberFormat('vi-VN').format(product.price)}đ
                    </span>
                    <span className="text-sm text-slate-400 line-through">
                        {new Intl.NumberFormat('vi-VN').format(product.price * 1.3)}đ
                    </span>
                </div>

                {/* Buttons - Compact */}
                <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-[#21246b] text-white text-xs font-bold rounded-lg hover:bg-blue-800 transition-colors">
                        ĐẶT HÀNG NGAY
                    </button>
                    <button className="flex-1 py-2 border-2 border-[#21246b] text-[#21246b] text-xs font-bold rounded-lg hover:bg-[#21246b] hover:text-white transition-colors">
                        XEM NHANH
                    </button>
                </div>
            </div>
        </Link>
    );
}
