"use client";

import { ReviewsSection } from "@/components/ReviewsSection";

export function ReviewsWrapper({ productId, productName }: { productId: number; productName?: string }) {
    return <ReviewsSection productId={productId} productName={productName} />;
}
