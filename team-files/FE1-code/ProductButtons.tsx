"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, Check } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

interface Product {
    id: number;
    name: string;
    price: number;
    image: string;
}

export function AddToCartButton({ product }: { product: Product }) {
    const { addItem } = useCart();
    const [added, setAdded] = useState(false);

    const handleAddToCart = () => {
        addItem(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    return (
        <Button
            size="lg"
            className={`flex-1 h-14 text-lg transition-all ${added ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            onClick={handleAddToCart}
        >
            {added ? (
                <>
                    <Check className="mr-2 h-5 w-5" /> Đã thêm!
                </>
            ) : (
                <>
                    <ShoppingCart className="mr-2 h-5 w-5" /> Thêm vào giỏ
                </>
            )}
        </Button>
    );
}

export function BuyNowButton({ productId }: { productId: number }) {
    return (
        <Link href={`/checkout?productId=${productId}`} className="flex-1">
            <Button size="lg" variant="outline" className="w-full h-14 text-lg border-blue-600 text-blue-600 hover:bg-blue-50">
                Mua ngay
            </Button>
        </Link>
    );
}
