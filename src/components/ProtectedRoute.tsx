"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  userOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  adminOnly = false,
  userOnly = false,
}) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      if (adminOnly && session?.user?.role !== "admin") {
        router.push("/dashboard");
      } else if (userOnly && session?.user?.role === "admin") {
        router.push("/admin");
      }
    }
  }, [session, status, adminOnly, userOnly, router]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#070913] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Glow effects */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-brand-purple/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-brand-blue/20 rounded-full blur-3xl" />
        
        <div className="relative flex flex-col items-center">
          {/* Logo animation */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-purple-blue p-0.5 animate-pulse mb-6">
            <div className="w-full h-full bg-[#070913] rounded-2xl flex items-center justify-center">
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">PW</span>
            </div>
          </div>
          
          <div className="h-1 w-32 bg-white/10 rounded-full overflow-hidden relative">
            <div className="absolute top-0 left-0 h-full w-1/2 bg-gradient-purple-blue rounded-full animate-[loading_1.5s_ease-in-out_infinite]" />
          </div>
          <span className="mt-4 text-sm text-slate-400 font-medium">Securing connection...</span>
        </div>

        <style jsx global>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </div>
    );
  }

  // Double check authorization
  if (adminOnly && session?.user?.role !== "admin") return null;
  if (userOnly && session?.user?.role === "admin") return null;

  return <>{children}</>;
};
