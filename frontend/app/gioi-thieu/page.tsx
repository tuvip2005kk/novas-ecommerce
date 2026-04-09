import Image from "next/image";
import Link from "next/link";
import { Star, MessageSquare, ShoppingCart, Target, Eye, Rocket, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Giới thiệu về Novas - Thiết bị vệ sinh thông minh cao cấp",
  description: "Novas là nhà cung cấp thiết bị phòng tắm thông minh hàng đầu Việt Nam, mang đến trải nghiệm tuyệt vời với công nghệ hiện đại và thiết kế sang trọng.",
};

export default function IntroPage() {
  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      {/* Hero Section */}
      <section className="relative h-[300px] flex items-center justify-center bg-[#21246b] overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-[#21246b] to-transparent z-10" />
          <Image 
            src="/banner-1.png" 
            alt="Novas Hero" 
            fill 
            className="object-cover"
          />
        </div>
        <div className="relative z-20 text-center px-4">
          <h1 id="intro-title" className="text-4xl md:text-5xl font-extrabold text-white mb-4 animate-fadeIn">Giói Thiệu Về NOVAS</h1>
          <div className="flex items-center justify-center gap-2 text-white/80 text-sm uppercase tracking-widest">
            <Link href="/" className="hover:text-yellow-400">Trang chủ</Link>
            <span>/</span>
            <span className="text-yellow-400">Giới thiệu</span>
          </div>
        </div>
      </section>

      {/* Main Content Section: Video & Intro Text */}
      <section className="py-16 md:py-24 px-4 bg-white">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Video Column */}
          <div className="lg:col-span-7 space-y-6" id="intro-video-section">
            <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
              <iframe 
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/VinximiywVs?si=cZkmv9DdI968H4eb" 
                title="NOVAS Video"
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen
              ></iframe>
            </div>
            
            {/* Rating Logic from Example */}
            <div className="flex flex-col gap-2 p-6 bg-slate-50 rounded-2xl border border-slate-100 w-fit">
              <div className="flex gap-1 text-yellow-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <p className="text-sm font-semibold text-slate-600">5/5 - (24 bình chọn) | <span className="text-[#21246b]">Giới thiệu</span></p>
            </div>
          </div>

          {/* Text Column */}
          <div className="lg:col-span-5 space-y-8" id="intro-text-section">
            <div className="inline-block px-4 py-1.5 bg-[#21246b]/10 text-[#21246b] rounded-full text-xs font-bold uppercase tracking-wider">
              Novas Home Intelligence
            </div>
            <h2 className="text-4xl font-bold text-[#21246b] leading-tight">
              NOVAS – <span className="text-yellow-500">THÔNG MINH</span> VÀ HƠN NỮA
            </h2>
            <p className="text-lg text-slate-600 font-medium leading-relaxed">
              <strong className="text-[#21246b]">Novas Việt Nam</strong> là một trong những nhà cung cấp thiết bị phòng tắm thông minh cao cấp tại Việt Nam với các sản phẩm có tính năng nổi bật. Sự ra đời và phát triển của Novas luôn đem đến cho khách hàng những trải nghiệm thú vị và tuyệt vời cùng những sản phẩm có hình thức, mẫu mã đa dạng.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Vậy để duy trì, mở rộng và phát triển Novas có tầm nhìn, sứ mệnh và triết lý kinh doanh như thế nào? Cùng khám phá hành trình kiến tạo không gian sống hiện đại của chúng tôi.
            </p>
            <div className="pt-4">
              <button className="px-8 py-3 bg-[#21246b] text-white rounded-full font-bold hover:bg-yellow-500 transition-all shadow-lg hover:shadow-[#21246b]/20 flex items-center gap-2">
                XEM THÊM <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-[#21246b] uppercase tracking-tighter">Tầm nhìn & Sứ mệnh</h2>
            <div className="w-20 h-1 bg-yellow-500 mx-auto mt-4 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Vision */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-shadow border border-slate-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-[#21246b]/5 rounded-2xl flex items-center justify-center mb-6">
                <Eye className="w-8 h-8 text-[#21246b]" />
              </div>
              <h3 className="text-2xl font-bold text-[#21246b] mb-4">Tầm nhìn</h3>
              <p className="text-slate-600 leading-relaxed">
                Với sự nỗ lực không ngừng và chiến lược đầu tư phát triển bền vững, NOVAS tiếp tục nâng cao năng lực cạnh tranh, mở rộng thị trường để kiến tạo không gian sống thông minh tại Việt Nam.
              </p>
            </div>

            {/* Mission */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-shadow border border-slate-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-yellow-500/5 rounded-2xl flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-[#21246b] mb-4">Sứ mệnh</h3>
              <p className="text-slate-600 leading-relaxed">
                Cam kết mang đến những thiết bị vệ sinh mẫu mã đa dạng, chất lượng cao, ưu việt và thân thiện với môi trường, giữ vững vị thế hàng đầu trong lòng khách hàng.
              </p>
            </div>

            {/* Philosophy */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-shadow border border-slate-100 flex flex-col items-center text-center md:col-span-2 lg:col-span-1">
              <div className="w-16 h-16 bg-green-500/5 rounded-2xl flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-[#21246b] mb-4">Triết lý kinh doanh</h3>
              <p className="text-slate-600 leading-relaxed">
                <strong>"Niềm tin trao đi – Nhận lại sự hài lòng"</strong>. Chúng tôi luôn tận tâm phục vụ với khao khát thay đổi và hoàn thiện không gian phòng tắm của mỗi gia đình.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Middle Banner Image Component - Requested by User */}
      <section className="py-12 bg-white" id="middle-banner">
        <div className="max-w-[1300px] mx-auto px-4">
          <div className="relative w-full aspect-[21/9] rounded-[3rem] overflow-hidden shadow-2xl group">
            <Image 
              src="/Generate_a_promo_202604091937.png" 
              alt="Novas Smart Home" 
              fill 
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-fadeInLeft">
              <h2 className="text-4xl font-extrabold text-[#21246b] leading-tight uppercase tracking-tighter">Ưu điểm sản phẩm</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Nhắc đến NOVAS không thể không nhắc đến những ưu điểm và tính năng độc bản được ứng dụng hoàn hảo vào sản phẩm. Một trong những sản phẩm được ưa chuộng nhất của chúng tôi là <strong className="text-[#21246b]">Công nghệ xả rửa tự động</strong> mang lại trải nghiệm tiện nghi tuyệt đối.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/thiet-bi-ve-sinh" 
                  className="px-10 py-4 bg-[#21246b] text-white rounded-full font-bold hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-3 uppercase text-sm"
                >
                  Thiết bị vệ sinh thông minh <ShoppingCart className="w-5 h-5" />
                </Link>
              </div>
            </div>

            <div className="relative animate-fadeInRight">
              <div className="absolute -inset-4 bg-[#21246b]/5 rounded-[3rem] blur-2xl" />
              <div className="relative bg-slate-100 aspect-square rounded-[3rem] overflow-hidden shadow-xl">
                 <Image 
                  src="/cat-toilet.png" 
                  alt="Product Advantage" 
                  fill 
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
