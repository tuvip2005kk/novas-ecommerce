"use client";
import { API_URL } from '@/config';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { CommitmentSection } from "@/components/CommitmentSection";
import Footer from "@/components/Footer";
import { ShoppingCart, Star, ChevronRight, ChevronLeft, ChevronDown, ChevronUp } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";

interface Review {
    id: number;
    rating: number;
    comment: string;
    user: { name: string };
    createdAt: string;
}

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    image: string;
    images?: string[];
    category: string;
    stock: number;
    soldCount: number;
    slug: string;
    reviews?: Review[];
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
}

// Banner for subcategories (same as category banners)
const CATEGORY_BANNERS: Record<string, { subtitle: string; banner: string }> = {
    'bon-cau': { subtitle: 'BỘ SƯU TẬP BỒN CẦU THẾ HỆ MỚI', banner: '/images/banners/bon-cau-banner.png' },
    'lavabo': { subtitle: 'BỘ SƯU TẬP LAVABO CAO CẤP', banner: '/images/banners/lavabo-banner.png' },
    'voi-sen': { subtitle: 'BỘ SƯU TẬP VÒI SEN HIỆN ĐẠI', banner: '/images/banners/voi-sen-banner.png' },
    'bon-tam': { subtitle: 'BỘ SƯU TẬP BỒN TẮM LUXURY', banner: '/images/banners/bon-tam-banner.png' },
    'phu-kien': { subtitle: 'PHỤ KIỆN ĐỒNG BỘ CAO CẤP', banner: '/images/banners/phu-kien-banner.png' },
    'voi-chau-lavabo': { subtitle: 'BỘ SƯU TẬP VÒI RỬA HIỆN ĐẠI', banner: '/images/banners/voi-chau-lavabo-banner.png' },
};

// Fallback image selector for subcategories without images
function getSubcategoryFallbackImage(slug: string, cat: string): string {
    if (slug.includes('1-khoi') || slug.includes('mot-khoi')) return '/images/product/bon-cau/toilet_product_1_1767717640766.png';
    if (slug.includes('trung')) return '/images/product/bon-cau/toilet_product_2_1767717658445.png';
    if (slug.includes('thong-minh')) return '/images/product/bon-cau-thong-minh/smart_toilet_white_1767717842259.png';
    if (slug.includes('treo-tuong')) return '/images/product/bon-cau-treo-tuong/wall_toilet_white_1767718022974.png';
    if (slug.includes('lavabo')) return '/images/product/lavabo/lavabo_flower_pattern_1767718373362.png';
    if (slug.includes('bon-tam')) return '/images/product/bon-tam/bathtub_product_1_1767717719012.png';
    return `/images/product/${cat}/toilet_product_3_1767717681037.png`;
}

export default function SlugPage() {
    const params = useParams();
    const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
    const categorySlug = Array.isArray(params.category) ? params.category[0] : params.category;

    const [pageType, setPageType] = useState<'loading' | 'product' | 'subcategory' | 'not-found'>('loading');
    const [product, setProduct] = useState<Product | null>(null);
    const [subcategory, setSubcategory] = useState<Subcategory | null>(null);
    const [category, setCategory] = useState<Category | null>(null);
    const [allSubcategories, setAllSubcategories] = useState<Subcategory[]>([]);
    const [selectedImg, setSelectedImg] = useState(0);
    const [qty, setQty] = useState(1);
    const { addItem } = useCart();
    const { showToast } = useToast();

    useEffect(() => {
        if (!slug || !categorySlug) return;

        const fetchData = async () => {
            setPageType('loading');
            try {
                // First, try to find subcategory by slug
                const subRes = await fetch(`${API_URL}/api/subcategories/slug/${slug}`);
                let subData = null;
                try {
                    if (subRes.ok) {
                        const text = await subRes.text();
                        subData = text ? JSON.parse(text) : null;
                    }
                } catch (e) {
                    subData = null;
                }

                if (subData && subData.id) {
                    setSubcategory(subData);
                    const catRes = await fetch(`${API_URL}/api/categories/slug/${categorySlug}`);
                    if (catRes.ok) {
                        const catData = await catRes.json();
                        setCategory(catData);
                        if (catData.subcategories) {
                            setAllSubcategories(catData.subcategories);
                        }
                    }
                    setPageType('subcategory');
                    return;
                }

                // If not subcategory, try to find product
                const prodRes = await fetch(`${API_URL}/api/products/slug/${slug}`);
                let prodData = null;
                try {
                    if (prodRes.ok) {
                        const text = await prodRes.text();
                        prodData = text ? JSON.parse(text) : null;
                    }
                } catch (e) {
                    prodData = null;
                }

                if (prodData && prodData.id) {
                    setProduct(prodData);
                    setPageType('product');
                    return;
                }

                setPageType('not-found');
            } catch (error) {
                console.error("Failed to fetch data", error);
                setPageType('not-found');
            }
        };

        fetchData();
    }, [slug, categorySlug]);

    if (pageType === 'loading') {
        return (
            <div className="min-h-screen bg-white">
                <Header />
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#21246b]"></div>
                </div>
            </div>
        );
    }

    if (pageType === 'not-found') {
        return (
            <div className="min-h-screen bg-white">
                <Header />
                <div className="flex items-center justify-center py-20">
                    <p className="text-slate-500">Không tìm thấy trang</p>
                </div>
            </div>
        );
    }

    // Render Subcategory Page
    if (pageType === 'subcategory' && subcategory) {
        const bannerInfo = categorySlug ? CATEGORY_BANNERS[categorySlug] : null;

        return (
            <div className="min-h-screen bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
                <Header />

                {/* Banner */}
                <section className="pt-16">
                    <div className="max-w-[1200px] mx-auto px-4 md:px-6">
                        {bannerInfo && (
                            <img
                                src={bannerInfo.banner}
                                alt={bannerInfo.subtitle}
                                className="w-full rounded-lg"
                            />
                        )}
                    </div>
                </section>

                {/* Commitment Section */}
                <CommitmentSection />

                {/* Subcategory Title */}
                <section className="py-4 bg-slate-50">
                    <div className="max-w-[1200px] mx-auto px-4 md:px-6">
                        <div className="flex items-center justify-center gap-4">
                            <div className="flex-1 h-[2px] bg-[#21246b]"></div>
                            <h2 className="text-lg font-bold text-[#21246b] uppercase tracking-wide whitespace-nowrap">
                                {subcategory.name}
                            </h2>
                            <div className="flex-1 h-[2px] bg-[#21246b]"></div>
                        </div>
                    </div>
                </section>

                {/* Other Subcategories */}
                {allSubcategories.length > 1 && (
                    <section className="py-6 bg-slate-50">
                        <div className="max-w-[1200px] mx-auto px-4 md:px-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {allSubcategories.map((sub) => (
                                    <Link href={`/${categorySlug}/${sub.slug}`} key={sub.id} className="group">
                                        <div className={`h-full rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col ${sub.id === subcategory.id ? 'ring-2 ring-[#21246b]' : 'hover:ring-2 hover:ring-[#21246b]'}`}>
                                            <div className="aspect-square bg-gradient-to-b from-blue-100 via-blue-50 to-white overflow-hidden relative">
                                                <div className="absolute top-2 left-2 z-10">
                                                    <span className="px-2 py-0.5 bg-[#21246b] text-white text-xs font-bold rounded">
                                                        Novas
                                                    </span>
                                                </div>
                                                <img
                                                    src={sub.image ? (sub.image.startsWith('http') ? sub.image : `${API_URL}${sub.image}`) : (sub.products?.[0]?.image ? (sub.products[0].image.startsWith('http') ? sub.products[0].image : `${API_URL}${sub.products[0].image}`) : getSubcategoryFallbackImage(sub.slug, categorySlug || ''))}
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

                {/* Subcategory Title - Between subcategory cards and products */}
                <section className="py-4 bg-white">
                    <div className="max-w-[1200px] mx-auto px-4 md:px-6">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold text-[#21246b] uppercase tracking-wide whitespace-nowrap">
                                {subcategory.name}
                            </h2>
                            <div className="flex-1 h-[1px] bg-slate-300"></div>
                        </div>
                    </div>
                </section>

                {/* Products */}
                <section className="py-6 bg-white">
                    <div className="max-w-[1200px] mx-auto px-4 md:px-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {subcategory.products?.map((product) => (
                                <ProductCard key={product.id} product={product} categorySlug={categorySlug || ''} />
                            ))}
                        </div>

                        {(!subcategory.products || subcategory.products.length === 0) && (
                            <div className="text-center py-10 text-slate-500">
                                Chưa có sản phẩm nào trong danh mục này
                            </div>
                        )}
                    </div>
                </section>
            </div>
        );
    }

    // Render Product Detail Page
    if (pageType === 'product' && product) {
        const reviewCount = product.reviews?.length || 0;
        const avgRating = reviewCount > 0
            ? (product.reviews || []).reduce((acc, r) => acc + r.rating, 0) / reviewCount
            : 0;

        // Use real images from database, fallback to main image if empty
        const extraImages = Array.isArray(product.images) ? product.images : [];
        const productImages = [product.image, ...extraImages]
            .filter(Boolean)
            .map(img => img.startsWith('http') ? img : `${API_URL}${img.startsWith('/') ? '' : '/'}${img}`);

        const productSpecs = (product as any).specs || {};

        // Build specs - support both new array format and legacy object format
        // Build specs - support both new array format and legacy object format
        const buildSpecs = (): { label: string; value: string; multiline?: boolean }[] => {
            // Check if specs is in new array format
            if (Array.isArray(productSpecs) && productSpecs.length > 0) {
                return productSpecs
                    .filter((s: any) => s.title && s.value)
                    .map((s: any) => ({ label: s.title, value: s.value, multiline: false }));
            }

            // Legacy object format - fallback for old products
            const catSlug = categorySlug;
            let specsList: { label: string; value: string; multiline?: boolean }[] = [];

            if (catSlug === 'bon-cau') {
                specsList = [
                    { label: 'Kích thước', value: productSpecs.kichThuoc },
                    { label: 'Tiện ích khác', value: productSpecs.tienIch },
                    { label: 'Dung tích', value: productSpecs.dungTich },
                    { label: 'Phương pháp xả', value: productSpecs.phuongPhapXa },
                    { label: 'Chất liệu thân', value: productSpecs.chatLieuThan },
                    { label: 'Chất liệu nút xả', value: productSpecs.chatLieuNutXa },
                    { label: 'Chất liệu nắp + bệ ngồi', value: productSpecs.chatLieuNapBe },
                    { label: 'Tâm hố', value: productSpecs.tamHo },
                    { label: 'Khoảng cách tâm hố', value: productSpecs.khoangCachTamHo },
                    { label: 'Tải trọng', value: productSpecs.taiTrong },
                ];
            } else if (catSlug === 'bon-tam') {
                specsList = [
                    { label: 'Kích thước', value: productSpecs.kichThuoc },
                    { label: 'Dung tích', value: productSpecs.dungTich },
                    { label: 'Tiện ích', value: productSpecs.tienIch, multiline: true },
                    { label: 'Chất liệu', value: productSpecs.chatLieuThan, multiline: true },
                    { label: 'Thông số lắp đặt', value: productSpecs.thongSoLapDat },
                    { label: 'Lưu ý lắp đặt', value: productSpecs.luuYLapDat },
                ];
            } else if (catSlug === 'lavabo') {
                specsList = [
                    { label: 'Kích thước', value: productSpecs.kichThuoc },
                    { label: 'Chất liệu', value: productSpecs.chatLieuThan },
                    { label: 'Tính chất', value: productSpecs.tinhChat },
                    { label: 'Cân nặng', value: productSpecs.canNang },
                ];
            } else if (catSlug === 'phu-kien') {
                specsList = [
                    { label: 'Tiện ích', value: productSpecs.tienIch },
                    { label: 'Chất liệu', value: productSpecs.chatLieuThan },
                    { label: 'Phương pháp mạ', value: productSpecs.phuongPhapMa },
                    { label: 'Lắp đặt', value: productSpecs.lapDat },
                ];
            } else if (catSlug === 'voi-chau-lavabo') {
                specsList = [
                    { label: 'Tính năng', value: productSpecs.tinhNang },
                    { label: 'Chất liệu', value: productSpecs.chatLieuThan },
                    { label: 'Phương pháp mạ', value: productSpecs.phuongPhapMa },
                    { label: 'Lắp đặt', value: productSpecs.lapDat },
                ];
            } else if (catSlug === 'voi-sen') {
                specsList = [
                    { label: 'Tính năng', value: productSpecs.tinhNang },
                    { label: 'Tiện ích', value: productSpecs.tienIch },
                    { label: 'Chất liệu', value: productSpecs.chatLieuThan },
                    { label: 'Phương pháp mạ', value: productSpecs.phuongPhapMa },
                    { label: 'Cân nặng củ sen', value: productSpecs.canNangCuSen },
                    { label: 'Lắp đặt', value: productSpecs.lapDat },
                ];
            }

            return specsList.filter(s => s.value);
        };

        const specs = buildSpecs();

        // Parse combo options for phụ kiện
        const comboOptions = productSpecs.comboOptions ? (() => {
            try { return JSON.parse(productSpecs.comboOptions); } catch { return []; }
        })() : [];

        return (
            <div className="min-h-screen bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
                <Header />

                <main className="pt-20 pb-10 bg-gradient-to-b from-blue-50 to-white">
                    <div className="max-w-[1200px] mx-auto px-4 md:px-6">
                        {/* Back Button */}
                        <button
                            onClick={() => window.history.back()}
                            className="flex items-center gap-2 text-[#21246b] hover:text-blue-800 mb-6"
                        >
                            <ChevronLeft className="w-6 h-6" strokeWidth={3} />
                        </button>

                        {/* Product Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white">
                            {/* Left: Product Images */}
                            <div>
                                <div className="relative mb-3">
                                    <div className="absolute top-3 left-3 z-10">
                                        <span className="px-2 py-1 bg-[#21246b] text-white text-xs font-bold rounded">Novas</span>
                                    </div>
                                    <div className="absolute top-3 right-12 z-10 text-xs bg-black/50 text-white px-2 py-1 rounded">
                                        {selectedImg + 1} / {productImages.length}
                                    </div>

                                    {/* Navigation Arrows */}
                                    <button
                                        onClick={() => setSelectedImg(selectedImg > 0 ? selectedImg - 1 : productImages.length - 1)}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-[#21246b] rounded-full flex items-center justify-center hover:bg-blue-800 shadow"
                                    >
                                        <ChevronLeft className="w-6 h-6 text-white" />
                                    </button>
                                    <button
                                        onClick={() => setSelectedImg(selectedImg < productImages.length - 1 ? selectedImg + 1 : 0)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-[#21246b] rounded-full flex items-center justify-center hover:bg-blue-800 shadow"
                                    >
                                        <ChevronRight className="w-6 h-6 text-white" />
                                    </button>

                                    <img src={productImages[selectedImg]} alt={product.name} className="w-full border min-h-[500px] object-cover" />
                                </div>

                                {/* Thumbnail Gallery */}
                                <div className="relative">
                                    <div className="flex gap-1 overflow-x-auto pb-2">
                                        {productImages.map((img, idx) => (
                                            <button key={idx} onClick={() => setSelectedImg(idx)}
                                                className={`w-16 h-16 flex-shrink-0 overflow-hidden border-2 ${selectedImg === idx ? 'border-[#21246b]' : 'border-slate-200'}`}>
                                                <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Promotions Box */}
                                <div className="mt-4 p-3 border-2 border-[#21246b] bg-blue-50">
                                    <h4 className="font-bold text-[#21246b] mb-2 text-sm">Chương trình ưu đãi:</h4>
                                    <ul className="space-y-1 text-xs">
                                        <li className="flex items-center gap-2"><span className="text-green-600">✓</span> Miễn phí lắp đặt toàn quốc</li>
                                        <li className="flex items-center gap-2"><span className="text-green-600">✓</span> Miễn phí vận chuyển toàn quốc</li>
                                        <li className="flex items-center gap-2"><span className="text-green-600">✓</span> Kiểm tra trước khi thanh toán</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Right: Product Info */}
                            <div>
                                <h1 className="text-2xl font-bold text-[#21246b] mb-3 mt-4 uppercase">
                                    {product.name}
                                </h1>

                                {/* Rating - chỉ hiện nếu có đánh giá */}
                                {reviewCount > 0 && (
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-5 h-5 ${i < Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                        ))}
                                    </div>
                                    <span className="text-sm text-slate-500">({reviewCount} đánh giá)</span>
                                </div>
                                )}

                                {/* Price - không có giảm giá fix cứng */}
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="text-xl font-bold text-[#21246b]">
                                        {new Intl.NumberFormat('vi-VN').format(product.price)} đ
                                    </span>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-[#21246b] font-bold mb-3 border-b border-blue-200 pb-2">
                                        Thông tin sản phẩm
                                    </h3>
                                    {specs.length > 0 ? (
                                        <table className="w-full text-base">
                                            <tbody>
                                                {specs.map((spec, i) => (
                                                    <tr key={i} className="border-b border-slate-100">
                                                        <td className="py-2 text-black font-bold w-1/3 align-top">{spec.label}</td>
                                                        <td className="py-2 text-slate-500 font-normal">
                                                            {spec.multiline ? (
                                                                <div className="space-y-0">
                                                                    {spec.value.split('\n').map((line: string, j: number) => (
                                                                        <div key={j} className={j > 0 ? 'border-t border-slate-100 pt-2 mt-2' : ''}>
                                                                            {line}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span className="whitespace-pre-line">{spec.value}</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p className="text-slate-400 text-sm">Chưa có thông tin chi tiết</p>
                                    )}
                                </div>

                                {/* Quantity Selector */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex items-center border-2 border-slate-300">
                                        <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 text-xl font-bold text-slate-600 hover:bg-slate-100">-</button>
                                        <span className="px-3 py-2 text-lg font-bold min-w-[40px] text-center">{qty}</span>
                                        <button onClick={() => setQty(qty + 1)} className="px-3 py-2 text-xl font-bold text-slate-600 hover:bg-slate-100">+</button>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 max-w-[400px]">
                                    <button
                                        onClick={() => window.location.href = `/checkout?productId=${product.id}&quantity=${qty}`}
                                        className="flex-1 py-2.5 bg-[#21246b] text-white text-sm font-bold hover:bg-blue-800 transition-colors"
                                    >
                                        ĐẶT HÀNG NGAY
                                    </button>
                                    <button
                                        onClick={() => { for (let i = 0; i < qty; i++) addItem({ id: product.id, name: product.name, price: product.price, image: product.image }); showToast(`Đã thêm ${qty} ${product.name} vào giỏ!`); }}
                                        className="flex-1 py-2.5 border-2 border-[#21246b] text-[#21246b] text-sm font-bold hover:bg-[#21246b] hover:text-white transition-colors"
                                    >
                                        THÊM VÀO GIỎ
                                    </button>
                                </div>

                                <div className="mt-4 text-sm text-slate-500">
                                    Categories: <span className="text-[#21246b]">{categorySlug}</span>
                                </div>
                            </div>
                        </div>

                        {/* Description Section */}
                        <div className="mt-12 border-t border-slate-200 pt-8">
                            <h2 className="text-xl font-bold text-[#21246b] mb-4">{product.name}</h2>
                            <p className="text-slate-700 leading-relaxed">{product.description}</p>
                        </div>

                        {/* Reviews Section */}
                        {/* Reviews Section */}
                        <div id="reviews" className="mt-12 border-t border-slate-200 pt-8">
                            <h2 className="text-xl font-bold text-[#21246b] mb-6">
                                {product.reviews?.length || 0} đánh giá cho {product.name}
                            </h2>

                            <div className="bg-white border rounded-lg p-6 mb-8 flex flex-col md:flex-row gap-8">
                                {/* Average Rating */}
                                <div className="flex-shrink-0 w-full md:w-48 text-center border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-6 flex flex-col justify-center items-center">
                                    <div className="text-5xl font-bold text-amber-500 mb-2">
                                        {((product.reviews || []).reduce((acc, r) => acc + r.rating, 0) / ((product.reviews || []).length || 1) || 5).toFixed(1)}
                                    </div>
                                    <div className="flex justify-center mb-2">
                                        <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-500 uppercase">Đánh giá trung bình</p>
                                </div>

                                {/* Rating Distribution */}
                                <div className="flex-grow space-y-2">
                                    {[5, 4, 3, 2, 1].map((star) => {
                                        const count = product.reviews?.filter(r => r.rating === star).length || 0;
                                        const total = product.reviews?.length || 0;
                                        const percent = total > 0 ? (count / total) * 100 : 0;

                                        return (
                                            <div key={star} className="flex items-center gap-3 text-sm">
                                                <span className="w-3 font-bold">{star}</span>
                                                <Star className="w-4 h-4 fill-black text-black" />
                                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-amber-500 rounded-full"
                                                        style={{ width: `${percent}%` }}
                                                    ></div>
                                                </div>
                                                <span className="w-12 text-right text-blue-600 font-medium">{percent.toFixed(0)}%</span>
                                                <span className="w-20 text-right text-slate-400">| {count} đánh giá</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Review List */}
                            {product.reviews && product.reviews.length > 0 ? (
                                <div className="space-y-6">
                                    {product.reviews.map((review) => (
                                        <div key={review.id} className="flex gap-4">
                                            <div className="flex-shrink-0">
                                                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold text-xl">
                                                    {review.user?.name?.charAt(0).toUpperCase() || 'K'}
                                                </div>
                                            </div>
                                            <div className="flex-grow">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-[#21246b]">{review.user?.name || 'Khách hàng'}</span>
                                                    <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                        <span className="text-[10px]">✓</span> Đã mua hàng tại Novas
                                                    </span>
                                                </div>
                                                <div className="flex mb-2">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                                                        />
                                                    ))}
                                                </div>
                                                <p className="text-slate-700 mb-3">{review.comment}</p>

                                                <div className="flex gap-4 text-xs text-slate-500 font-medium">
                                                    <button className="hover:text-blue-600">Trả lời</button>
                                                    <button className="flex items-center gap-1 hover:text-blue-600">
                                                        👍 Thích
                                                    </button>
                                                    <span>{new Date(review.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-500 text-center py-8">Chưa có đánh giá nào cho sản phẩm này.</p>
                            )}
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return null;
}

// Product Card Component
function ProductCard({ product, categorySlug }: { product: Product; categorySlug: string }) {
    return (
        <Link
            href={`/${categorySlug}/${product.slug}`}
            className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-[#21246b] transition-all"
        >
            <div className="relative aspect-square overflow-hidden">
                <div className="absolute top-3 left-3 z-10">
                    <span className="px-3 py-1 bg-[#21246b] text-white text-xs font-bold rounded">
                        Novas
                    </span>
                </div>
                <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex flex-col items-center justify-center text-white text-center shadow-lg border-2 border-amber-300">
                        <span className="text-[7px] font-bold">MIỄN PHÍ</span>
                        <span className="text-[8px] font-bold">LẮP ĐẶT</span>
                    </div>
                </div>
                {product.originalPrice && product.originalPrice > product.price && (
                    <div className="absolute bottom-3 left-3 z-10">
                        <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded shadow-lg">
                            -{Math.round(100 - (product.price / product.originalPrice) * 100)}%
                        </span>
                    </div>
                )}
                <img
                    src={product.image ? (product.image.startsWith('http') ? product.image : `${API_URL}${product.image.startsWith('/') ? '' : '/'}${product.image}`) : '/images/placeholder.png'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
            </div>

            <div className="p-4 bg-white">
                <h4 className="font-bold text-[#21246b] text-lg mb-3 line-clamp-2 min-h-[52px] group-hover:text-blue-800 transition-colors">
                    {product.name}
                </h4>

                <div className="flex items-center gap-2 mb-3">
                    <span className="text-[#21246b] font-bold text-xl">
                        {new Intl.NumberFormat('vi-VN').format(product.price)}đ
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-sm text-slate-400 line-through">
                            {new Intl.NumberFormat('vi-VN').format(product.originalPrice)}đ
                        </span>
                    )}
                </div>

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
