import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface ChatMessage {
    role: 'user' | 'model';
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

        const systemPrompt = `Bạn là trợ lý tư vấn bán hàng thông minh của cửa hàng NOVAS - chuyên cung cấp thiết bị vệ sinh, thiết bị nhà bếp và các sản phẩm Smart Home cao cấp.

Nhiệm vụ của bạn:
1. Tư vấn sản phẩm phù hợp với nhu cầu của khách hàng
2. Cung cấp thông tin giá cả, tính năng sản phẩm một cách chính xác
3. Hướng dẫn khách hàng đến đúng trang sản phẩm
4. Trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp
5. Nếu khách hỏi sản phẩm không có trong danh sách, hãy giới thiệu sản phẩm gần nhất
6. ĐẶC BIỆT QUAN TRỌNG: Nếu khách hàng CÓ LỜI YÊU CẦU RÕ RÀNG muốn gặp nhân viên thực, nhân viên tư vấn, tư vấn viên, hoặc phàn nàn muốn gặp người thật, BẠN MỚI ĐƯỢC PHÉP THÊM CHUỖI "[ACTION:HANDOFF]" vào cuối câu. 
Tuyệt đối KHÔNG tự ý dùng [ACTION:HANDOFF] nếu khách hàng chỉ nói lời chào (ví dụ "hi", "xin chào") hoặc chỉ gửi ký tự trống rỗng (ví dụ ".", "?"). Chỉ dùng khi có yêu cầu chuyển máy rõ ràng.
7. Không bịa đặt thông tin - nếu không biết, hãy nói sẽ nhờ nhân viên gọi lại và dùng [ACTION:HANDOFF]

DỮ LIỆU SẢN PHẨM HIỆN TẠI CỦA CỬA HÀNG:
${productContext}

Khi đề xuất sản phẩm, hãy đề cập tên sản phẩm và giá. Trả lời ngắn gọn, súc tích (tối đa 150 từ mỗi câu trả lời).`;

        // Chuẩn bị messages theo format OpenAI (Groq tương thích)
        const messages = [
            { role: 'system', content: systemPrompt },
            // Lịch sử hội thoại
            ...history.map(msg => ({
                role: msg.role === 'model' ? 'assistant' : 'user',
                content: msg.content
            })),
            // Tin nhắn hiện tại
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
                temperature: 0.7,
                max_tokens: 512,
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

        return text;
    }
}
