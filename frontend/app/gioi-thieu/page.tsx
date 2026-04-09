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
      <main className="pt-[100px] mb-20">
        <div className="max-w-[1100px] mx-auto px-5">
          
          {/* Section 1: Video and Intro */}
          <div className="flex flex-col md:flex-row gap-10 items-center mb-16">
            <div className="w-full md:w-3/5">
              <div className="relative aspect-video">
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
            <div className="w-full md:w-2/5">
              <h1 className="text-2xl font-bold mb-4">Novas – THÔNG MINH VÀ HƠN NỮA</h1>
              <p className="text-xl leading-relaxed text-justify">
                <strong>Novas Việt Nam</strong> là một trong những nhà cung cấp <strong>thiết bị phòng tắm thông minh</strong> cao cấp tại Việt Nam với các sản phẩm có tính năng nổi bật. Sự ra đời và phát triển của Novas luôn đem đến cho khách hàng những trải nghiệm thú vị và tuyệt vời cùng những sản phẩm có hình thức, mẫu mã đa dạng. Vậy để duy trì, mở rộng và phát triển Novas có tầm nhìn, sứ mệnh và triết lý kinh doanh như thế nào?
              </p>
            </div>
          </div>

          {/* Section 2: Vision & Mission */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-center mb-10">TẦM NHÌN & SỨ MỆNH</h2>
            
            <div className="space-y-10">
              <div>
                <h3 className="text-xl font-bold mb-3">Tầm nhìn</h3>
                <p className="text-xl leading-relaxed text-justify mb-4">
                  Với sự nỗ lực không ngừng và chiến lược đầu tư phát triển bền vững <strong>Novas</strong> sẽ tiếp tục nâng cao năng lực cạnh tranh, mở rộng thị trường để tạo sự tin cậy với đối tác, khách hàng và trở thành 1 đơn vị hàng đầu phân phối các thiết bị vệ sinh tại Việt Nam.
                </p>
                <p className="text-xl leading-relaxed text-justify">
                  Ngoài ra, để đẩy mạnh phát triển sự phân phối các thiết bị nhập khẩu chính hãng chúng tôi sẽ thi công những sản phẩm nội thất cao cấp.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-3">Sứ mệnh</h3>
                <ul className="list-disc pl-6 space-y-4 text-xl leading-relaxed text-justify">
                  <li>
                    Với phương châm <strong>“Uy tín – Chất lượng – An toàn”</strong> Novas Việt Nam cam kết mang đến cho khách hàng những thiết bị vệ sinh có mẫu mã đa dạng, chất lượng cao, có nhiều tính năng ưu việt, thân thiện với môi trường và người sử dụng để luôn giữ vững vị trí của mình trên thị trường phân phối tại Việt Nam.
                  </li>
                  <li>
                    Với cổ đông: <strong>Novas Việt Nam</strong> không chỉ đem lại mức lợi nhuận trong dài hạn mà còn thực hiện tốt các kế hoạch quản lý rủi ro. Từ đó, các cổ đông có thể yên tâm và có niềm tin tuyệt đối với các khoản đầu tư của mình.
                  </li>
                  <li>
                    Với đối tác: <strong>Novas Việt Nam</strong> sẽ tạo ra những giá trị bền vững cho các thành viên trong chuỗi cung ứng bằng cách đảm bảo mức lợi nhuận hợp lý thông qua các sản phẩm, dịch vụ ưu việt. Đồng thời chúng tôi đáp ứng nhu cầu tiêu dùng của khách hàng.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 3: Middle Image */}
          <div className="w-full mb-16">
            <div className="relative w-full aspect-[21/9]">
              <Image 
                src="/Generate_a_promo_202604091937.png" 
                alt="Novas Smart Home" 
                fill 
                className="object-cover"
              />
            </div>
            <p className="text-center text-sm mt-2">toan canh showroom thiet bi ve sinh novas viet nam tru so ha noi</p>
          </div>

          {/* Section 4: Philosophy */}
          <div className="mb-16">
            <h3 className="text-xl font-bold mb-3">Triết lý kinh doanh</h3>
            <p className="text-xl leading-relaxed text-justify">
              Novas luôn đem đến sự tận tâm, nhiệt tình với khách hàng thông qua triết lý kinh doanh <strong>“Niềm tin trao đi – Nhận lại sự hài lòng”</strong>. Với khao khát thay đổi, hoàn thiện bản thân, phục vụ khách hàng tốt nhất có thể Novas sẽ luôn cung cấp các sản phẩm cao cấp có tính năng vượt trội tới khách hàng. Hiện nay, lần lượt các dòng sản phẩm của Novas Việt Nam đã ra đời để minh chứng điều đó.
            </p>
            <p className="text-xl leading-relaxed text-justify mt-4">
              Để phát triển mạng lưới kinh doanh rộng hơn, Novas đang mở rộng thêm địa điểm bán ở thành phố lớn tại Việt Nam. Đồng thời, tiện cung cấp và tiếp cận các đối tượng khách hàng ở nhiều nơi.
            </p>
          </div>

          {/* Section 5: Advantages */}
          <div className="flex flex-col md:flex-row gap-10 items-center">
            <div className="w-full md:w-1/2">
              <h2 className="text-2xl font-bold mb-4">ƯU ĐIỂM SẢN PHẨM</h2>
              <p className="text-xl leading-relaxed text-justify">
                Nhắc đến <strong>Novas Việt Nam</strong> không thể không nhắc đến những ưu điểm và tính năng có một không hai được ứng dụng hoàn hảo vào sản phẩm. Một trong những sản phẩm được ưa chuộng nhất hiện nay của Novas là bồn cầu thông minh với những công nghệ xả rửa hoàn toàn tự động. Tất cả tạo cho khách hàng 1 trải nghiệm tuyệt vời nhất!
              </p>
            </div>
            <div className="w-full md:w-1/2">
              <div className="relative aspect-square max-w-[400px] mx-auto">
                <Image 
                  src="/cat-toilet.png" 
                  alt="Thiết bị vệ sinh Novas" 
                  fill 
                  className="object-contain"
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
