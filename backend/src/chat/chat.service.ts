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
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY chưa được cấu hình');
        }

        const productContext = await this.getProductContext();

        const systemPrompt = `Bạn là trợ lý tư vấn bán hàng thông minh của cửa hàng NOVAS - chuyên cung cấp thiết bị vệ sinh, thiết bị nhà bếp và các sản phẩm Smart Home cao cấp.

Nhiệm vụ của bạn:
1. Tư vấn sản phẩm phù hợp với nhu cầu của khách hàng
2. Cung cấp thông tin giá cả, tính năng sản phẩm một cách chính xác
3. Hướng dẫn khách hàng đến đúng trang sản phẩm
4. Trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp
5. Nếu khách hỏi sản phẩm không có trong danh sách, hãy giới thiệu sản phẩm gần nhất
6. Không bịa đặt thông tin - nếu không biết, hãy đề nghị khách liên hệ hotline

DỮ LIỆU SẢN PHẨM HIỆN TẠI CỦA CỬA HÀNG:
${productContext}

Khi đề xuất sản phẩm, hãy đề cập tên sản phẩm và giá. Trả lời ngắn gọn, súc tích (tối đa 150 từ mỗi câu trả lời).`;

        // Chuẩn bị lịch sử hội thoại cho Gemini API
        const contents = [
            // System message dưới dạng tin nhắn đầu tiên của model
            {
                role: 'user',
                parts: [{ text: systemPrompt }]
            },
            {
                role: 'model',
                parts: [{ text: 'Xin chào! Tôi là trợ lý tư vấn của NOVAS. Tôi sẵn sàng giúp bạn tìm kiếm sản phẩm phù hợp. Bạn cần tư vấn gì ạ?' }]
            },
            // Lịch sử hội thoại
            ...history.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.content }]
            })),
            // Tin nhắn hiện tại
            {
                role: 'user',
                parts: [{ text: message }]
            }
        ];

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 512,
                    }
                })
            }
        );

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Gemini API error ${response.status}:`, errorBody);
            throw new Error(`Gemini API error: ${response.status} - ${errorBody}`);
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('Không nhận được phản hồi từ AI');
        }

        return text;
    }
}
