"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import AuthCard from "@/components/auth/AuthCard";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const flaskUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const handleGoogleRegister = async (response: any) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${flaskUrl}/register-google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "any-value",
        },
        body: JSON.stringify({ token: response.credential }),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        // Otomatis Simpan Session User
        const userSession = {
          id: data.user.id || null,
          username: data.user.username || "Google User",
          email: data.user.email || "",
        };
        localStorage.setItem("user", JSON.stringify(userSession));

        await Swal.fire({
          title: data.is_existing ? "Selamat Datang Kembali!" : "Registrasi Berhasil!",
          text: `Selamat datang, ${userSession.username}!`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });

        // Langsung Masuk ke App
        router.push("/");
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualRegister = async (name: string, password: string, confirmPassword: string) => {
    if (!name.trim() || !password) {
      Swal.fire({
        title: "Input Tidak Lengkap",
        text: "Semua kolom wajib diisi.",
        icon: "warning",
        confirmButtonColor: "#10b981",
      });
      return;
    }

    if (password.length < 6) {
      Swal.fire({
        title: "Password Terlalu Pendek",
        text: "Password minimal terdiri dari 6 karakter.",
        icon: "warning",
        confirmButtonColor: "#10b981",
      });
      return;
    }

    if (password !== confirmPassword) {
      Swal.fire({
        title: "Password Tidak Cocok",
        text: "Pastikan input konfirmasi password sama dengan password Anda.",
        icon: "warning",
        confirmButtonColor: "#10b981",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${flaskUrl}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "any-value",
        },
        body: JSON.stringify({ username: name, password }),
      });

      const data = await response.json();
      if (response.ok && data.user) {
        // Otomatis Simpan Session User
        const userSession = {
          id: data.user.id || null,
          username: data.user.username || name,
          email: data.user.email || "",
        };
        localStorage.setItem("user", JSON.stringify(userSession));

        await Swal.fire({
          title: data.is_existing ? "Selamat Datang Kembali!" : "Registrasi Berhasil!",
          text: `Selamat datang, ${userSession.username}!`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });

        // Langsung Masuk ke App
        router.push("/");
      } else {
        Swal.fire({
          title: "Registrasi Gagal",
          text: data.error ? `${data.message}: ${data.error}` : (data.message || "Gagal melakukan registrasi manual."),
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create Account"
      subtitle="Mulai belajar bahasa isyarat"
      footerText="Sudah punya akun?"
      footerLinkText="Login"
      footerLinkHref="/login"
    >
      <GoogleLoginButton onSuccess={handleGoogleRegister} />

      <div className="relative flex py-5 items-center">
        <div className="flex-grow border-t border-slate-100"></div>
        <span className="flex-shrink mx-4 text-slate-400 text-xs tracking-wide">
          atau daftar manual
        </span>
        <div className="flex-grow border-t border-slate-100"></div>
      </div>

      <RegisterForm onSubmit={handleManualRegister} />
    </AuthCard>
  );
}