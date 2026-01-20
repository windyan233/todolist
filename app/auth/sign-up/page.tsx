import { SignUpForm } from "@/components/sign-up-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function Page() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Back Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 md:top-10 md:left-10 z-20 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-lg hover:bg-white/20 rounded-xl text-white font-medium border border-white/20 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5" />
        返回首页
      </Link>

      <div className="w-full max-w-sm relative z-10">
        <SignUpForm />
      </div>
    </div>
  );
}
