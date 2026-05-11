import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface ChatMessage {
    role: 'user' | 'model' | 'system' | 'staff' | string;
    content: string;
}

type ProductForChat = {
    id: number;
    name: string;
    price: number;
    originalPrice: number | null;
    description: string;
    image: string;
    slug: string;
    stock: number;
    soldCount: number;
    specs: unknown;
    subcategory: {
        name: string;
        category: { name: string } | null;
    } | null;
    _count?: { reviews: number; likes: number };
};

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) {}

    private readonly stopWords = new Set([
        'toi',
        'minh',
        'ban',
        'can',
        'muon',
        'tim',
        'tu',
        'van',
        'san',
        'pham',
        'cho',
        'gia',
        'bao',
        'nhieu',
        'co',
        'khong',
        'nao',
        'loai',
        'hang',
        'novas',
        'mua',
        'xem',
        'xin',
        'chao',
        'hello',
    ]);

    private normalizeText(value: string): string {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .toLowerCase();
    }

    private extractSearchTerms(message: string): string[] {
        const normalized = this.normalizeText(message);
        const terms = normalized
            .split(/[^a-z0-9]+/i)
            .map((term) => term.trim())
            .filter((term) => term.length >= 3 && !this.stopWords.has(term));

        return [...new Set(terms)].slice(0, 6);
    }

    private formatCurrency(value: number | null | undefined): string {
        if (value === null || value === undefined || !Number.isFinite(Number(value))) {
            return 'chưa cập nhật';
        }

        return `${Number(value).toLocaleString('vi-VN')}đ`;
    }

    private shortText(value: string | null | undefined, maxLength = 220): string {
        if (!value) return '';
        const compact = value.replace(/\s+/g, ' ').trim();
        return compact.length > maxLength ? `${compact.slice(0, maxLength - 3)}...` : compact;
    }

    private formatSpecs(specs: unknown): string {
        if (!specs) return '';

        let parsed = specs;
        if (typeof specs === 'string') {
            try {
                parsed = JSON.parse(specs);
            } catch {
                return this.shortText(specs, 120);
            }
        }

        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return '';

        return Object.entries(parsed as Record<string, unknown>)
            .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')
            .slice(0, 6)
            .map(([key, value]) => `${key}: ${String(value)}`)
            .join('; ');
    }

    private formatProduct(product: ProductForChat): string {
        const category = [product.subcategory?.category?.name, product.subcategory?.name]
            .filter(Boolean)
            .join(' > ');
        const salePrice = product.originalPrice
            ? `, giá gốc ${this.formatCurrency(product.originalPrice)}`
            : '';
        const stockStatus = product.stock > 0 ? `còn ${product.stock}` : 'hết hàng';
        const specs = this.formatSpecs(product.specs);
        const ratingSignal = product._count
            ? `, ${product._count.reviews} đánh giá, ${product._count.likes} lượt thích`
            : '';

        return [
            `- ${product.name}`,
            `giá ${this.formatCurrency(product.price)}${salePrice}`,
            `tồn kho ${stockStatus}`,
            category ? `danh mục ${category}` : '',
            product.soldCount ? `đã bán ${product.soldCount}` : '',
            ratingSignal.replace(/^, /, ''),
            specs ? `thông số: ${specs}` : '',
            product.description ? `mô tả: ${this.shortText(product.description)}` : '',
            `link /products/${product.id}`,
            product.image ? `ảnh demo ${product.image}` : '',
        ]
            .filter(Boolean)
            .join(' | ');
    }

    private async getRelevantProducts(message: string): Promise<ProductForChat[]> {
        const terms = this.extractSearchTerms(message);
        const productSelect = {
            id: true,
            name: true,
            price: true,
            originalPrice: true,
            description: true,
            image: true,
            slug: true,
            stock: true,
            soldCount: true,
            specs: true,
            subcategory: {
                select: {
                    name: true,
                    category: { select: { name: true } },
                },
            },
            _count: { select: { reviews: true, likes: true } },
        };

        const topProductsPromise = this.prisma.product.findMany({
            take: 12,
            select: productSelect,
            orderBy: [{ soldCount: 'desc' }, { createdAt: 'desc' }],
        });

        if (!terms.length) {
            return topProductsPromise as Promise<ProductForChat[]>;
        }

        const matchedProductsPromise = this.prisma.product.findMany({
            take: 12,
            where: {
                AND: terms.map((term) => ({
                    OR: [
                        { name: { contains: term } },
                        { description: { contains: term } },
                        { slug: { contains: term } },
                        { subcategory: { name: { contains: term } } },
                        { subcategory: { category: { name: { contains: term } } } },
                    ],
                })),
            },
            select: productSelect,
            orderBy: [{ soldCount: 'desc' }, { createdAt: 'desc' }],
        });

        const [matchedProducts, topProducts] = await Promise.all([
            matchedProductsPromise,
            topProductsPromise,
        ]);

        const bySlug = new Map<string, ProductForChat>();
        [...matchedProducts, ...topProducts].forEach((product) => {
            if (!bySlug.has(product.slug)) bySlug.set(product.slug, product as ProductForChat);
        });

        return [...bySlug.values()].slice(0, 18);
    }

    private async getCatalogContext(): Promise<string> {
        const categories = await this.prisma.category.findMany({
            take: 20,
            select: {
                name: true,
                slug: true,
                description: true,
                subcategories: {
                    select: { name: true, slug: true },
                    orderBy: { name: 'asc' },
                },
            },
            orderBy: { name: 'asc' },
        });

        if (!categories.length) return 'Chưa có danh mục.';

        return categories
            .map((category) => {
                const subcategories = category.subcategories
                    .map((subcategory) => `${subcategory.name} (/ ${subcategory.slug})`.replace('/ ', '/'))
                    .join(', ');
                return `- ${category.name} (/${category.slug})${subcategories ? `: ${subcategories}` : ''}`;
            })
            .join('\n');
    }

    private async getBusinessContext(): Promise<string> {
        const [showrooms, sales, settings] = await Promise.all([
            this.prisma.showroom.findMany({
                where: { isActive: true },
                take: 8,
                select: { name: true, address: true, mapUrl: true },
                orderBy: { sortOrder: 'asc' },
            }),
            this.prisma.sale.findMany({
                where: {
                    isActive: true,
                    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                },
                take: 8,
                select: {
                    code: true,
                    discount: true,
                    type: true,
                    minOrder: true,
                    maxDiscount: true,
                    expiresAt: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.siteSetting.findMany({
                take: 40,
                orderBy: { key: 'asc' },
            }),
        ]);

        const settingKeywords = [
            'phone',
            'hotline',
            'email',
            'address',
            'shipping',
            'delivery',
            'warranty',
            'payment',
            'facebook',
            'zalo',
            'contact',
        ];

        const settingContext = settings
            .filter((setting) =>
                settingKeywords.some((keyword) => this.normalizeText(setting.key).includes(keyword)),
            )
            .slice(0, 16)
            .map((setting) => `- ${setting.key}: ${this.shortText(setting.value, 180)}`)
            .join('\n');

        const showroomContext = showrooms.length
            ? showrooms
                  .map(
                      (showroom) =>
                          `- ${showroom.name}: ${this.shortText(showroom.address, 180)}${
                              showroom.mapUrl ? ` | bản đồ: ${showroom.mapUrl}` : ''
                          }`,
                  )
                  .join('\n')
            : 'Chưa có showroom đang bật.';

        const saleContext = sales.length
            ? sales
                  .map((sale) => {
                      const discount =
                          sale.type === 'AMOUNT'
                              ? this.formatCurrency(sale.discount)
                              : `${sale.discount}%`;
                      const maxDiscount = sale.maxDiscount
                          ? `, giảm tối đa ${this.formatCurrency(sale.maxDiscount)}`
                          : '';
                      const expiresAt = sale.expiresAt
                          ? `, hết hạn ${sale.expiresAt.toLocaleDateString('vi-VN')}`
                          : '';
                      return `- ${sale.code}: giảm ${discount}, đơn tối thiểu ${this.formatCurrency(
                          sale.minOrder,
                      )}${maxDiscount}${expiresAt}`;
                  })
                  .join('\n')
            : 'Hiện chưa có mã khuyến mãi đang bật.';

        return `
THÔNG TIN LIÊN HỆ/CÀI ĐẶT:
${settingContext || 'Chưa có thông tin cài đặt phù hợp.'}

SHOWROOM:
${showroomContext}

KHUYẾN MÃI:
${saleContext}
        `.trim();
    }

    private extractOrderId(message: string): number | null {
        const normalized = this.normalizeText(message);
        const match = normalized.match(/(?:don hang|ma don|order|#)\s*#?(\d{1,10})/i);
        if (!match) return null;

        const id = Number(match[1]);
        return Number.isInteger(id) && id > 0 ? id : null;
    }

    private extractPhone(message: string): string | null {
        const compact = message.replace(/[\s().-]/g, '');
        const match = compact.match(/(?:\+84|84|0)\d{8,10}/);
        if (!match) return null;

        const phone = match[0].replace(/^\+?84/, '0');
        return phone;
    }

    private hasOrderIntent(message: string): boolean {
        const normalized = this.normalizeText(message);
        return (
            normalized.includes('don hang') ||
            normalized.includes('ma don') ||
            normalized.includes('order') ||
            normalized.includes('trang thai')
        );
    }

    private async getOrderContext(message: string): Promise<string> {
        if (!this.hasOrderIntent(message)) return '';

        const orderId = this.extractOrderId(message);
        const phone = this.extractPhone(message);

        if (!orderId) {
            return 'TRA CỨU ĐƠN HÀNG: Nếu khách muốn tra cứu đơn hàng, hãy xin mã đơn hàng và số điện thoại đặt hàng.';
        }

        if (!phone) {
            return `TRA CỨU ĐƠN HÀNG: Khách đã cung cấp mã đơn #${orderId} nhưng chưa có số điện thoại. Hãy yêu cầu khách gửi thêm số điện thoại đặt hàng để xác minh.`;
        }

        const order = await this.prisma.order.findFirst({
            where: {
                id: orderId,
                customerPhone: { contains: phone.slice(-9) },
            },
            select: {
                id: true,
                status: true,
                total: true,
                createdAt: true,
                items: {
                    select: {
                        quantity: true,
                        price: true,
                        product: { select: { name: true, slug: true } },
                    },
                },
            },
        });

        if (!order) {
            return `TRA CỨU ĐƠN HÀNG: Không tìm thấy đơn #${orderId} khớp với số điện thoại khách cung cấp. Hãy xin kiểm tra lại mã đơn hoặc chuyển nhân viên nếu khách cần hỗ trợ.`;
        }

        const items = order.items
            .map(
                (item) =>
                    `${item.quantity} x ${item.product.name} (${this.formatCurrency(item.price)})`,
            )
            .join('; ');

        return `TRA CỨU ĐƠN HÀNG: #${order.id}, trạng thái ${order.status}, tổng ${this.formatCurrency(
            order.total,
        )}, ngày tạo ${order.createdAt.toLocaleDateString('vi-VN')}, sản phẩm: ${items}`;
    }

    async getProductContext(message = ''): Promise<string> {
        try {
            const [products, catalogContext, businessContext, orderContext] = await Promise.all([
                this.getRelevantProducts(message),
                this.getCatalogContext(),
                this.getBusinessContext(),
                this.getOrderContext(message),
            ]);

            const productList = products.length
                ? products.map((product) => this.formatProduct(product)).join('\n')
                : 'Không tìm thấy sản phẩm khớp trực tiếp. Hãy hỏi thêm nhu cầu, ngân sách, kích thước hoặc gợi ý danh mục gần nhất.';

            return `
DANH MỤC:
${catalogContext}

SẢN PHẨM LIÊN QUAN VÀ BÁN CHẠY:
${productList}

${businessContext}

${orderContext}

CHÍNH SÁCH TƯ VẤN MẶC ĐỊNH:
- Khi khách hỏi chọn sản phẩm, hãy hỏi thêm ngân sách, diện tích/kích thước, phong cách, nhu cầu lắp đặt và ưu tiên vệ sinh/tiết kiệm nước nếu còn thiếu thông tin.
- Không bịa giá, tồn kho, bảo hành, địa chỉ hoặc mã khuyến mãi. Nếu dữ liệu chưa có trong context, nói là cần nhân viên kiểm tra lại.
- Khi giới thiệu sản phẩm, ưu tiên sản phẩm còn hàng, có link, nêu lý do phù hợp và gợi ý 2-4 lựa chọn thay vì liệt kê quá dài.
- Với yêu cầu kỹ thuật phức tạp, bảo hành, đổi trả, lắp đặt tại công trình hoặc khi khách bực bội, hãy đề xuất chuyển nhân viên.
            `.trim();
        } catch (error) {
            console.error('Không thể tải dữ liệu chatbot:', error);
            return 'Không thể tải dữ liệu sản phẩm. Hãy xin lỗi khách và đề xuất chuyển nhân viên nếu cần.';
        }
    }

    private extractJsonObject(text: string): string {
        const trimmed = text.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;

        const match = trimmed.match(/\{[\s\S]*\}/);
        return match ? match[0] : trimmed;
    }

    private productCardToken(product: ProductForChat): string {
        const fields = [
            product.name,
            this.formatCurrency(product.price),
            `/products/${product.id}`,
            product.image || '',
        ].map((value) => encodeURIComponent(value));

        return `[[PRODUCT_CARD|${fields.join('|')}]]`;
    }

    private async enrichReplyWithProductCards(reply: string, message: string): Promise<string> {
        if (reply.includes('[[PRODUCT_CARD|')) return reply;

        const products = await this.getRelevantProducts(message);
        if (!products.length) return reply;

        const normalizedReply = this.normalizeText(reply);
        const matched = products
            .filter((product) => {
                const normalizedName = this.normalizeText(product.name);
                return normalizedReply.includes(normalizedName) || normalizedReply.includes(product.slug);
            })
            .slice(0, 3);

        if (!matched.length) return reply;

        return `${reply}\n\n${matched.map((product) => this.productCardToken(product)).join('\n')}`;
    }

    async chat(message: string, history: ChatMessage[]): Promise<string> {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error('GROQ_API_KEY chưa được cấu hình');
        }

        const productContext = await this.getProductContext(message);

        const systemPrompt = `Bạn là trợ lý tư vấn bán hàng của NOVAS, một website bán thiết bị vệ sinh, nhà bếp và sản phẩm Smart Home.

DỮ LIỆU NỘI BỘ HIỆN CÓ:
${productContext}

NHIỆM VỤ:
- Trả lời bằng tiếng Việt tự nhiên, ngắn gọn, đúng trọng tâm và có ích như một nhân viên tư vấn thật.
- Dùng dữ liệu nội bộ ở trên làm nguồn sự thật chính. Không bịa thông tin không có trong dữ liệu.
- Có thể tư vấn chọn sản phẩm, so sánh lựa chọn, hỏi thêm nhu cầu, gợi ý link sản phẩm, nhắc mã giảm giá, showroom, tra cứu đơn hàng khi đủ mã đơn + số điện thoại.
- Nếu khách hỏi chung chung, hãy đưa 2-4 gợi ý và hỏi thêm 1 câu để chốt nhu cầu.
- Nếu khách muốn gặp người thật, khiếu nại, cần xử lý bảo hành/đổi trả/đơn hàng nhạy cảm hoặc dữ liệu không đủ chắc chắn, hãy đặt handoff=true.

QUY TẮC JSON BẮT BUỘC:
Bạn luôn phải trả về JSON hợp lệ, không thêm chữ ngoài JSON:
{
  "reply": "câu trả lời gửi cho khách",
  "handoff": false
}

Quy tắc handoff:
- Chỉ đặt true khi khách yêu cầu rõ muốn gặp nhân viên/người thật/tổng đài, khách bực bội, hoặc cần nhân viên kiểm tra thông tin không có trong dữ liệu.
- Nếu khách chỉ chào hỏi, hỏi sản phẩm, hỏi giá, hỏi khuyến mãi, hỏi showroom hoặc đang được tư vấn bình thường thì để false.
- Khi handoff=true, reply vẫn phải lịch sự và báo sẽ kết nối nhân viên.`;

        const mappedHistory = history
            .filter((msg) => msg.role !== 'system' && msg.content?.trim())
            .slice(-12)
            .map((msg) => {
                if (msg.role === 'model' || msg.role === 'staff') {
                    return { role: 'assistant', content: this.shortText(msg.content, 1000) };
                }

                return { role: 'user', content: this.shortText(msg.content, 1000) };
            });

        const messages = [
            { role: 'system', content: systemPrompt },
            ...mappedHistory,
            { role: 'user', content: message },
        ];

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
                messages,
                temperature: 0.25,
                response_format: { type: 'json_object' },
            }),
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
            const parsed = JSON.parse(this.extractJsonObject(text));
            let finalReply = parsed.reply || 'Xin lỗi, tôi chưa hiểu ý bạn. Bạn có thể nói rõ hơn không?';

            if (parsed.handoff === true || parsed.handoff === 'true') {
                finalReply += ' [ACTION:HANDOFF]';
            }

            return this.enrichReplyWithProductCards(finalReply, message);
        } catch (error) {
            console.error('Lỗi parse JSON từ Groq:', text);
            return 'Xin lỗi, tôi đang xử lý chưa ổn. Bạn có thể hỏi lại ngắn gọn hơn hoặc yêu cầu gặp nhân viên tư vấn.';
        }
    }
}
