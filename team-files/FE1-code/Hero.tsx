import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, ShoppingBag, ShieldCheck } from "lucide-react";
import Link from "next/link";

export function Hero() {
    return (
        <section className="relative pt-32 pb-20 overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-slate-50 to-white dark:from-slate-900 dark:via-slate-950 dark:to-black opacity-70"></div>

            <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <h1 className="text-5xl md:text-7xl font-bold leading-tight text-slate-900 dark:text-white">
                        Elevate Your <br />
                        <span className="text-blue-600">Living Space</span>
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-lg">
                        Experience the perfect blend of modern design, premium materials, and smart technology for your bathroom.
                    </p>
                    <div className="flex gap-4">
                        <Link href="#products">
                            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 h-12 px-8">
                                Explore Collection <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="#products">
                            <Button size="lg" variant="outline" className="h-12 px-8">
                                View Catalog
                            </Button>
                        </Link>
                    </div>

                    <div className="pt-8 flex items-center gap-6 text-sm text-slate-500 font-medium">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="text-blue-600 h-5 w-5" /> 5-Year Warranty
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="text-blue-600 h-5 w-5" /> Free Installation
                        </div>
                    </div>
                </div>

                <div className="relative h-[500px] bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
                    {/* Abstract 3D placeholder */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <ShoppingBag className="mx-auto h-24 w-24 text-slate-300 dark:text-slate-600 mb-4" />
                            <p className="text-slate-400">Premium 3D Product Image Here</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
