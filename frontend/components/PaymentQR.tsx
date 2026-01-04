"use client";
import { API_URL } from '@/config';

import { useEffect, useState, useRef } from "react";
import { CheckCircle2, Copy, Loader2, RefreshCw, CreditCard } from "lucide-react";
import { Button } from "./ui/button";

interface PaymentQRProps {
    orderId: number;
    onPaymentSuccess?: () => void;
}

interface QRPaymentInfo {
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    content: string;
    qrUrl: string;
}

interface SePayCheckoutData {
    checkoutUrl: string;
    formFields: Record<string, string>;
}

export function PaymentQR({ orderId, onPaymentSuccess }: PaymentQRProps) {
    const [paymentInfo, setPaymentInfo] = useState<QRPaymentInfo | null>(null);
    const [checkoutData, setCheckoutData] = useState<SePayCheckoutData | null>(null);
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);
    const [paid, setPaid] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(900);
    const [useSePay, setUseSePay] = useState(true);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        loadPaymentData();
    }, [orderId]);

    // Polling để kiểm tra trạng thái thanh toán
    useEffect(() => {
        if (paid) return;

        const interval = setInterval(async () => {
            setChecking(true);
            try {
                const res = await fetch(`${API_URL}/sepay/status/${orderId}`);
                const data = await res.json();
                if (data.paid) {
                    setPaid(true);
                    onPaymentSuccess?.();
                }
            } catch (e) {
                console.error(e);
            } finally {
                setChecking(false);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [orderId, paid]);

    // Countdown timer
    useEffect(() => {
        if (paid || countdown <= 0) return;

        const timer = setInterval(() => {
            setCountdown(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [paid, countdown]);

    const loadPaymentData = async () => {
        setLoading(true);
        try {
            // Try SePay checkout first
            const checkoutRes = await fetch(`${API_URL}/sepay/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId })
            });

            if (checkoutRes.ok) {
                const data = await checkoutRes.json();
                setCheckoutData(data);
            }

            // Also get QR data as fallback
            const qrRes = await fetch(`${API_URL}/sepay/create-qr`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId })
            });

            if (qrRes.ok) {
                const data = await qrRes.json();
                setPaymentInfo(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopied(field);
        setTimeout(() => setCopied(null), 2000);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (paid) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-800 mb-2">Thanh toán thành công!</h3>
                <p className="text-green-600">Đơn hàng của bạn đã được xác nhận</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 text-center">
                <h3 className="text-lg font-bold">Thanh toán đơn hàng #{orderId}</h3>
                <p className="text-blue-100 text-sm mt-1">
                    Thời gian còn lại: <span className="font-mono font-bold">{formatTime(countdown)}</span>
                </p>
            </div>

            <div className="p-6">
                {/* Payment Method Toggle */}
                <div className="flex gap-2 mb-6">
                    <Button
                        variant={useSePay ? "default" : "outline"}
                        onClick={() => setUseSePay(true)}
                        className="flex-1"
                    >
                        <CreditCard className="h-4 w-4 mr-2" />
                        SePay Gateway
                    </Button>
                    <Button
                        variant={!useSePay ? "default" : "outline"}
                        onClick={() => setUseSePay(false)}
                        className="flex-1"
                    >
                        Quét mã QR
                    </Button>
                </div>

                {useSePay && checkoutData ? (
                    /* SePay Checkout Form */
                    <div className="text-center">
                        <p className="text-slate-600 mb-4">
                            Nhấn nút bên dưới để chuyển đến trang thanh toán SePay
                        </p>
                        <form ref={formRef} action={checkoutData.checkoutUrl} method="POST">
                            {Object.keys(checkoutData.formFields).map(field => (
                                <input
                                    key={field}
                                    type="hidden"
                                    name={field}
                                    value={checkoutData.formFields[field]}
                                />
                            ))}
                            <Button type="submit" className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700">
                                Thanh toán qua SePay
                            </Button>
                        </form>
                        <p className="text-slate-500 text-xs mt-4">
                            Bạn sẽ được chuyển đến trang thanh toán an toàn của SePay
                        </p>
                    </div>
                ) : paymentInfo ? (
                    /* QR Code Payment */
                    <>
                        <div className="flex justify-center mb-6">
                            <div className="bg-white p-2 rounded-lg shadow-lg border-2 border-blue-100">
                                <img
                                    src={paymentInfo.qrUrl}
                                    alt="QR Code thanh toán"
                                    className="w-64 h-64"
                                />
                            </div>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <span className="text-slate-600">Ngân hàng</span>
                                <span className="font-semibold text-slate-900">{paymentInfo.bankName}</span>
                            </div>

                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <span className="text-slate-600">Số tài khoản</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-semibold text-slate-900">{paymentInfo.accountNumber}</span>
                                    <button
                                        onClick={() => copyToClipboard(paymentInfo.accountNumber, 'account')}
                                        className="text-blue-600 hover:text-blue-700"
                                    >
                                        {copied === 'account' ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <span className="text-slate-600">Chủ tài khoản</span>
                                <span className="font-semibold text-slate-900">{paymentInfo.accountName}</span>
                            </div>

                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <span className="text-blue-700 font-medium">Số tiền</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-lg text-blue-700">{formatCurrency(paymentInfo.amount)}</span>
                                    <button
                                        onClick={() => copyToClipboard(paymentInfo.amount.toString(), 'amount')}
                                        className="text-blue-600 hover:text-blue-700"
                                    >
                                        {copied === 'amount' ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                                <span className="text-amber-700 font-medium">Nội dung CK</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-amber-800">{paymentInfo.content}</span>
                                    <button
                                        onClick={() => copyToClipboard(paymentInfo.content, 'content')}
                                        className="text-amber-600 hover:text-amber-700"
                                    >
                                        {copied === 'content' ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700 text-xs text-center">
                                ⚠️ <strong>Quan trọng:</strong> Vui lòng nhập đúng nội dung chuyển khoản <strong>{paymentInfo.content}</strong> để hệ thống tự động xác nhận
                            </p>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-red-600">Không thể tải thông tin thanh toán</p>
                        <Button onClick={loadPaymentData} className="mt-4">
                            <RefreshCw className="h-4 w-4 mr-2" /> Thử lại
                        </Button>
                    </div>
                )}

                {/* Status */}
                <div className="mt-6 text-center">
                    {checking ? (
                        <div className="flex items-center justify-center gap-2 text-blue-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Đang kiểm tra thanh toán...</span>
                        </div>
                    ) : (
                        <p className="text-slate-500 text-sm">
                            Hệ thống tự động xác nhận sau khi bạn thanh toán
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
