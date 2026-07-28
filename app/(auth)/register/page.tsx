"use client";

import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import AuthCard from "@/components/auth/AuthCard";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  const router = useRouter();
  const flaskUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const handleGoogleRegister = async (response: any) => {
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
      if (res.ok) {
        await Swal.fire({
          title: "Registrasi Berhasil!",
          text: "Akun Google Anda telah terdaftar dan langsung aktif.",
          icon: "success",
          confirmButtonText: "Lanjutkan",
          confirmButtonColor: "#10b981",
        });
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
    }
  };

  const handleManualRegister = async (name: string, password: string, confirmPassword: string) => {
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
          "ngrok-skip-browser-warning": "any-value",
        },
        body: JSON.stringify({ username: name, password }),
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