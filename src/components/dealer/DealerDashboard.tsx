import { Users, TrendingUp, AlertTriangle, MapPin, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function DealerDashboard({ user }: { user: any }) {
  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 font-medium">Active Vendors</h3>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold">48</p>
          <p className="text-sm text-green-500 mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-4 h-4" /> +3 this week
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 font-medium">Network Volume</h3>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold">₹2.4M</p>
          <p className="text-sm text-green-500 mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-4 h-4" /> +12% vs last month
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 font-medium">Credit Risk Alerts</h3>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold">2</p>
          <p className="text-sm text-red-500 mt-2">Vendors exceeding limits</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Vendor Leaderboard */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Top Performing Vendors</h2>
            <button className="text-sm text-blue-400 hover:text-blue-300">View All</button>
          </div>
          <div className="divide-y divide-slate-800">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400">
                    {i}
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Sharma General Store</h3>
                    <p className="text-sm text-slate-400">Mumbai, Andheri West</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">₹1.2L</p>
                  <p className="text-xs text-green-500">High Volume</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights & Heatmap Placeholder */}
        <div className="space-y-8">
          {/* Regional Demand */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-5 h-5 text-purple-500" />
              <h2 className="text-xl font-semibold text-white">Regional Demand AI</h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-purple-500 shrink-0" />
                  <div>
                    <p className="text-white font-medium">North District Surge</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Buying <strong>20% more electronics</strong> this month. Suggest stocking up on chargers and cables.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0" />
                  <div>
                    <p className="text-white font-medium">Stockout Prediction</p>
                    <p className="text-sm text-slate-400 mt-1">
                      <strong>Vendor B</strong> runs out of Stock X every Friday. Suggest a bulk deal on Thursday.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Credit Risk */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="text-xl font-semibold text-white">Credit Risk AI</h2>
            </div>

            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-red-500 shrink-0" />
                <div>
                  <p className="text-white font-medium">High Risk: Vendor A</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Has delayed payments <strong>3 times</strong> recently. Recommendation: Reduce credit limit by 50%.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg transition-colors">
                      Reduce Limit
                    </button>
                    <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors">
                      View History
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
