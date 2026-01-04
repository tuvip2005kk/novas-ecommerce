"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, Store, CreditCard, Mail, Globe } from "lucide-react";
import { useState } from "react";

export default function AdminSettings() {
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Cài đặt hệ thống</h1>
                <p className="text-slate-500">Cấu hình cửa hàng và thanh toán</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Store className="h-5 w-5" /> Thông tin cửa hàng</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Tên cửa hàng</label>
                            <input type="text" defaultValue="Luxury Sanitary" className="w-full mt-1 px-4 py-2 border rounded-lg" />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Email liên hệ</label>
                            <input type="email" defaultValue="contact@luxurysanitary.com" className="w-full mt-1 px-4 py-2 border rounded-lg" />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Số điện thoại</label>
                            <input type="tel" defaultValue="0123 456 789" className="w-full mt-1 px-4 py-2 border rounded-lg" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Thanh toán</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Số tài khoản SePay</label>
                            <input type="text" defaultValue="0348868647" className="w-full mt-1 px-4 py-2 border rounded-lg" />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Ngân hàng</label>
                            <select className="w-full mt-1 px-4 py-2 border rounded-lg">
                                <option>MBBank</option>
                                <option>Vietcombank</option>
                                <option>Techcombank</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Tỷ giá USD → VNĐ</label>
                            <input type="number" defaultValue="23000" className="w-full mt-1 px-4 py-2 border rounded-lg" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Button onClick={handleSave} className={`${saved ? 'bg-green-600' : 'bg-[#21246b] hover:bg-[#1a1d55]'}`}>
                {saved ? '✓ Đã lưu!' : <><Save className="h-4 w-4 mr-2" /> Lưu cài đặt</>}
            </Button>
        </div>
    );
}
