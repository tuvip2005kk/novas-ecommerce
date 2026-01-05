"use client";

import { SearchBar } from "@/components/SearchBar";
import { LikeButton } from "@/components/LikeButton";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
}

export function ProductListClient({ initialProducts }: { initialProducts: Product[] }) {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts);
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        // Extract unique categories
        const cats = Array.from(new Set(initialProducts.map(p => p.category)));
        setCategories(cats);
    }, [initialProducts]);

    const handleSearch = (query: string) => {
        if (!query) {
            setFilteredProducts(products);
            return;
        }
        const lowQuery = query.toLowerCase();
        setFilteredProducts(
            products.filter(p =>
                p.name.toLowerCase().includes(lowQuery) ||
                p.description.toLowerCase().includes(lowQuery)
            )
        );
    };

    const handleCategoryChange = (category: string) => {
        if (!category) {
            setFilteredProducts(products);
            return;
        }
        setFilteredProducts(products.filter(p => p.category === category));
    };

    return (
        <div>
            <SearchBar
                onSearch={handleSearch}
                onCategoryChange={handleCategoryChange}
                categories={categories}
            />

            {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-slate-500">Không tìm thấy sản phẩm nào</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredProducts.map((product) => (
                        <div key={product.id} className="relative group">
                            <LikeButton
                                productId={product.id}
                                className="absolute top-3 right-3 z-10 shadow-md"
                            />
                            <Link href={`/products/${product.id}`}>
                                <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 hover:border-blue-200 hover:shadow-xl transition-all duration-300">
                                    <div className="aspect-square bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                                        <div
                                            className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                                            style={{ backgroundImage: `url(${product.image})` }}
                                        />
                                    </div>
                                    <div className="p-4">
                                        <span className="text-xs text-blue-600 font-medium">{product.category}</span>
                                        <h3 className="font-semibold text-slate-900 dark:text-white mt-1 group-hover:text-blue-600 transition-colors">
                                            {product.name}
                                        </h3>
                                        <p className="text-sm text-slate-500 line-clamp-2 mt-1">{product.description}</p>
                                        <p className="text-lg font-bold text-blue-600 mt-3">${product.price}</p>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

