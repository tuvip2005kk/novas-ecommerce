"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const user = await login(email, password);
            // Redirect admin users to admin panel
            if (user.role === 'ADMIN') {
                router.push("/admin");
            } else {
                router.push("/");
            }
        } catch (err: any) {
            setError(err.message || "Đăng nhập thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header />
            <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4 pt-20">
                <Card className="w-full max-w-md shadow-2xl border-0">
                    <CardHeader className="text-center pb-2">
                        <Link href="/" className="inline-flex items-center text-slate-500 hover:text-blue-600 mb-4 text-sm">
                            <ArrowLeft className="mr-1 h-4 w-4" /> Về trang chủ
                        </Link>
                        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-4">
                            <Lock className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl">Đăng nhập</CardTitle>
                        <p className="text-slate-500 text-sm mt-2">Chào mừng bạn quay trở lại!</p>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="flex h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                        placeholder="email@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Mật khẩu</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="flex h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-12 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                                Đăng nhập
                            </Button>

                            <div className="text-center text-sm text-slate-500">
                                Chưa có tài khoản?{" "}
                                <Link href="/register" className="text-blue-600 hover:underline font-medium">
                                    Đăng ký ngay
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </main>
            <Footer />
        </>
    );
}
