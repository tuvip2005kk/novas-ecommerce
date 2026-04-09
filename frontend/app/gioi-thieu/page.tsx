import Image from "next/image";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Giới thiệu - Novas Việt Nam",
  description: "Tìm hiểu về tầm nhìn, sứ mệnh và triết lý kinh doanh của Novas Việt Nam.",
};

export default function GioiThieuPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 pt-[100px] pb-24">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
          
          {/* Hàng 1: Video và Giới thiệu */}
          <div className="flex flex-col lg:flex-row gap-12 items-center mb-24" id="section-intro">
            <div className="w-full lg:w-7/12">
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl border-4 border-white">
                <iframe 
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/VinximiywVs?si=cZkmv9DdI968H4eb" 
                  title="Novas Video"
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowFullScreen
                ></iframe>
              </div>
            </div>
            <div className="w-full lg:w-5/12 space-y-6">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#21246b] leading-tight">
                NOVAS – <span className="text-yellow-600">THÔNG MINH</span> VÀ HƠN NỮA
              </h2>
              <p className="text-lg text-slate-700 leading-relaxed text-justify">
                <strong className="text-[#21246b]">Novas Việt Nam</strong> là một trong những nhà cung cấp <strong>thiết bị phòng tắm thông minh</strong> cao cấp tại Việt Nam với các sản phẩm có tính năng nổi bật. Sự ra đời và phát triển của Novas luôn đem đến cho khách hàng những trải nghiệm thú vị và tuyệt vời cùng những sản phẩm có hình thức, mẫu mã đa dạng.
              </p>
              <p className="text-lg text-slate-700 leading-relaxed text-justify">
                Vậy để duy trì, mở rộng và phát triển Novas có tầm nhìn, sứ mệnh và triết lý kinh doanh như thế nào?
              </p>
            </div>
          </div>

          {/* Phần 2: Tầm nhìn & Sứ mệnh */}
          <div className="mb-24 space-y-12" id="section-vision">
            <h2 className="text-4xl font-extrabold text-center text-[#21246b] uppercase tracking-tight">TẦM NHÌN & SỨ MỆNH</h2>
            
            <div className="space-y-10 max-w-[1000px] mx-auto bg-white p-10 md:p-16 rounded-[2rem] shadow-sm border border-slate-100">
              <section>
                <h3 className="text-2xl font-bold text-[#21246b] mb-4 border-l-4 border-yellow-500 pl-4 uppercase">Tầm nhìn</h3>
                <div className="space-y-4">
                  <p className="text-lg text-slate-700 leading-relaxed text-justify">
                    Với sự nỗ lực không ngừng và chiến lược đầu tư phát triển bền vững <strong>Novas</strong> sẽ tiếp tục nâng cao năng lực cạnh tranh, mở rộng thị trường để tạo sự tin cậy với đối tác, khách hàng và trở thành 1 đơn vị hàng đầu phân phối các thiết bị vệ sinh tại Việt Nam.
                  </p>
                  <p className="text-lg text-slate-700 leading-relaxed text-justify">
                    Ngoài ra, để đẩy mạnh phát triển sự phân phối các thiết bị nhập khẩu chính hãng chúng tôi sẽ thi công những sản phẩm nội thất cao cấp.
                  </p>
                </div>
              </section>

              <div className="h-px bg-slate-100 w-full my-8" />

              <section>
                <h3 className="text-2xl font-bold text-[#21246b] mb-6 border-l-4 border-yellow-500 pl-4 uppercase">Sứ mệnh</h3>
                <ul className="space-y-6 text-lg text-slate-700">
                  <li className="flex gap-3">
                    <span className="shrink-0 w-2 h-2 mt-2.5 bg-yellow-500 rounded-full" />
                    <p className="text-justify leading-relaxed">
                      Với phương châm <strong>“Uy tín – Chất lượng – An toàn”</strong> Novas Việt Nam cam kết mang đến cho khách hàng những thiết bị vệ sinh có mẫu mã đa dạng, chất lượng cao, có nhiều tính năng ưu việt, thân thiện với môi trường và người sử dụng để luôn giữ vững vị trí của mình trên thị trường phân phối tại Việt Nam.
                    </p>
                  </li>
                  <li className="flex gap-3">
                    <span className="shrink-0 w-2 h-2 mt-2.5 bg-yellow-500 rounded-full" />
                    <p className="text-justify leading-relaxed">
                      Với cổ đông: <strong>Novas Việt Nam</strong> không chỉ đem lại mức lợi nhuận trong dài hạn mà còn thực hiện tốt các kế hoạch quản lý rủi ro. Từ đó, các cổ đông có thể yên tâm và có niềm tin tuyệt đối với các khoản đầu tư của mình.
                    </p>
                  </li>
                  <li className="flex gap-3">
                    <span className="shrink-0 w-2 h-2 mt-2.5 bg-yellow-500 rounded-full" />
                    <p className="text-justify leading-relaxed">
                      Với đối tác: <strong>Novas Việt Nam</strong> sẽ tạo ra những giá trị bền vững cho các thành viên trong chuỗi cung ứng bằng cách đảm bảo mức lợi nhuận hợp lý thông qua các sản phẩm, dịch vụ ưu việt. Đồng thời chúng tôi đáp ứng nhu cầu tiêu dùng của khách hàng.
                    </p>
                  </li>
                </ul>
              </section>
            </div>
          </div>

          {/* Ảnh ở giữa - Generate_a_promo_202604091937.png */}
          <div className="w-full mb-24 overflow-hidden rounded-[2rem] shadow-xl border-4 border-white" id="middle-banner">
            <div className="relative w-full aspect-[21/9]">
              <Image 
                src="/Generate_a_promo_202604091937.png" 
                alt="Novas Smart Home" 
                fill 
                className="object-cover"
              />
            </div>
          </div>

          {/* Triết lý kinh doanh */}
          <div className="mb-24 max-w-[1000px] mx-auto bg-white p-10 md:p-16 rounded-[2rem] shadow-sm border border-slate-100 space-y-6" id="section-philosophy">
            <h3 className="text-2xl font-bold text-[#21246b] mb-4 border-l-4 border-yellow-500 pl-4 uppercase">Triết lý kinh doanh</h3>
            <p className="text-lg text-slate-700 leading-relaxed text-justify">
              Novas luôn đem đến sự tận tâm, nhiệt tình với khách hàng thông qua triết lý kinh doanh <strong>“Niềm tin trao đi – Nhận lại sự hài lòng”</strong>. Với khao khát thay đổi, hoàn thiện bản thân, phục vụ khách hàng tốt nhất có thể Novas sẽ luôn cung cấp các sản phẩm cao cấp có tính năng vượt trội tới khách hàng. Hiện nay, lần lượt các dòng sản phẩm của Novas Việt Nam đã ra đời để minh chứng điều đó.
            </p>
            <p className="text-lg text-slate-700 leading-relaxed text-justify">
              Để phát triển mạng lưới kinh doanh rộng hơn, Novas đang mở rộng thêm địa điểm bán ở thành phố lớn tại Việt Nam. Đồng thời, tiện cung cấp và tiếp cận các đối tượng khách hàng ở nhiều nơi.
            </p>
          </div>

          {/* Hàng cuối: Ưu điểm sản phẩm */}
          <div className="flex flex-col lg:flex-row gap-16 items-center" id="section-advantages">
            <div className="w-full lg:w-1/2 space-y-6">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#21246b] leading-tight uppercase tracking-tight">ƯU ĐIỂM SẢN PHẨM</h2>
              <p className="text-lg text-slate-700 leading-relaxed text-justify">
                Nhắc đến <strong>Novas Việt Nam</strong> không thể không nhắc đến những ưu điểm và tính năng có một không hai được ứng dụng hoàn hảo vào sản phẩm. Một trong những sản phẩm được ưa chuộng nhất hiện nay của Novas là bồn cầu thông minh với những công nghệ xả rửa hoàn toàn tự động. Tất cả tạo cho khách hàng 1 trải nghiệm tuyệt vời nhất!
              </p>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="relative aspect-square max-w-[500px] mx-auto bg-white rounded-3xl p-8 shadow-inner border border-slate-100">
                <Image 
                  src="/cat-toilet.png" 
                  alt="Thiết bị vệ sinh Novas" 
                  fill 
                  className="object-contain p-8"
                />
              </div>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
