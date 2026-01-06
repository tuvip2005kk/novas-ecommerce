"use client";
import { API_URL } from '@/config';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { CommitmentSection } from "@/components/CommitmentSection";
import { Star, ChevronDown, ChevronUp } from "lucide-react";

interface Subcategory {
    id: number;
    name: string;
    slug: string;
    image?: string;
    products: Product[];
}

interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    subcategories: Subcategory[];
}

interface Product {
    id: number;
    name: string;
    slug: string;
    price: number;
    image: string;
    soldCount: number;
}

interface Banner {
    id: number;
    image: string;
    title: string;
    description: string;
}

// Fallback banners if API fails
const FALLBACK_BANNERS: Record<string, string> = {
    'bon-cau': '/images/banners/bon-cau-banner.png',
    'lavabo': '/images/banners/lavabo-banner.png',
    'voi-sen': '/images/banners/voi-sen-banner.png',
    'bon-tam': '/images/banners/bon-tam-banner.png',
    'phu-kien': '/images/banners/phu-kien-banner.png',
    'voi-chau-lavabo': '/images/banners/voi-chau-lavabo-banner.png'
}; \r\n\r\n// Helper to get subcategory fallback image based on slug\r\nfunction getSubcategoryFallbackImage(subcategorySlug: string, categorySlug: string): string {\r\n    // Map of subcategory patterns to images\r\n    const imageMap: Record\u003cstring, string\u003e = {\r\n        '1-khoi': '/images/product/bon-cau/toilet_product_1_1767717640766.png',\r\n        'mot-khoi': '/images/product/bon-cau/toilet_product_1_1767717640766.png',\r\n        'trung': '/images/product/bon-cau/toilet_product_2_1767717658445.png',\r\n        'thong-minh': '/images/product/bon-cau-thong-minh/smart_toilet_white_1767717842259.png',\r\n        'treo-tuong': '/images/product/bon-cau-treo-tuong/wall_toilet_white_1767718022974.png',\r\n        'lavabo': '/images/product/lavabo/lavabo_flower_pattern_1767718373362.png',\r\n        'bon-tam': '/images/product/bon-tam/bathtub_product_1767717719012.png'\r\n    };\r\n\r\n    // Find matching pattern\r\n    for (const [pattern, imagePath] of Object.entries(imageMap)) {\r\n        if (subcategorySlug.includes(pattern)) {\r\n            return imagePath;\r\n        }\r\n    }\r\n\r\n    // Default fallback\r\n    return `/images/product/${categorySlug}/toilet_product_3_1767717681037.png`;\r\n}

export default function CategoryPage() {
    const params = useParams();
    const categorySlug = Array.isArray(params.category) ? params.category[0] : params.category;

    const [category, setCategory] = useState<Category | null>(null);
    const [banner, setBanner] = useState<Banner | null>(null);
    const [expandedSubcategories, setExpandedSubcategories] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!categorySlug) return;

        const fetchCategory = async () => {
            setLoading(true);
            try {
                // Fetch category
                const res = await fetch(`${API_URL}/api/categories/slug/${categorySlug}`);
                if (res.ok) {
                    const data = await res.json();
                    setCategory(data);
                }

                // Fetch banner for this category
                const bannerRes = await fetch(`${API_URL}/api/banners?pageType=category&categorySlug=${categorySlug}`);
                if (bannerRes.ok) {
                    const banners = await bannerRes.json();
                    if (Array.isArray(banners) && banners.length > 0) {
                        setBanner(banners[0]);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch category", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategory();
    }, [categorySlug]);

    const toggleExpand = (subcategoryId: number) => {
        setExpandedSubcategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(subcategoryId)) {
                newSet.delete(subcategoryId);
            } else {
                newSet.add(subcategoryId);
            }
            return newSet;
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Header />
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#21246b]"></div>
                </div>
            </div>
        );
    }

    if (!category) {
        return (
            <div className="min-h-screen bg-white">
                <Header />
                <div className="flex items-center justify-center py-20">
                    <p className="text-slate-500">Không tìm thấy danh mục</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
            <Header />

            {/* Banner */}
            <section className="pt-16">
                <div className="max-w-[1200px] mx-auto px-4 md:px-6">
                    <img
                        src={banner?.image?.startsWith('http')
                            ? banner.image
                            : (banner?.image ? `${API_URL}${banner.image}` : (FALLBACK_BANNERS[categorySlug || ''] || '/images/banners/bon-cau-banner.png'))}
                        alt={banner?.title || category?.name || 'Banner'}
                        className="w-full rounded-lg"
                    />
                </div>
            </section>

            {/* Commitment Section */}
            <CommitmentSection />

            {/* Subcategories Title */}
            <section className="py-4 bg-slate-50">
                <div className="max-w-[1200px] mx-auto px-4 md:px-6">
                    <div className="flex items-center justify-center gap-4">
                        <div className="flex-1 h-[2px] bg-[#21246b]"></div>
                        <h2 className="text-lg font-bold text-[#21246b] uppercase tracking-wide whitespace-nowrap">
                            DANH MỤC {category.name.toUpperCase()}
                        </h2>
                        <div className="flex-1 h-[2px] bg-[#21246b]"></div>
                    </div>
                </div>
            </section>

            {/* Subcategory Cards */}
            {category.subcategories.length > 0 && (
                <section className="py-6 bg-slate-50">
                    <div className="max-w-[1200px] mx-auto px-4 md:px-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {category.subcategories.map((sub) => (
                                <Link href={`/${categorySlug}/${sub.slug}`} key={sub.id} className="group">
                                    <div className="h-full rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:ring-2 hover:ring-[#21246b] transition-all duration-300 flex flex-col">
                                        <div className="aspect-square bg-gradient-to-b from-blue-100 via-blue-50 to-white overflow-hidden relative">
                                            <div className="absolute top-2 left-2 z-10">
                                                <span className="px-2 py-0.5 bg-[#21246b] text-white text-xs font-bold rounded">
                                                    Novas
                                                </span>
                                            </div>
                                            <img
                                                src={sub.image ? (sub.image.startsWith('http') ? sub.image : `${API_URL}${sub.image}`) : (sub.products[0]?.image ? (sub.products[0].image.startsWith('http') ? sub.products[0].image : `${API_URL}${sub.products[0].image}`) : getSubcategoryFallbackImage(sub.slug, categorySlug || ''))}
                                                alt={sub.name}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        </div>
                                        <div className="bg-[#21246b] py-2 text-center">
                                            <span className="text-white font-bold text-xs uppercase tracking-wide">
                                                {sub.name}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Subcategories with Products - Grouped */}
            <section className="py-4 bg-white">
                <div className="max-w-[1200px] mx-auto px-4 md:px-6">
                    {(() => {
                        const hasSubcategories = category.subcategories.length > 0;
                        const firstSubcategory = category.subcategories[0];
                        const isExpanded = expandedSubcategories.has(category.id);

                        if (!hasSubcategories || !firstSubcategory) return null;

                        return (
                            <div className="mb-8">
                                {!isExpanded ? (
                                    <>
                                        {/* Preview: First subcategory + 2 rows products */}
                                        <div className="flex items-center gap-4 mb-4">
                                            <h3 className="text-xl font-bold text-[#21246b] uppercase whitespace-nowrap">
                                                {firstSubcategory.name}
                                            </h3>
                                            <div className="flex-1 h-[1px] bg-slate-300"></div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {firstSubcategory.products.slice(0, 8).map((product) => (
                                                <ProductCard key={product.id} product={product} categorySlug={categorySlug || ''} />
                                            ))}
                                        </div>

                                        {/* View More Button */}
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
                                        {/* Expanded: Show all subcategories */}
                                        {category.subcategories.map((subcategory) => (
                                            <div key={subcategory.id} className="mb-6">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <h3 className="text-xl font-bold text-[#21246b] uppercase whitespace-nowrap">
                                                        {subcategory.name}
                                                    </h3>
                                                    <div className="flex-1 h-[1px] bg-slate-300"></div>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {subcategory.products.slice(0, 8).map((product) => (
                                                        <ProductCard key={product.id} product={product} categorySlug={categorySlug || ''} />
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
                    })()}
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
                {/* Product Name */}
                <h4 className="font-bold text-[#21246b] text-lg mb-3 line-clamp-2 min-h-[52px] group-hover:text-blue-800 transition-colors">
                    {product.name}
                </h4>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                </div>

                {/* Price */}
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-[#21246b] font-bold text-xl">
                        {new Intl.NumberFormat('vi-VN').format(product.price)}đ
                    </span>
                    <span className="text-sm text-slate-400 line-through">
                        {new Intl.NumberFormat('vi-VN').format(product.price * 1.3)}đ
                    </span>
                </div>

                {/* Buttons */}
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
