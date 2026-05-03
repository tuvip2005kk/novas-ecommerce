import { API_URL } from '@/config';
import { BannerCarousel } from "@/components/BannerCarousel";
import { CommitmentSection } from "@/components/CommitmentSection";
import CategorySection from "@/components/CategorySection";
import TrendingSection from "@/components/TrendingSection";
import { ShowroomBanner } from "@/components/ShowroomBanner";
import { ProductListClient } from "@/components/ProductListClient";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";

// Force dynamic rendering (skip build-time SSR)
export const dynamic = 'force-dynamic';

async function getProducts() {
    try {
        const res = await fetch(`${API_URL}/api/products`, { cache: 'no-store' });
        if (!res.ok) return [];
        return res.json();
    } catch (error) {
        console.error('Connection error:', error);
        return [];
    }
}

async function getBanners() {
    try {
        const res = await fetch(`${API_URL}/api/banners?pageType=homepage`, { cache: 'no-store' });
        const data = await res.json();
        // console.log(`[SSR] Banners API response: ${JSON.stringify(data)}`);
        return data;
    } catch (error) {
        console.error('Connection error:', error);
        return null;
    }
}

export default async function Home() {
    const products = await getProducts();
    const banners = await getBanners();

    console.log(`[SSR] Banners fetched: ${banners?.length || 0}`);
    if (banners && banners.length > 0) {
        console.log(`[SSR] First banner: ${banners[0].title}`);
    } else {
        console.log('[SSR] No banners available to display.');
    }

    return (
        <>
            <Header />
            <main className="min-h-screen bg-slate-50 pt-[70px]">
                <BannerCarousel initialBanners={banners} />
                <CommitmentSection />
                <div className="mt-2">
                    <ShowroomBanner />
                </div>
                <CategorySection />
                <TrendingSection />
            </main>
            <Footer />
        </>
    );
}

