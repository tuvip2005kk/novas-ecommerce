"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";

const categories = [
    { name: "Bồn cầu", href: "/bon-cau" },
    { name: "Chậu Lavabo", href: "/lavabo" },
    { name: "Vòi Sen", href: "/voi-sen" },
    { name: "Bồn Tắm", href: "/bon-tam" },
    { name: "Phụ Kiện", href: "/phu-kien" },
    { name: "Thiết bị vệ sinh", href: "/thiet-bi-ve-sinh" },
];

export function SearchPopup({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [query, setQuery] = useState("");
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

    if (!isOpen) return null;

    const filtered = query.trim()
        ? categories.filter((c) =>
            c.name.toLowerCase().includes(query.toLowerCase())
        )
        : categories;

    return (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-24 bg-black/50" onClick={onClose}>
            <div
                className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4 p-6"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 border-b border-gray-200 pb-4 mb-4">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Tìm kiếm danh mục..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-1 outline-none text-gray-800 text-base"
                    />
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Category List */}
                <div>
                    <p className="text-sm font-semibold text-gray-500 mb-3">Danh mục</p>
                    <div className="flex flex-wrap gap-2">
                        {filtered.map((cat) => (
                            <Link
                                key={cat.href}
                                href={cat.href}
                                onClick={onClose}
                                className="px-4 py-2 rounded-full border border-gray-300 text-sm text-[#21246b] font-medium hover:bg-[#21246b] hover:text-white transition-colors"
                            >
                                {cat.name}
                            </Link>
                        ))}
                        {filtered.length === 0 && (
                            <p className="text-gray-400 text-sm">Không tìm thấy danh mục phù hợp.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
