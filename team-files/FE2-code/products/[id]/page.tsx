import { ArrowLeft, CheckCircle2, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton, BuyNowButton } from "@/components/ProductButtons";
import { HeaderWrapper } from "@/components/HeaderWrapper";
import { ReviewsWrapper } from "@/components/ReviewsWrapper";

// Fetch data from Backend
async function getProduct(id: string) {
    try {
        const res = await fetch(`http://localhost:3005/api/products/${id}`, { cache: "no-store" });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        return null;
    }
}

export default async function ProductPage({ params }: { params: { id: string } }) {
    const product = await getProduct(params.id);

    if (!product) {
        notFound();
    }

    return (
        <>
            <HeaderWrapper />
            <main className="min-h-screen bg-white dark:bg-slate-950 pt-20 pb-12">
                <div className="container mx-auto px-4">
                    <Link href="/" className="inline-flex items-center text-slate-500 hover:text-blue-600 mb-8 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại trang chủ
                    </Link>

                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Left: Image */}
                        <div className="aspect-square bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden relative">
                            {/* Use real image if available, else placeholder */}
                            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${product.image})` }} />
                        </div>

                        {/* Right: Info */}
                        <div className="space-y-8">
                            <div>
                                <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">{product.name}</h1>
                                <p className="text-2xl font-bold text-blue-600">${product.price}</p>
                            </div>

                            <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
                                {product.description}
                            </p>

                            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                    <CheckCircle2 className="text-green-500 h-5 w-5" />
                                    <span>Hàng chính hãng 100%</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                    <ShieldCheck className="text-blue-500 h-5 w-5" />
                                    <span>Bảo hành 5 năm tại nhà</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                    <Truck className="text-orange-500 h-5 w-5" />
                                    <span>Miễn phí vận chuyển toàn quốc</span>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <AddToCartButton product={{ id: product.id, name: product.name, price: product.price, image: product.image }} />
                                <BuyNowButton productId={product.id} />
                            </div>
                        </div>
                    </div>

                    {/* Reviews Section */}
                    <ReviewsWrapper productId={product.id} />
                </div>
            </main>
        </>
    );
}

