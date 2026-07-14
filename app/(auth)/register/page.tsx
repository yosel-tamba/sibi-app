"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const router = useRouter();

    const flaskUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        script.onload = () => {
            // @ts-ignore
            google.accounts.id.initialize({
                client_id: "563359945454-im6135gmgqa93pi0225t1amtr7bnstf4.apps.googleusercontent.com",
                callback: handleGoogleRegister,
            });

            // @ts-ignore
            google.accounts.id.renderButton(
                document.getElementById("googleBtn"),
                { theme: "outline", size: "large", width: "100%" }
            );
        };
    }, []);

    const handleGoogleRegister = async (response: any) => {
        try {
            const res = await fetch(`${flaskUrl}/register-google`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "ngrok-skip-browser-warning": "any-value"
                },
                body: JSON.stringify({ token: response.credential }),
            });

            const data = await res.json();
            if (res.ok) {
                await Swal.fire({
                    title: "Registrasi Berhasil!",
                    text: "Akun Google Anda telah terdaftar dan langsung aktif.",
                    icon: "success",
                    confirmButtonText: "Ke Halaman Login",
                    confirmButtonColor: "#10b981",
                });
                router.push("/login");
            } else {
                Swal.fire({
                    title: "Registrasi Gagal",
                    text: data.message || "Gagal mendaftar dengan Google.",
                    icon: "error",
                    confirmButtonColor: "#10b981",
                });
            }
        } catch (error) {
            Swal.fire({
                title: "Koneksi Bermasalah",
                text: "Tidak dapat terhubung ke server backend.",
                icon: "error",
                confirmButtonColor: "#10b981",
            });
        }
    };

    const handleManualRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            Swal.fire({
                title: "Password Tidak Cocok",
                text: "Pastikan input konfirmasi password sama dengan password Anda.",
                icon: "warning",
                confirmButtonColor: "#10b981",
            });
            return;
        }

        try {
            const response = await fetch(`${flaskUrl}/register`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "ngrok-skip-browser-warning": "any-value"
                },
                body: JSON.stringify({ username: name, password: password }),
            });

            const data = await response.json();
            if (response.ok) {
                await Swal.fire({
                    title: "Registrasi Berhasil!",
                    text: data.message || "Akun Anda telah dibuat. Silakan langsung login.",
                    icon: "success",
                    confirmButtonText: "Ke Halaman Login",
                    confirmButtonColor: "#10b981",
                });
                router.push("/login");
            } else {
                Swal.fire({
                    title: "Registrasi Gagal",
                    text: data.message || "Gagal melakukan registrasi manual.",
                    icon: "error",
                    confirmButtonColor: "#10b981",
                });
            }
        } catch (error) {
            Swal.fire({
                title: "Koneksi Bermasalah",
                text: "Tidak dapat terhubung ke server backend.",
                icon: "error",
                confirmButtonColor: "#10b981",
            });
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/20 to-emerald-50/40 flex items-center justify-center px-6 py-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 -z-10 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 left-10 -z-10 w-96 h-96 bg-green-300/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-emerald-100 p-8 relative z-10">
                <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-emerald-800 to-emerald-950 bg-clip-text text-transparent">
                    Create Account
                </h1>
                <p className="text-center text-slate-600 mt-2 text-sm">Mulai belajar bahasa isyarat</p>

                <div className="mt-6">
                    <div id="googleBtn"></div>
                </div>

                <div className="relative flex py-5 items-center">
                    <div className="flex-grow border-t border-slate-100"></div>
                    <span className="flex-shrink mx-4 text-slate-400 text-xs tracking-wide">atau daftar manual</span>
                    <div className="flex-grow border-t border-slate-100"></div>
                </div>

                <form onSubmit={handleManualRegister} className="space-y-4">
                    <div>
                        <label className="block mb-1 text-sm font-medium text-emerald-900">Username</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Username anda"
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-emerald-900">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Minimal 8 karakter"
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-emerald-900">Konfirmasi Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Ulangi password anda"
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
                            required
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-emerald-800 to-emerald-900 text-white py-3 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition duration-200 font-medium shadow-md shadow-emerald-900/10 tracking-wide cursor-pointer"
                    >
                        Register Manual
                    </button>
                </form>

                <p className="text-center mt-6 text-sm text-slate-600">
                    Sudah punya akun?{" "}
                    <Link href="/login" className="text-emerald-600 font-semibold hover:text-emerald-700 hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </main>
    );
}