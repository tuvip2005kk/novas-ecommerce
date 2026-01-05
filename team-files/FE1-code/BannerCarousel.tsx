"use client";
import { API_URL } from '@/config';

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import Link from "next/link";

interface Banner {
    id: number;
    image: string;
    title: string;
    description: string;
    link: string;
    cta: string;
}

// Fallback slides if API fails
const fallbackSlides = [
    {
        id: 1,
        image: "/images/banners/bon-cau-banner.png",
        title: "BST Phòng Tắm Luxury",
        description: "Không gian thư giãn đẳng cấp 5 sao ngay tại nhà bạn",
        link: "/products",
        cta: "Khám Phá Ngay"
    },
    {
        id: 2,
        image: "/images/banners/lavabo-banner.png",
        title: "Bồn Cầu Thông Minh 2024",
        description: "Công nghệ tự động hóa, kháng khuẩn vượt trội",
        link: "/bon-cau",
        cta: "Xem Chi Tiết"
    },
    {
        id: 3,
        image: "/images/banners/voi-sen-banner.png",
        title: "Sen Tắm Nhiệt Độ Spa",
        description: "Trải nghiệm tắm mưa massage trị liệu",
        link: "/voi-sen",
        cta: "Mua Ngay"
    }
];

export function BannerCarousel() {
    const [slides, setSlides] = useState<Banner[]>(fallbackSlides);
    const [current, setCurrent] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/api/banners?pageType=homepage`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setSlides(data);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const nextSlide = () => {
        setCurrent((curr) => (curr === slides.length - 1 ? 0 : curr + 1));
    };

    const prevSlide = () => {
        setCurrent((curr) => (curr === 0 ? slides.length - 1 : curr - 1));
    };

    useEffect(() => {
        const timer = setInterval(() => {
            nextSlide();
        }, 5000); // 5 seconds autoplay

        return () => clearInterval(timer);
    }, [slides]);

    // Helper to get correct image URL
    const getImageUrl = (image: string) => {
        if (image.startsWith('/uploads')) {
            return `${API_URL}${image}`;
        }
        return image;
    };

    return (
        <div className="relative w-full aspect-[4/3] md:aspect-[21/9] overflow-hidden bg-slate-900 group">
            {/* Slides */}
            {slides.map((slide, index) => (
                <div
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === current ? "opacity-100 placeholder-opacity-100" : "opacity-0"
                        }`}
                >
                    {/* Background Image */}
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] ease-linear"
                        style={{
                            backgroundImage: `url(${getImageUrl(slide.image)})`,
                            transform: index === current ? "scale(1.05)" : "scale(1)"
                        }}
                    >
                        <div className="absolute inset-0 bg-black/40" /> {/* Dark overlay */}
                    </div>

                    {/* Content */}
                    <div className="absolute inset-x-0 bottom-0 top-0 flex items-center justify-center text-center p-4">
                        <div className={`max-w-3xl space-y-6 transition-all duration-1000 delay-300 ${index === current ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                            }`}>
                            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight drop-shadow-xl">
                                {slide.title}
                            </h2>
                            <p className="text-lg md:text-xl text-white/90 max-w-xl mx-auto">
                                {slide.description}
                            </p>
                            <Link href={slide.link || "/products"}>
                                <Button size="lg" className="bg-white text-slate-900 hover:bg-white/90 text-sm md:text-base">
                                    {slide.cta || "Khám Phá"}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            ))}

            {/* Navigation Arrows */}
            <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
            >
                <ChevronLeft className="h-6 w-6" />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
            >
                <ChevronRight className="h-6 w-6" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrent(index)}
                        className={`w-3 h-3 rounded-full transition-all ${index === current
                            ? "bg-white w-8"
                            : "bg-white/50 hover:bg-white/80"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
