"use client";

import { useCart } from "@/context/CartContext";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";

export function CartIcon() {
    const { totalItems } = useCart();

    return (
        <Link href="/cart" className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <ShoppingCart className="h-6 w-6 text-slate-700 dark:text-slate-300" />
            {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems > 9 ? '9+' : totalItems}
                </span>
            )}
        </Link>
    );
}
