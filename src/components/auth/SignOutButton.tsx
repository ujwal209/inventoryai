'use client';

import { useAuth } from "@/context/AuthContext";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  const { signOut } = useAuth();

  return (
    <button 
      onClick={() => signOut()}
      className="flex items-center justify-center gap-2 mx-auto text-slate-400 hover:text-white transition-colors"
    >
      <LogOut className="w-4 h-4" />
      <span>Sign Out</span>
    </button>
  );
}
