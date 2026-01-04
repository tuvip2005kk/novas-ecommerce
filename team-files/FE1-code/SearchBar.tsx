"use client";

import { Search, X } from "lucide-react";
import { useState } from "react";

interface SearchBarProps {
    onSearch: (query: string) => void;
    onCategoryChange: (category: string) => void;
    categories: string[];
}

export function SearchBar({ onSearch, onCategoryChange, categories }: SearchBarProps) {
    const [query, setQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");

    const handleSearch = (value: string) => {
        setQuery(value);
        onSearch(value);
    };

    const handleCategoryChange = (value: string) => {
        setSelectedCategory(value);
        onCategoryChange(value);
    };

    const clearSearch = () => {
        setQuery("");
        onSearch("");
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 mb-8">
            {/* Search Input */}
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Tìm kiếm sản phẩm..."
                    className="w-full h-12 pl-12 pr-10 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
                {query && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Category Filter */}
            <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="h-12 px-4 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all min-w-[150px]"
            >
                <option value="">Tất cả danh mục</option>
                {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
            </select>
        </div>
    );
}
