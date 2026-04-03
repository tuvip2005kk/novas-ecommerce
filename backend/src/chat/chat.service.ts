import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface ChatMessage {
    role: 'user' | 'model' | 'system' | 'staff' | string;
    content: string;
}

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) {}

    async getProductContext(): Promise<string> {
        try {
            const products = await this.prisma.product.findMany({
                take: 50,
                select: {
                    name: true,
                    price: true,
                    description: true,
                    slug: true,
                    subcategory: {
                        select: {
                            name: true,
                            category: { select: { name: true } }
                        }
                    }
                },
                orderBy: { soldCount: 'desc' }
            });

            const categories = await this.prisma.category.findMany({
                select: { name: true }
            });

            const productList = products.map(p =>
                `- ${p.name} | Giá: ${p.price.toLocaleString('vi-VN')}đ | Danh mục: ${p.subcategory?.category?.name || ''} > ${p.subcategory?.name || ''} | Link: /products/${p.slug}`
            ).join('\n');

            const categoryList = categories.map(c => c.name).join(', ');

            return `
DANH MỤC SẢN PHẨM: ${categoryList}

SẢN PHẨM NỔI BẬT (50 sản phẩm bán chạy nhất):
${productList}
            `.trim();
        } catch (error) {
            return 'Không thể tải dữ liệu sản phẩm.';
        }
    }

    async chat(message: string, history: ChatMessage[]): Promise<string> {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error('GROQ_API_KEY chưa được cấu hình');
        }

        const productContext = await this.getProductContext();

        const systemPrompt = `Bạn là trợ lý tư vấn bán hàng của NOVAS.
DỮ LIỆU SẢN PHẨM HIỆN TẠI:
${productContext}

QUY TẮC BẮT BUỘC VỀ PHẢN HỒI:
Bạn BẮT BUỘC PHẢI LUÔN LUÔN PHẢN HỒI BẰNG JSON hợp lệ với cấu trúc chính xác như sau:
{
  "reply": "câu trả lời của bạn gửi cho khách",
  "handoff": false
}

Lưu ý quan trọng cho thuộc tính "handoff":
- Chỉ đặt giá trị là "true" NẾU VÀ CHỈ NẾU khách hàng có ý định hoặc yêu cầu rất RÕ RÀNG muốn nói chuyện với nhân viên thực (như "tôi muốn gặp nhân viên", "gọi người thật", "gọi tổng đài").
- VỚI YÊU CẦU GẶP NHÂN VIÊN: Bạn KHÔNG BAO GIỜ ĐƯỢC TỪ CHỐI (không được nói "tôi không thể chuyển"); bạn CHỈ CẦN báo "handoff": true và "reply" là một thông báo lịch sự ("Tôi sẽ kết nối bạn với nhân viên...").
- Tuyệt đối đặt "false" nếu khách chỉ chào hỏi ("hi", "chào", "hello"), nhắn ký tự (".", "vâng", "ok", "sao"), hoặc đang được bạn trực tiếp tư vấn thông thường.`;

        // Chuẩn bị messages theo format OpenAI (Groq tương thích)
        const mappedHistory = history
            .filter(msg => msg.role !== 'system') // Xóa tin nhắn hệ thống để AI không bị nhiễu
            .map(msg => {
                // Coi tin nhắn của staff như là của đại diện cửa hàng (assistant)
                if (msg.role === 'model' || msg.role === 'staff') {
                    return { role: 'assistant', content: msg.content };
                }
                return { role: 'user', content: msg.content };
            });

        const messages = [
            { role: 'system', content: systemPrompt },
            ...mappedHistory,
            { role: 'user', content: message }
        ];

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages,
                temperature: 0.2, // Giảm temperature để AI suy luận nghiêm ngặt hơn
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Groq API error ${response.status}:`, errorBody);
            throw new Error(`Groq API error: ${response.status} - ${errorBody}`);
        }

        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content;

        if (!text) {
            throw new Error('Không nhận được phản hồi từ AI');
        }

        try {
            const parsed = JSON.parse(text);
            let finalReply = parsed.reply || "Xin lỗi, tôi không hiểu ý bạn.";
            if (parsed.handoff === true || parsed.handoff === "true") {
                finalReply += " [ACTION:HANDOFF]";
            }
            return finalReply;
        } catch (e) {
            // Fallback nếu AI trả về không phải JSON (rất hiếm khi xảy ra vì đã set json_object)
            console.error('Lỗi parse JSON từ Groq:', text);
            return text;
        }
    }
}
