import { useState, useEffect } from 'react';
import { X, Plus, Minus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API_URL } from '@/config';

interface Product {
    id: number;
    name: string;
    price: number;
    salePrice: number | null;
    images: string;
    stock: number;
}

interface CartItem extends Product {
    quantity: number;
}

interface CreateOrderProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateOrder({ onClose, onSuccess }: CreateOrderProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customer, setCustomer] = useState({
        name: '',
        phone: '',
        address: '',
        note: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${API_URL}/api/products`);
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch products', error);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const updateQuantity = (id: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }));
    };

    const removeItem = (id: number) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const total = cart.reduce((sum, item) => {
        const price = item.salePrice || item.price;
        return sum + price * item.quantity;
    }, 0);

    const handleSubmit = async () => {
        if (cart.length === 0) return alert('Vui lòng chọn sản phẩm');

        setSubmitting(true);
        try {
            const orderData = {
                customerName: customer.name,
                customerPhone: customer.phone,
                customerAddress: customer.address,
                note: customer.note,
                items: cart.map(item => ({
                    productId: item.id,
                    quantity: item.quantity
                }))
            };

            const res = await fetch(`${API_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                alert('Có lỗi xảy ra khi tạo đơn hàng');
            }
        } catch (error) {
            console.error('Create order error', error);
            alert('Có lỗi xảy ra');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white w-full h-full flex flex-col border">
            <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-normal">Tạo đơn hàng mới</h2>
                <button onClick={onClose} className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 text-slate-600">
                    Đóng
                </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Left: Product Selection */}
                <div className="flex-1 p-4 border-r overflow-y-auto">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm sản phẩm..."
                            className="w-full pl-9 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className="text-center py-10">Đang tải...</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {filteredProducts.map(product => (
                                <div
                                    key={product.id}
                                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                                    onClick={() => addToCart(product)}
                                >
                                    <div className="h-12 w-12 bg-slate-100 rounded overflow-hidden flex-shrink-0">
                                        {product.images && (
                                            <img
                                                src={(() => {
                                                    try {
                                                        const parsed = JSON.parse(product.images);
                                                        return Array.isArray(parsed) ? parsed[0] : '/placeholder.png';
                                                    } catch (e) {
                                                        return '/placeholder.png';
                                                    }
                                                })()}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{product.name}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-red-500 font-bold text-sm">
                                                ${(product.salePrice || product.price).toLocaleString()}
                                            </span>
                                            {product.salePrice && (
                                                <span className="text-slate-400 text-xs line-through">
                                                    ${product.price.toLocaleString()}
                                                </span>
                                            )}
                                            <span className="text-xs text-slate-500 ml-auto">Kho: {product.stock}</span>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 w-8 p-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addToCart(product);
                                        }}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Cart & Customer Info */}
                <div className="w-full md:w-[400px] p-4 bg-slate-50 flex flex-col overflow-y-auto">
                    <div className="mb-6">
                        <h3 className="font-semibold mb-3">Thông tin khách hàng</h3>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Tên khách hàng"
                                className="w-full px-3 py-2 border rounded text-sm"
                                value={customer.name}
                                onChange={e => setCustomer({ ...customer, name: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Số điện thoại"
                                className="w-full px-3 py-2 border rounded text-sm"
                                value={customer.phone}
                                onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Địa chỉ giao hàng"
                                className="w-full px-3 py-2 border rounded text-sm"
                                value={customer.address}
                                onChange={e => setCustomer({ ...customer, address: e.target.value })}
                            />
                            <textarea
                                placeholder="Ghi chú"
                                className="w-full px-3 py-2 border rounded text-sm"
                                rows={2}
                                value={customer.note}
                                onChange={e => setCustomer({ ...customer, note: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex-1">
                        <h3 className="font-semibold mb-3">Đơn hàng ({cart.length})</h3>
                        {cart.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4">Chưa có sản phẩm</p>
                        ) : (
                            <div className="space-y-3 mb-4">
                                {cart.map(item => (
                                    <div key={item.id} className="bg-white p-3 rounded border">
                                        <div className="flex justify-between mb-2">
                                            <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                                            <button onClick={() => removeItem(item.id)} className="text-slate-400 hover:text-red-500">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-bold text-slate-700">
                                                ${((item.salePrice || item.price) * item.quantity).toLocaleString()}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                    className="p-1 hover:bg-slate-100 rounded"
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                <span className="text-sm w-4 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                    className="p-1 hover:bg-slate-100 rounded"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-auto pt-4 border-t">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-semibold">Tổng cộng:</span>
                            <span className="text-xl font-bold text-[#21246b]">${total.toLocaleString()}</span>
                        </div>
                        <Button
                            className="w-full bg-[#21246b] hover:bg-[#1a1d55]"
                            onClick={handleSubmit}
                            disabled={submitting || cart.length === 0}
                        >
                            {submitting ? 'Đang tạo...' : 'Tạo đơn hàng'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
