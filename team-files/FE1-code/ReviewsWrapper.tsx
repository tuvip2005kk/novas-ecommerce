"use client";

import { ReviewsSection } from "@/components/ReviewsSection";

export function ReviewsWrapper({ productId }: { productId: number }) {
    return <ReviewsSection productId={productId} />;
}
