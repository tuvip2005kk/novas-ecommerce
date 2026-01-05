'use client';

import Link from 'next/link';
import { MapPin, Phone, Mail, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';

const showrooms = [
    // Cột trái
    { name: 'Showroom Enic Hà Nội', address: '502 Xã Đàn, phường Nam Đồng, quận Đống Đa, Hà Nội', mapUrl: 'https://www.google.com/maps/place/Enic+-+%C4%90%E1%BB%91ng+%C4%90a/' },
    { name: 'Showroom Enic Hồ Chí Minh', address: '94 - 96 - 98 Đinh Thị Thi, KĐT Vạn Phúc, Hiệp Bình Phước, TP.Thủ Đức, TP.HCM', mapUrl: 'https://goo.gl/maps/awMPQNg19Ka9vscZ8', label: 'Thủ Đức' },
    { name: 'Showroom Enic Tân Bình', address: '485 - 487 Phạm Văn Bạch, Phường 15, Quận Tân Bình, TP.HCM', mapUrl: 'https://maps.app.goo.gl/HDAYyj41KoXwzZeE7', label: 'Tân Bình' },
    { name: 'Showroom Enic Đà Nẵng', address: '460 Nguyễn Hữu Thọ, Phường Khuê Trung, Quận Cẩm Lệ, TP.Đà Nẵng', mapUrl: 'https://maps.app.goo.gl/DN6hWDNhxfNpGFPn8' },
    { name: 'Showroom Enic Hải Phòng', address: '508 - 509 lô HK 17, KĐT ven sông Lạch Tray, đường Võ Nguyên Giáp, Q. Lê Chân, TP. Hải Phòng', mapUrl: 'https://www.google.com/maps/place/Enic+-+H%E1%BA%A3i+Ph%C3%B2ng/' },
    { name: 'Showroom Enic Vĩnh Phúc', address: 'Số 123 đường Nguyễn Tất Thành, phường Liên Bảo, TP. Vĩnh Yên, tỉnh Vĩnh Phúc', mapUrl: 'https://maps.app.goo.gl/e99UHzTfF38C6MVg7' },
    { name: 'Showroom Enic Hưng Yên', address: 'ĐLBM-80-82-84, đường Đại Lộ Bốn Mùa, khu đô thị Vinhomes Ocean Park 3, xã Nghĩa Trụ, huyện Văn Giang, tỉnh Hưng Yên', mapUrl: 'https://maps.app.goo.gl/9jUVa8wMNDynAbTD8' },
    { name: 'Showroom Enic Sơn La', address: '143 đường Trường Chinh, Tổ 1, Phường Quyết Thắng, TP. Sơn La, Tỉnh Sơn La', mapUrl: 'https://maps.app.goo.gl/Fm3RDbHUkYeRTp5u7' },
    { name: 'Showroom Enic Hoà Bình', address: 'LK 31-33 Khu Bắc Trần Hưng Đạo, Tổ 5 Phường Quỳnh Lâm, thành phố Hoà Bình, tỉnh Hoà Bình', mapUrl: 'https://www.google.com/maps/place/Enic+H%C3%B2a+B%C3%ACnh/' },
    { name: 'Showroom Enic Phú Thọ', address: 'Số 14 Lê Đồng, Phường Nông Trang, Thành phố Việt Trì, Tỉnh Phú Thọ', mapUrl: 'https://share.google/HtP7fcZJE2Pxn4lAU' },
    // Cột phải
    { name: 'Showroom Enic Ninh Bình', address: '543 đường Trần Hưng Đạo, phường Ninh Khánh, TP. Ninh Bình, Tỉnh Ninh Bình', mapUrl: 'https://www.google.com/maps/place/Enic+Ninh+B%C3%ACnh/' },
    { name: 'Showroom Enic Nghệ An', address: 'Siêu thị gạch ốp lát An Đông, số 7 đường Nguyễn Trãi, phường Quán Bàu, TP.Vinh, tỉnh Nghệ An', mapUrl: 'https://maps.app.goo.gl/4sKzbCLjQhiP15Bf6' },
    { name: 'Showroom Enic Hà Tĩnh', address: '407 - 409 Đường Hà Huy Tập, Phường Đại Nài, TP. Hà Tĩnh, Tỉnh Hà Tĩnh', mapUrl: 'https://maps.app.goo.gl/U2y7Xne1Jh9LT8oW9' },
    { name: 'Showroom Enic Quảng Bình', address: '25 Phùng Hưng, Phường Đồng Phú, TP. Đồng Hới, Tỉnh Quảng Bình', mapUrl: 'https://maps.app.goo.gl/rbDWuAbDZiRUDtv78' },
    { name: 'Showroom Enic Quảng Trị', address: 'Ngã Tư Sòng, QL1A, xã Thanh An, huyện Cam Lộ, tỉnh Quảng Trị', mapUrl: 'https://maps.app.goo.gl/VaiPak3aYL1Ek7gu8' },
    { name: 'Showroom Enic Quảng Ngãi', address: 'Số 1 Đoàn Thị Điểm, phường Chánh Lộ, TP Quảng Ngãi, tỉnh Quảng Ngãi', mapUrl: 'https://maps.app.goo.gl/UWAxhRRrBxmXKQG99' },
    { name: 'Showroom Enic Ninh Thuận', address: 'Số 73 Nguyễn Văn Cừ, phường Đài Sơn, TP. Phan Rang - Tháp Chàm, tỉnh Ninh Thuận', mapUrl: 'https://maps.app.goo.gl/TM8FEkacwG9nqoBQA' },
    { name: 'Showroom Enic Đồng Nai', address: 'Số 90 - 91 Đường Đồng Khởi, Khu phố 6, Phường Tam Hiệp, Thành phố Biên Hoà, Tỉnh Đồng Nai', mapUrl: 'https://maps.app.goo.gl/wSKuxfbjjk56aakw9' },
    { name: 'Showroom Enic Bình Dương', address: '554 Đại lộ Bình Dương, phường Hiệp Thành, Thành phố Thủ Dầu Một, Tỉnh Bình Dương', mapUrl: 'https://maps.app.goo.gl/ekPeBuxN15K87wT68' },
];

const supportLinks = [
    { label: 'Chính sách thanh toán', href: '/chinh-sach-thanh-toan' },
    { label: 'Chính sách bảo hành', href: '/chinh-sach-bao-hanh' },
    { label: 'Chính sách vận chuyển & lắp đặt', href: '/chinh-sach-van-chuyen' },
    { label: 'Chính sách bảo mật', href: '/chinh-sach-bao-mat' },
];

export default function Footer() {
    const [showBackTop, setShowBackTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowBackTop(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="bg-[#1a1a2e] text-white">
            {/* Main Footer */}
            <div className="max-w-[1400px] mx-auto px-4 py-10">
                {/* Showrooms Grid */}
                <div className="border border-white/30 rounded-lg bg-[#252545] p-6 mb-10 mx-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {showrooms.slice(0, 8).map((showroom, i) => (
                            <div key={i} className="text-sm">
                                <h4 className="font-bold text-white mb-2">{showroom.name}</h4>
                                <p className="text-gray-300 flex items-start gap-2 font-normal">
                                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#04abcc]" />
                                    <span>
                                        {showroom.label && <b>{showroom.label}: </b>}
                                        {!showroom.label && <b>Địa chỉ: </b>}
                                        {showroom.address}
                                        <a
                                            href={showroom.mapUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[#04abcc] font-bold ml-1 hover:underline"
                                        >
                                            (Mở bản đồ)
                                        </a>
                                    </span>
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-gray-700 pt-8 mx-8 px-6">
                    {/* Support Links */}
                    <div>
                        <h3 className="font-bold text-lg mb-4 uppercase">Hỗ trợ khách hàng</h3>
                        <div className="space-y-2">
                            {supportLinks.map((link, i) => (
                                <Link key={i} href={link.href} className="block text-gray-300 hover:text-[#04abcc] transition-colors font-normal">
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Contact + Payment */}
                    <div>
                        <h3 className="font-bold text-lg mb-4 uppercase">Liên hệ</h3>
                        <div className="space-y-3">
                            <div>
                                <h4 className="font-semibold text-white mb-1">Tổng đài</h4>
                                <p className="flex items-center gap-2 text-gray-300 font-normal">
                                    <Phone className="w-4 h-4" />
                                    Tổng đài CSKH: <a href="tel:19009430" className="text-[#04abcc] font-bold">1900 9430</a>
                                </p>
                                <p className="flex items-center gap-2 text-gray-300 mt-1 font-normal">
                                    <Phone className="w-4 h-4" />
                                    Tổng đài tư vấn: <a href="tel:18008149" className="text-[#04abcc] font-bold">1800 8149</a>
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-white mb-1">Email</h4>
                                <p className="flex items-center gap-2 text-gray-300 font-normal">
                                    <Mail className="w-4 h-4" />
                                    PKD: <a href="mailto:sell@novas.vn" className="font-bold hover:text-[#04abcc]">sell@novas.vn</a>
                                </p>
                                <p className="flex items-center gap-2 text-gray-300 mt-1 font-normal">
                                    <Mail className="w-4 h-4" />
                                    Chăm sóc KH: <a href="mailto:cskh@novas.vn" className="font-bold hover:text-[#04abcc]">cskh@novas.vn</a>
                                </p>
                                <p className="flex items-center gap-2 text-gray-300 mt-1 font-normal">
                                    <Mail className="w-4 h-4" />
                                    Tuyển dụng: <a href="mailto:hr@novas.vn" className="font-bold hover:text-[#04abcc]">hr@novas.vn</a>
                                </p>
                            </div>
                        </div>

                        {/* Payment */}
                        <h3 className="font-bold text-lg mb-4 mt-6 uppercase">Thanh toán</h3>
                        <div className="flex gap-2 mb-4">
                            <div className="bg-white p-2 rounded">
                                <img src="https://enic.vn/wp-content/uploads/2023/01/ff.jpg" alt="Payment methods" className="h-8" />
                            </div>
                        </div>
                        <a href="http://online.gov.vn/Home/WebDetails/138250" target="_blank" rel="noopener noreferrer">
                            <img src="https://enic.vn/wp-content/uploads/2022/09/dathongbaobct.png" alt="Đã thông báo Bộ Công Thương" className="h-12" />
                        </a>
                    </div>

                    {/* Fanpage */}
                    <div>
                        <h3 className="font-bold text-lg mb-4 uppercase">Fanpage</h3>
                        <a
                            href="https://www.facebook.com/profile.php?id=61577455030584"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block overflow-hidden rounded-lg border border-gray-600 hover:border-[#04abcc] transition-colors"
                        >
                            <img
                                src="/images/fanpage.png"
                                alt="Fanpage"
                                className="w-full h-auto"
                            />
                        </a>
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className="bg-[#0f0f1a] py-4 text-center text-gray-400 text-sm">
                Copyright 2024 © <strong className="text-white">ENIC COMPANY</strong>
            </div>

            {/* Fixed Buttons */}
            <div className="fixed right-4 bottom-4 flex flex-col gap-3 z-50">
                <a
                    href="https://m.me/61577455030584"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                >
                    <img src="https://enic.vn/wp-content/uploads/2024/07/mememe.png" alt="Messenger" className="w-7 h-7" />
                </a>
                <a
                    href="tel:18008149"
                    className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform animate-pulse"
                >
                    <Phone className="w-6 h-6" />
                </a>
                {showBackTop && (
                    <button
                        onClick={scrollToTop}
                        className="w-12 h-12 bg-[#21246b] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    >
                        <ChevronUp className="w-6 h-6" />
                    </button>
                )}
            </div>
        </footer>
    );
}
