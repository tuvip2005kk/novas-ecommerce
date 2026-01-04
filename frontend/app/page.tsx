import { BannerCarousel } from "@/components/BannerCarousel";
import { CommitmentSection } from "@/components/CommitmentSection";
import { CategorySection } from "@/components/CategorySection";
import { TrendingSection } from "@/components/TrendingSection";
import { ShowroomBanner } from "@/components/ShowroomBanner";
import { ProductListClient } from "@/components/ProductListClient";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";

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
        <main className="min-h-screen bg-slate-50">
            <Header />
            <BannerCarousel />
            <CommitmentSection />
            <div className="mt-2">
                <ShowroomBanner />
            </div>
            <CategorySection />
            <TrendingSection />
            <Footer />
        </main>
    );
}

