"use client";

import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import warrantyData from "./warranty-data.json";

// Types for our JSON data
// We'll use any for simplicity as data structure is dynamic
interface SectionItem {
    name: string;
    table: string[][];
}

interface Section {
    title: string;
    items: SectionItem[];
}

const TableRenderer = ({ headers, rows }: { headers: string[], rows: string[][] }) => (
    <div className="overflow-x-auto my-4">
        <table className="min-w-full border-collapse border border-gray-200 text-sm">
            <thead>
                <tr className="bg-gray-100">
                    {headers.map((h, i) => (
                        <th key={i} className="border border-gray-300 px-4 py-2 text-left font-bold text-[#21246b] whitespace-pre-wrap">
                            {h}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                        {row.map((cell, j) => (
                            <td key={j} className="border border-gray-300 px-4 py-2 whitespace-pre-wrap">
                                {cell}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export default function WarrantyPolicyPage() {
    // Separate data
    // Section I.1: "1. Thời hạn..."
    const policySection = warrantyData.find((d: any) => d.title.includes("Thời hạn"));

    // Section III starts with "1. Sản phẩm đèn..." (which was parsed as first item of that section)
    // Actually, distinct from "Thời hạn".
    // We filter out "Thời hạn" to get Pricing sections.
    const pricingSections = warrantyData.filter((d: any) => !d.title.includes("Thời hạn"));

    return (
        <>
            <Header />
            <main className="min-h-screen bg-gray-50 pt-24 pb-12">
                <div className="max-w-[1200px] mx-auto px-4">
                    <div className="bg-white rounded-lg shadow-sm p-8">
                        <h1 className="text-3xl font-bold text-[#21246b] mb-8 text-center uppercase">Chính sách bảo hành, bảo trì của Enic</h1>

                        <div className="prose max-w-none text-gray-700 space-y-8">
                            {/* Section I */}
                            <section>
                                <h2 className="text-2xl font-bold text-[#21246b] mb-4 border-b pb-2">I. PHẠM VI BẢO HÀNH</h2>

                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">1. Thời hạn bảo hành sản phẩm</h3>
                                    <p className="mb-2">Tất cả sản phẩm mang nhãn hiệu Enic sẽ được bảo hành theo quy định sau: Thời hạn bảo hành được xác nhận dựa vào thông tin bảo hành điện tử thông qua phần mềm lưu trữ thông tin khách hàng của công ty hoặc giấy chứng từ xác nhận mua hàng.</p>
                                    <p className="mb-4">Dưới đây là thông tin thời gian bảo hành của từng sản phẩm thuộc thương hiệu Enic (Kể từ ngày nhận hàng):</p>

                                    {/* Render Policy Table */}
                                    {policySection && policySection.items.map((item: any, idx: number) => {
                                        const headers = item.table[0];
                                        const rows = item.table.slice(1);
                                        return <TableRenderer key={idx} headers={headers} rows={rows} />;
                                    })}
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">2. Điều kiện bảo hành</h3>
                                    <p className="mb-2">Sản phẩm thuộc thương hiệu Enic sẽ được bảo hành nếu thỏa mãn các điều kiện sau:</p>
                                    <ul className="list-disc pl-5 space-y-1 mb-4">
                                        <li>Sản phẩm còn trong thời hạn bảo hành.</li>
                                        <li>Thông tin bảo hành trên hệ thống đầy đủ gồm tên khách hàng sử dụng, số điện thoại, địa chỉ, ngày mua, ngày nhận hàng.</li>
                                        <li>Các sản phẩm hư hỏng do chất lượng linh kiện hay lỗi quy trình sản xuất.</li>
                                        <li>Sản phẩm không bị các trường hợp tác động vật lý gây móp méo, bể, vỡ, trầy xước,...</li>
                                        <li>Sản phẩm không nằm trong trường hợp bị từ chối bảo hành.</li>
                                    </ul>
                                    <div className="bg-blue-50 p-4 rounded-md border border-blue-100 text-sm">
                                        <p className="font-medium text-[#21246b] mb-1">Lưu ý quan trọng:</p>
                                        <p>Enic bảo hành trên hệ thống thông qua số điện thoại đặt hàng. Khi Quý khách cần hỗ trợ bảo hành, xin vui lòng cung cấp đúng số điện thoại đã đặt hàng để được hỗ trợ tốt nhất.</p>
                                    </div>
                                </div>
                            </section>

                            {/* Section II */}
                            <section>
                                <h2 className="text-2xl font-bold text-[#21246b] mb-4 border-b pb-2">II. NHỮNG TRƯỜNG HỢP BỊ TỪ CHỐI BẢO HÀNH</h2>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Sản phẩm hư hỏng do việc lắp đặt, sử dụng, bảo dưỡng không đúng cách, không tuân theo nội dung hướng dẫn của Enic.</li>
                                    <li>Sản phẩm hư hỏng do sử dụng hóa chất tẩy rửa có tính chất ăn mòn cao như muối, axit, kiềm.</li>
                                    <li>Sản phẩm hư hỏng liên quan đến tính chất nước không đúng tiêu chuẩn (nước nhiễm phèn, nhiễm mặn).</li>
                                    <li>Sản phẩm hư hỏng do chịu ảnh hưởng bởi thiên tai, cháy nổ.</li>
                                    <li>Sản phẩm hư hỏng liên quan đến các yếu tố khách quan trong quá trình sử dụng như dùng các vật sắc nhọn tác động.</li>
                                    <li>Bộ phận điện tử bị hư hỏng do không lắp đặt theo đúng khuyến cáo về điện áp, tần số...</li>
                                    <li>Sản phẩm đã hết hạn bảo hành.</li>
                                </ul>
                            </section>

                            {/* Section III - Pricing */}
                            <section>
                                <h2 className="text-2xl font-bold text-[#21246b] mb-4 border-b pb-2">III. BẢNG GIÁ CÁC LINH KIỆN SẢN PHẨM ENIC</h2>
                                <p className="mb-6">Khi sản phẩm hết thời gian bảo hành, vấn đề mà khách hàng thường gặp là việc thay thế linh kiện khi chúng gặp sự cố hoặc hư hỏng. Dưới đây là bảng giá linh kiện mà Enic cung cấp để quý khách hàng tiện lợi tham khảo.</p>

                                <div className="space-y-8">
                                    {pricingSections.map((section: any, idx: number) => (
                                        <div key={idx} className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                                            <h3 className="text-lg font-bold text-[#21246b] mb-4 uppercase">{section.title}</h3>

                                            {section.items.map((item: any, itemIdx: number) => {
                                                if (!item.table || item.table.length === 0) return null;
                                                // Handle nested name if differs from title
                                                const showName = item.name && item.name !== section.title;
                                                const headers = item.table[0];
                                                const rows = item.table.slice(1);

                                                return (
                                                    <div key={itemIdx} className="mb-6 last:mb-0">
                                                        {showName && <h4 className="font-semibold text-gray-800 mb-2">{item.name}</h4>}
                                                        <TableRenderer headers={headers} rows={rows} />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
