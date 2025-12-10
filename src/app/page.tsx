import { getSession, getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function Home() {
  const session = await getSession();

  if (session) {
    const user = await getUserProfile();
    
    if (!user) {
      redirect("/onboarding");
    }
    
    if (user.status === "pending") {
      redirect("/pending-approval");
    }

    if (user.role === "admin") {
      redirect("/admin");
    }
    
    if (user.status === "approved") {
      redirect("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-3xl space-y-8">
        <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
          InventoryAI
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          The AI-first platform for modern retail. Zero-entry inventory management, 
          intelligent billing, and predictive analytics.
        </p>
        
        <div className="flex items-center justify-center gap-4 pt-8">
          <Link 
            href="/sign-in"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium transition-all hover:scale-105 flex items-center gap-2"
          >
            Get Started <ArrowRight className="w-5 h-5" />
          </Link>
          <Link 
            href="/sign-in" // Clerk handles sign-up via sign-in usually, or explicit sign-up
            className="px-8 py-4 bg-slate-900 border border-slate-800 hover:border-slate-700 text-white rounded-full font-medium transition-all"
          >
            Login
          </Link>
        </div>
      </div>
      
      <div className="absolute bottom-8 text-slate-600 text-sm">
        Powered by Inventorie
      </div>
    </div>
  );
}
