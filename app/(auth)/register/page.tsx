"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2"; // Import SweetAlert2

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState(""); // State baru untuk konfirmasi password
    const router = useRouter();

    // Load script Google Identity Services otomatis saat halaman dibuka
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

    // Handler jika user mendaftar menggunakan tombol Google
    const handleGoogleRegister = async (response: any) => {
        try {
            const res = await fetch("http://localhost:5000/register-google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: response.credential }),
            });

            const data = await res.json();
            if (res.ok) {
                await Swal.fire({
                    title: "Registrasi Berhasil!",
                    text: "Akun Google Anda telah terdaftar dan langsung aktif.",
                    icon: "success",
                    confirmButtonText: "Ke Halaman Login",
                    confirmButtonColor: "#2563eb",
                });
                router.push("/login");
            } else {
                Swal.fire({
                    title: "Registrasi Gagal",
                    text: data.message || "Gagal mendaftar dengan Google.",
                    icon: "error",
                    confirmButtonColor: "#ef4444",
                });
            }
        } catch (error) {
            Swal.fire({
                title: "Koneksi Bermasalah",
                text: "Tidak dapat terhubung ke server backend.",
                icon: "error",
                confirmButtonColor: "#ef4444",
            });
        }
    };

    // Handler untuk registrasi manual (Hanya Username + Password)
    const handleManualRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        // VALIDASI FRONTEND: Cek apakah password dan konfirmasi password cocok
        if (password !== confirmPassword) {
            Swal.fire({
                title: "Password Tidak Cocok",
                text: "Pastikan input konfirmasi password sama dengan password Anda.",
                icon: "warning",
                confirmButtonColor: "#2563eb",
            });
            return; // Hentikan fungsi agar tidak melakukan fetch ke backend
        }

        try {
            const response = await fetch("http://localhost:5000/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: name, password: password }),
            });

            const data = await response.json();
            if (response.ok) {
                await Swal.fire({
                    title: "Registrasi Berhasil!",
                    text: data.message || "Akun Anda telah dibuat. Silakan langsung login.",
                    icon: "success",
                    confirmButtonText: "Ke Halaman Login",
                    confirmButtonColor: "#2563eb",
                });
                router.push("/login");
            } else {
                Swal.fire({
                    title: "Registrasi Gagal",
                    text: data.message || "Gagal melakukan registrasi manual.",
                    icon: "error",
                    confirmButtonColor: "#ef4444",
                });
            }
        } catch (error) {
            Swal.fire({
                title: "Koneksi Bermasalah",
                text: "Tidak dapat terhubung ke server backend.",
                icon: "error",
                confirmButtonColor: "#ef4444",
            });
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                <h1 className="text-3xl font-bold text-center text-slate-900">Create Account</h1>
                <p className="text-center text-slate-600 mt-2">Mulai belajar bahasa isyarat</p>

                {/* TOMBOL DAFTAR LEWAT GOOGLE */}
                <div className="mt-6">
                    <div id="googleBtn"></div>
                </div>

                {/* PEMBATAL / GARIS PEMISAH */}
                <div className="relative flex py-5 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-4 text-slate-400 text-sm">atau daftar manual</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                </div>

                {/* FORM UNTUK DAFTAR MANUAL */}
                <form onSubmit={handleManualRegister} className="space-y-4">
                    <div>
                        <label className="block mb-1 text-sm font-medium text-slate-700">Username</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Username anda"
                            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-slate-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Minimal 8 karakter"
                            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    {/* INPUT BARU: KONFIRMASI PASSWORD */}
                    <div>
                        <label className="block mb-1 text-sm font-medium text-slate-700">Konfirmasi Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Ulangi password anda"
                            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition font-medium">
                        Register Manual
                    </button>
                </form>

                <p className="text-center mt-6 text-slate-600">
                    Sudah punya akun?{" "}
                    <Link href="/login" className="text-blue-600 font-semibold hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </main>
    );
}