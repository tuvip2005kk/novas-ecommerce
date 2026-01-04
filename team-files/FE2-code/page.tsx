import { Hero } from "@/components/Hero";
import { ProductListClient } from "@/components/ProductListClient";
import { Header } from "@/components/Header";

async function getProducts() {
    try {
        const res = await fetch('http://localhost:3005/api/products', { cache: 'no-store' });
        if (!res.ok) return [];
        return res.json();
    } catch (error) {
        console.error('Connection error:', error);
        return [];
    }
}

export default async function Home() {
    const products = await getProducts();

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Header />
            <Hero />

            <section id="products" className="py-20 bg-white dark:bg-slate-950">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">Premium Collections</h2>
                        <p className="text-slate-500">Curated specifically for modern homes</p>
                    </div>
                    <ProductListClient initialProducts={products} />
                </div>
            </section>
        </main>
    );
}
