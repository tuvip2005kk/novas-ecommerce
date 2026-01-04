"use client";

import Link from "next/link";

export function ShowroomBanner() {
    return (
        <section className="bg-white">
            <div className="max-w-[1200px] mx-auto px-4 md:px-6">
                <Link href="/thiet-bi-ve-sinh" className="block">
                    <img
                        src="/images/showroom-banner.png"
                        alt="Novas - Thiết bị vệ sinh thông minh cao cấp"
                        className="w-full hover:opacity-95 transition-opacity cursor-pointer"
                    />
                </Link>
            </div>
        </section>
    );
}
