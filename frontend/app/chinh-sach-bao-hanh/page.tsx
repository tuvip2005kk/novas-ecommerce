"use client";

import { Header } from "@/components/Header";
import Footer from "@/components/Footer";

export default function WarrantyPolicyPage() {
    return (
        <>
            <Header />
            <main className="min-h-screen bg-gray-50 pt-24 pb-12">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="bg-white rounded-lg shadow-sm p-8">
                        <h1 className="text-3xl font-bold text-[#21246b] mb-8 text-center">Chính sách bảo hành, bảo trì của Enic</h1>

                        <div className="prose max-w-none text-gray-700 space-y-8">
                            {/* Section 1 */}
                            <section>
                                <h2 className="text-xl font-bold text-[#21246b] mb-4">I. PHẠM VI BẢO HÀNH</h2>

                                <div className="mb-6">
                                    <h3 className="font-bold text-gray-900 mb-2">1. Thời hạn bảo hành sản phẩm</h3>
                                    <p className="mb-2">Tất cả sản phẩm mang nhãn hiệu Enic sẽ được bảo hành theo quy định sau: Thời hạn bảo hành được xác nhận dựa vào thông tin bảo hành điện tử thông qua phần mềm lưu trữ thông tin khách hàng của công ty hoặc giấy chứng từ xác nhận mua hàng.</p>
                                    <p className="mb-4">Dưới đây là thông tin thời gian bảo hành của từng sản phẩm thuộc thương hiệu Enic (Kể từ ngày nhận hàng):</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border">
                                        <div className="space-y-2">
                                            <p><span className="font-medium">Bộ phận điều khiển cơ:</span> 5 năm</p>
                                            <p><span className="font-medium">Khung treo:</span> 5 năm</p>
                                            <p><span className="font-medium">Điện tử:</span> 4 năm</p>
                                            <p><span className="font-medium">Động cơ:</span> 2 năm</p>
                                        </div>
                                        <div className="space-y-2">
                                            <p><span className="font-medium">Đèn LED:</span> 2 năm</p>
                                            <p><span className="font-medium">Màn hình LED và tua bin:</span> 6 tháng</p>
                                            <p><span className="font-medium">LED:</span> 6 tháng</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold text-gray-900 mb-2">2. Điều kiện bảo hành</h3>
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

                            <hr />

                            {/* Section 2 */}
                            <section>
                                <h2 className="text-xl font-bold text-[#21246b] mb-4">II. NHỮNG TRƯỜNG HỢP BỊ TỪ CHỐI BẢO HÀNH</h2>
                                <p className="mb-3">Dưới đây là một số lưu ý dành cho khách hàng đối với các trường hợp bị từ chối bảo hành:</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Sản phẩm hư hỏng do việc lắp đặt, sử dụng, bảo dưỡng không đúng cách, không tuân theo nội dung hướng dẫn của Enic.</li>
                                    <li>Sản phẩm hư hỏng do sử dụng hóa chất tẩy rửa có tính chất ăn mòn cao như muối, axit, kiềm.</li>
                                    <li>Sản phẩm hư hỏng liên quan đến tính chất nước không đúng tiêu chuẩn (nước nhiễm phèn, nhiễm mặn).</li>
                                    <li>Sản phẩm hư hỏng do chịu ảnh hưởng bởi thiên tai, cháy nổ.</li>
                                    <li>Sản phẩm hư hỏng liên quan đến các yếu tố khách quan trong quá trình sử dụng như dùng các vật sắc nhọn tác động.</li>
                                    <li>Bộ phận điện tử bị hư hỏng do không lắp đặt theo đúng khuyến cáo về điện áp, tần số...</li>
                                    <li>Sản phẩm đã hết hạn bảo hành.</li>
                                </ul>
                                <p className="mt-4 italic text-gray-600">
                                    Để được nhận thông tin cũng như hỗ trợ kịp thời về các vấn đề bảo hành trong quá trình sử dụng sản phẩm thuộc thương hiệu Enic, khách hàng vui lòng liên hệ với số hotline chăm sóc khách hàng để được hỗ trợ nhanh nhất!
                                </p>
                            </section>

                            <hr />

                            {/* Section 3 */}
                            <section>
                                <h2 className="text-xl font-bold text-[#21246b] mb-4">III. CHÍNH SÁCH BẢO HÀNH TẬN NƠI</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-green-50 p-5 rounded-lg border border-green-100">
                                        <h3 className="font-bold text-green-800 mb-2">Trường hợp 1: Bảo hành tận nơi</h3>
                                        <p className="text-sm">Áp dụng bảo hành sản phẩm tận nơi, có kỹ thuật viên hỗ trợ kiểm tra trong phạm vi bán kính 50km tính từ Showroom và đối với các sản phẩm chính như: Bồn cầu; Sen tắm; Tủ phòng tắm; Đèn điều hòa;...</p>
                                    </div>
                                    <div className="bg-orange-50 p-5 rounded-lg border border-orange-100">
                                        <h3 className="font-bold text-orange-800 mb-2">Trường hợp 2: Không bảo hành tận nơi</h3>
                                        <p className="text-sm">Đối với khách hàng nằm ngoài phạm vi bán kính 50km tính từ Showroom và các phụ kiện – linh kiện nhỏ. Enic sẽ hỗ trợ xác định đúng lỗi hư hỏng và linh kiện cần thay. Sau đó gửi miễn phí sản phẩm thay thế cho khách hàng.</p>
                                    </div>
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
