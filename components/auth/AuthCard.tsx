import Link from "next/link";
import { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
}

export default function AuthCard({
  title,
  subtitle,
  children,
  footerText,
  footerLinkText,
  footerLinkHref,
}: AuthCardProps) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/20 to-emerald-50/40 flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 -z-10 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 -z-10 w-96 h-96 bg-green-300/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-emerald-100 p-8 relative z-10">
        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-emerald-800 to-emerald-950 bg-clip-text text-transparent">
          {title}
        </h1>

        <p className="text-center text-slate-600 mt-2 text-sm">
          {subtitle}
        </p>

        {children}

        <p className="text-center mt-6 text-sm text-slate-600">
          {footerText}{" "}
          <Link
            href={footerLinkHref}
            className="text-emerald-600 font-semibold hover:text-emerald-700 hover:underline"
          >
            {footerLinkText}
          </Link>
        </p>
      </div>
    </main>
  );
}