"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, X, Loader2 } from "lucide-react";
// Use absolute API URL to avoid env issues
const BASE_API = "https://novas-ecommerce.onrender.com";

const defaultCategories = [
    { name: "Bồn cầu", href: "/bon-cau" },
    { name: "Chậu Lavabo", href: "/lavabo" },
    { name: "Vòi Sen", href: "/voi-sen" },
    { name: "Bồn Tắm", href: "/bon-tam" },
    { name: "Phụ Kiện", href: "/phu-kien" },
    { name: "Thiết bị vệ sinh", href: "/thiet-bi-ve-sinh" },
];

export function SearchPopup({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Results
    const [products, setProducts] = useState<any[]>([]);
    const [subcategories, setSubcats] = useState<any[]>([]);

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen, onClose]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query.trim());
        }, 500);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        if (!debouncedQuery) {
            setProducts([]);
            setSubcats([]);
            return;
        }

        const fetchResults = async () => {
            setIsLoading(true);
            try {
                // Fetch Products
                const pRes = await fetch(`${BASE_API}/api/products?search=${encodeURIComponent(debouncedQuery)}`);
                const pData = await pRes.json();

                // Fetch Subcategories (Since API returns all, we filter locally)
                const sRes = await fetch(`${BASE_API}/api/subcategories`);
                const sData = await sRes.json();
                const filteredSubcats = (sData || []).filter((s: any) =>
                    s.name.toLowerCase().includes(debouncedQuery.toLowerCase())
                );

                console.log('Search results', { products: pData, subcats: filteredSubcats });
                setProducts(pData.products || pData || []);
                setSubcats(filteredSubcats);
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [debouncedQuery]);

    if (!isOpen) return null;

    // Filter default categories if user just types matching category without hitting API delay, or just show default categories when empty
    const filteredDefault = query.trim()
        ? defaultCategories.filter((c) =>
            c.name.toLowerCase().includes(query.toLowerCase())
        )
        : defaultCategories;

    const hasNoApiResults = debouncedQuery && products.length === 0 && subcategories.length === 0 && !isLoading;

    return (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-24 bg-black/50" onClick={onClose}>
            <div
                className="bg-white rounded-none shadow-2xl w-full max-w-2xl mx-4 p-6"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 border-b border-gray-200 pb-4 mb-4">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Tìm kiếm sản phẩm, danh mục..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-1 outline-none text-gray-800 text-base"
                    />
                    {isLoading && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {/* Default Categories if empty query or matches default */}
                    {(!debouncedQuery || filteredDefault.length > 0) && (
                        <div className="mb-6">
                            <p className="text-sm font-semibold text-gray-500 mb-3">Danh mục đề xuất</p>
                            <div className="flex flex-wrap gap-2">
                                {filteredDefault.map((cat) => (
                                    <Link
                                        key={cat.href}
                                        href={cat.href}
                                        onClick={onClose}
                                        className="px-4 py-2 rounded-full border border-gray-300 text-sm text-[#21246b] font-medium hover:bg-[#21246b] hover:text-white transition-colors"
                                    >
                                        {cat.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Subcategory Results */}
                    {subcategories.length > 0 && (
                        <div className="mb-6">
                            <p className="text-sm font-semibold text-gray-500 mb-3">Danh mục phụ</p>
                            <div className="flex flex-col gap-2">
                                {subcategories.map((sub) => (
                                    <Link
                                        key={sub.id}
                                        href={`/${sub.category?.slug}/${sub.slug}`}
                                        onClick={onClose}
                                        className="flex items-center gap-3 p-2 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center shrink-0 overflow-hidden">
                                            {sub.image ? (
                                                <img src={sub.image} alt={sub.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Search className="w-4 h-4 text-slate-400" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">{sub.name}</p>
                                            <p className="text-xs text-slate-500">{sub.category?.name || "Danh mục phụ"}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Product Results */}
                    {products.length > 0 && (
                        <div className="mb-6">
                            <p className="text-sm font-semibold text-gray-500 mb-3">Sản phẩm</p>
                            <div className="flex flex-col gap-2">
                                {products.map((product) => (
                                    <Link
                                        key={product.id}
                                        href={`/${product.category?.slug || 'products'}/${product.slug || product.id}`}
                                        onClick={onClose}
                                        className="flex items-center gap-4 p-2 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="w-14 h-14 bg-slate-100 rounded flex items-center justify-center shrink-0 overflow-hidden">
                                            {product.image ? (
                                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Search className="w-5 h-5 text-slate-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 truncate">{product.name}</p>
                                            <p className="text-sm font-bold text-blue-600 mt-1">
                                                {product.price?.toLocaleString('vi-VN')} đ
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* No results */}
                    {hasNoApiResults && (
                        <div className="py-8 text-center text-slate-500">
                            <Search className="w-8 h-8 mx-auto text-slate-300 mb-3" />
                            <p>Không tìm thấy sản phẩm hoặc danh mục nào cho "{debouncedQuery}"</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
