"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  Check,
  CircleDashed,
} from "lucide-react";

const StatefulButton = ({
  state,
  onClick,
  idleText = "Log In",
}) => {
  const baseClasses =
    "w-full rounded-full py-3 px-4 font-semibold text-sm flex items-center justify-center transition-all duration-300 outline-none focus:ring-2 focus:ring-white/50";

  if (state === "loading") {
    return (
      <button
        type="button"
        disabled
        className={`${baseClasses} bg-gray-200/90 text-gray-600 cursor-not-allowed`}
      >
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Logging in...
      </button>
    );
  }

  if (state === "success") {
    return (
      <button
        type="button"
        disabled
        className={`${baseClasses} bg-green-500/90 text-white animate-[bounce_1s_ease-in-out_infinite] shadow-[0_0_20px_rgba(34,197,94,0.4)]`}
      >
        <Check className="w-5 h-5 mr-2 stroke-[3]" />
        Success!
      </button>
    );
  }

  return (
    <button
      type="submit"
      onClick={onClick}
      className={`${baseClasses} bg-lime-400 text-black hover:bg-gray-100 hover:scale-[1.02] shadow-lg active:scale-95`}
    >
      {idleText}
    </button>
  );
};

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [loginState, setLoginState] = useState("idle");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    if (loginState !== "idle") return;

    setError("");
    setLoginState("loading");

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setLoginState("idle");
        setError("Invalid email or password.");
        return;
      }

      setLoginState("success");

      setTimeout(() => {
        router.push("/admin");
        router.refresh();
      }, 700);
    } catch (error) {
      console.error("Login error:", error);

      setLoginState("idle");
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center bg-no-repeat font-sans"
      style={{
        backgroundImage:
          'url("https://images.unsplash.com/photo-1776491257990-6f8665d377f9")',
        backgroundColor: "#1a1025",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative w-full max-w-md">
        {/* Glass Container */}
        <div className="bg-black/30 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-10 w-full text-white">
          {/* Header */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="mb-6 opacity-80">
              <CircleDashed
                className="w-10 h-10 text-white"
                strokeWidth={1.5}
              />
            </div>

            <h1 className="text-3xl font-medium mb-3 tracking-tight">
              Welcome{" "}
              <span className="text-white/80 font-light">
                back!
              </span>
            </h1>

            <p className="text-sm text-gray-300/90 leading-relaxed max-w-[380px]">
              Sign in to access your Purple admin dashboard,
              members, memberships, referrals and more.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-300 ml-1">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="Enter your email"
                required
                disabled={loginState !== "idle"}
                autoComplete="email"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/50 transition-colors disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-300 ml-1">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="••••••••"
                  required
                  disabled={loginState !== "idle"}
                  autoComplete="current-password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/50 transition-colors font-mono disabled:opacity-50"
                />

                <button
                  type="button"
                  disabled={loginState !== "idle"}
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1 disabled:opacity-50"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3">
                <p className="text-xs text-red-300 text-center">
                  {error}
                </p>
              </div>
            )}

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between text-xs pt-1 pb-4">
              <label className="flex items-center cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                  />

                  <div className="w-4 h-4 rounded-md border border-white/20 bg-white/5 peer-checked:bg-purple-500 peer-checked:border-purple-500 transition-colors flex items-center justify-center group-hover:border-white/40">
                    <Check className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 stroke-[3]" />
                  </div>
                </div>

                <span className="ml-2 text-gray-300 group-hover:text-white transition-colors">
                  Remember me
                </span>
              </label>

            
            </div>

            {/* Login */}
            <div className="pt-2">
              <StatefulButton
                state={loginState}
                onClick={() => {}}
              />
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-gray-400">
            Purple Admin Panel
          </div>
        </div>
      </div>
    </div>
  );
}