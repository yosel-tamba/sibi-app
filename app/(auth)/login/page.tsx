"use client";

import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import AuthCard from "@/components/auth/AuthCard";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  const router = useRouter();
  const flaskUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const handleGoogleLogin = async (response: any) => {
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
        const googleUserSession = {
          id: data.user?.id || data.id || null,
          username: data.user?.username || data.username || "Google User",
          email: data.user?.email || data.email || "",
        };

        await Swal.fire({
          title: "Login Berhasil!",
          text: `Selamat datang kembali, ${googleUserSession.username}!`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });

        localStorage.setItem("user", JSON.stringify(googleUserSession));
        router.push("/");
      } else {
        Swal.fire({
          title: "Login Gagal",
          text: data.message || "Gagal masuk menggunakan Google.",
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

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await fetch(`${flaskUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "any-value",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        await Swal.fire({
          title: "Login Sukses!",
          text: `Selamat datang kembali, ${data.user.username}!`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });

        const userSessionData = {
          id: data.user?.id || data.id,
          username: data.user?.username || data.username,
          email: data.user?.email || data.email,
        };

        localStorage.setItem("user", JSON.stringify(userSessionData));
        router.push("/");
      } else {
        Swal.fire({
          title: "Gagal Masuk",
          text: data.message || "Username atau password salah.",
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
      title="Welcome Back"
      subtitle="Login untuk melanjutkan pembelajaran"
      footerText="Belum punya akun?"
      footerLinkText="Register"
      footerLinkHref="/register"
    >
      <GoogleLoginButton onSuccess={handleGoogleLogin} />

      <div className="relative flex py-5 items-center">
        <div className="flex-grow border-t border-slate-100"></div>
        <span className="flex-shrink mx-4 text-slate-400 text-xs tracking-wide">
          atau login manual
        </span>
        <div className="flex-grow border-t border-slate-100"></div>
      </div>

      <LoginForm onSubmit={handleLogin} />
    </AuthCard>
  );
}