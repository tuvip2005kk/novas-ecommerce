"use client";

import Link from "next/link";

export function ProductList({ products }: { products: any[] }) {
    if (products.length === 0) {
        return <div className="text-center text-slate-500">Loading luxury collection... (Check Backend)</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
            {/* Map first product as large item */}
            {products[0] && (
                <Link href={`/products/${products[0].id}`} className="md:row-span-2 block h-full">
                    <div className="relative group overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900 h-full transition-transform hover:scale-[1.02]">
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors z-10" />
                        {/* Placeholder for real image */}
                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${products[0].image})` }} />
                        <div className="absolute bottom-0 left-0 p-8 z-20 text-white">
                            <h3 className="text-2xl font-bold mb-2">{products[0].name}</h3>
                            <p className="text-sm opacity-90">{products[0].description}</p>
                            <p className="mt-2 font-bold">${products[0].price}</p>
                        </div>
                    </div>
                </Link>
            )}

            {/* Map other products */}
            <div className="md:col-span-2 grid grid-cols-2 gap-6 h-full">
                {products.slice(1, 5).map((product: any) => (
                    <Link href={`/products/${product.id}`} key={product.id} className="block h-full">
                        <div className="relative group overflow-hidden rounded-2xl bg-blue-50 dark:bg-slate-800 h-full transition-transform hover:scale-[1.02]">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 to-transparent z-10" />
                            <div className="absolute bottom-0 left-0 p-6 z-20 text-slate-900 dark:text-white">
                                <h3 className="text-xl font-bold">{product.name}</h3>
                                <p className="text-sm opacity-75 line-clamp-1">{product.description}</p>
                                <p className="mt-1 font-bold">${product.price}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
