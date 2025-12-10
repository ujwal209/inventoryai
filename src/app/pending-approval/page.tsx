import { Clock } from "lucide-react";
import SignOutButton from "@/components/auth/SignOutButton";

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-yellow-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Account Pending</h1>
        <p className="text-slate-400 mb-8">
          Your account is currently under review by the administrator. You will receive access once your details are verified.
        </p>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 text-sm text-slate-500 mb-8">
          Please contact support if this takes longer than 24 hours.
        </div>
        
        <SignOutButton />
      </div>
    </div>
  );
}
