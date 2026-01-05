"use client";

const commitments = [
    {
        icon: "/images/icons/shipping.png",
        title: "MIỄN PHÍ VẬN CHUYỂN",
        description: "Toàn quốc"
    },
    {
        icon: "/images/icons/installation.png",
        title: "MIỄN PHÍ LẮP ĐẶT",
        description: "Toàn quốc"
    },
    {
        icon: "/images/icons/warranty.png",
        title: "BẢO HÀNH DÀI HẠN",
        description: "Trực tiếp từ đội ngũ kỹ thuật của hãng"
    },
    {
        icon: "/images/icons/maintenance.png",
        title: "BẢO TRÌ TRỌN ĐỜI",
        description: "Tất cả các dòng sản phẩm Novas"
    }
];

export function CommitmentSection() {
    return (
        <section className="py-8 bg-slate-100">
            <div className="max-w-[1200px] mx-auto px-4 md:px-6">
                {/* Title with lines */}
                <div className="text-center mb-8 relative">
                    <div className="absolute top-1/2 left-0 w-full h-px bg-[#21246b]"></div>
                    <h2 className="text-xl font-bold bg-slate-100 relative z-10 px-6 inline-block text-[#21246b] uppercase">
                        AN TÂM MUA SẮM TẠI NOVAS
                    </h2>
                </div>

                {/* 4 commitment cards in a row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10">
                    {commitments.map((item, index) => (
                        <div
                            key={index}
                            className="relative flex flex-col items-center text-center pt-12 pb-6 px-4 bg-slate-200 rounded-xl border-b-4 border-[#21246b] hover:shadow-lg transition-all"
                        >
                            {/* Icon positioned half outside */}
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 flex items-center justify-center">
                                <img
                                    src={item.icon}
                                    alt={item.title}
                                    className="w-14 h-14 object-contain"
                                />
                            </div>
                            <h3 className="font-bold text-[#21246b] mb-1 uppercase text-sm">
                                {item.title}
                            </h3>
                            <p className="text-slate-500 text-xs">
                                {item.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
