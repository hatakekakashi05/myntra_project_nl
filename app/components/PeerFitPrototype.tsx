"use client";
import { useState } from "react";

interface WishlistItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice: number;
  image: string;
  inStockSizes: string[];
  recommendedSize: string;
  matchScore: number;
  retentionRate: number;
  stretchLevel: "None" | "Medium Stretch" | "4-Way High Stretch";
  transparencyIndex: "100% Opaque" | "Slightly Sheer" | "Squat-Proof Verified";
  peerPhotosCount: number;
  peerCohortDescription: string;
  pairedWithPastOrder: string;
  daysInWishlist: number;
}

const INITIAL_WISHLIST: WishlistItem[] = [
  {
    id: "sku-1",
    name: "Structured Slim-Fit Oxford Linen Blend Shirt",
    brand: "Roadster",
    category: "Casual Shirts",
    price: 1499,
    originalPrice: 2299,
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80",
    inStockSizes: ["S", "M", "L", "XL"],
    recommendedSize: "M",
    matchScore: 92,
    retentionRate: 88,
    stretchLevel: "Medium Stretch",
    transparencyIndex: "100% Opaque",
    peerPhotosCount: 24,
    peerCohortDescription: "480 shoppers between 5'7\"–5'9\" and 72–76kg",
    pairedWithPastOrder: "Levi's 511 Slim Jeans (Purchased June 2026)",
    daysInWishlist: 8
  },
  {
    id: "sku-2",
    name: "Embroidered Anarkali Kurta Set with Dupatta",
    brand: "Libas",
    category: "Ethnic Wear",
    price: 1699,
    originalPrice: 3499,
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
    inStockSizes: ["XS", "S", "M", "L"],
    recommendedSize: "S",
    matchScore: 95,
    retentionRate: 91,
    stretchLevel: "None",
    transparencyIndex: "100% Opaque",
    peerPhotosCount: 38,
    peerCohortDescription: "310 shoppers between 5'2\"–5'4\" and 50–55kg",
    pairedWithPastOrder: "Gold-toned Jhumkas (Purchased March 2026)",
    daysInWishlist: 14
  },
  {
    id: "sku-3",
    name: "Rapid-Dry Seamless Gym Compression Tights",
    brand: "HRX by Hrithik",
    category: "Activewear",
    price: 1299,
    originalPrice: 1999,
    image: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=600&q=80",
    inStockSizes: ["M", "L", "XL"],
    recommendedSize: "M",
    matchScore: 89,
    retentionRate: 85,
    stretchLevel: "4-Way High Stretch",
    transparencyIndex: "Squat-Proof Verified",
    peerPhotosCount: 19,
    peerCohortDescription: "220 athletic buyers (chest 39-41 in)",
    pairedWithPastOrder: "Puma Training Duffel Bag (Purchased May 2026)",
    daysInWishlist: 21
  },
  {
    id: "sku-4",
    name: "Vintage Washed Oversized Denim Varsity Jacket",
    brand: "Mast & Harbour",
    category: "Jackets",
    price: 1799,
    originalPrice: 2999,
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
    inStockSizes: ["S", "M", "L"],
    recommendedSize: "M",
    matchScore: 87,
    retentionRate: 83,
    stretchLevel: "None",
    transparencyIndex: "100% Opaque",
    peerPhotosCount: 16,
    peerCohortDescription: "190 buyers with broader shoulders",
    pairedWithPastOrder: "Nike Court White Sneakers (Purchased Jan 2026)",
    daysInWishlist: 5
  }
];

export default function PeerFitPrototype() {
  const [userHeight, setUserHeight] = useState("5'8\"");
  const [userWeight, setUserWeight] = useState("74 kg");
  const [userFitPref, setUserFitPref] = useState("Regular Fit");
  const [activeItem, setActiveItem] = useState<WishlistItem | null>(null);
  const [lockedItemIds, setLockedItemIds] = useState<{ [id: string]: boolean }>({});
  const [bagSuccessMsg, setBagSuccessMsg] = useState("");

  const handleLockSize = (item: WishlistItem) => {
    setLockedItemIds(prev => ({ ...prev, [item.id]: true }));
    setBagSuccessMsg(`Locked Size ${item.recommendedSize} for ${item.name}! Added to bag with 48h reservation.`);
    setTimeout(() => setBagSuccessMsg(""), 4500);
    setActiveItem(null);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner Context */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                Phase 10 Interactive MVP
              </span>
              <span className="text-slate-400 text-xs">Zero Monetary Discounts</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Myntra PeerFit™ Experience Prototype
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Eliminating sizing anxiety and return friction by matching wishlisted garments with aggregated purchase & return data from real shoppers of your exact build.
            </p>
          </div>

          {/* User Profile Controls */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center gap-4 text-xs">
            <div>
              <label className="text-slate-400 block font-medium">Your Height</label>
              <select 
                value={userHeight}
                onChange={(e) => setUserHeight(e.target.value)}
                className="bg-slate-800 text-white rounded px-2 py-1 mt-0.5 border border-slate-700 outline-none"
              >
                <option value="5'4&quot;">5&apos;4&quot; (163 cm)</option>
                <option value="5'6&quot;">5&apos;6&quot; (168 cm)</option>
                <option value="5'8&quot;">5&apos;8&quot; (173 cm) [Anurag Cohort]</option>
                <option value="5'10&quot;">5&apos;10&quot; (178 cm)</option>
                <option value="6'0&quot;">6&apos;0&quot; (183 cm)</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 block font-medium">Your Weight</label>
              <select 
                value={userWeight}
                onChange={(e) => setUserWeight(e.target.value)}
                className="bg-slate-800 text-white rounded px-2 py-1 mt-0.5 border border-slate-700 outline-none"
              >
                <option value="55 kg">55 kg</option>
                <option value="65 kg">65 kg</option>
                <option value="74 kg">74 kg [Athletic Build]</option>
                <option value="82 kg">82 kg</option>
                <option value="90 kg">90 kg</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 block font-medium">Fit Preference</label>
              <select 
                value={userFitPref}
                onChange={(e) => setUserFitPref(e.target.value)}
                className="bg-slate-800 text-white rounded px-2 py-1 mt-0.5 border border-slate-700 outline-none"
              >
                <option value="Slim Fit">Slim Fit</option>
                <option value="Regular Fit">Regular Fit</option>
                <option value="Relaxed / Oversized">Relaxed / Oversized</option>
              </select>
            </div>
          </div>
        </div>

        {/* Global Bag Notification Alert */}
        {bagSuccessMsg && (
          <div className="mt-4 bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-sm px-4 py-2.5 rounded-lg flex items-center gap-2 animate-bounce">
            <span>✓</span>
            <span>{bagSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Wishlist Grid with PeerFit Badges */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <span>Your Wishlist ({INITIAL_WISHLIST.length} Saved Items)</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
              Personalized for {userHeight}, {userWeight}
            </span>
          </h3>
          <span className="text-xs text-slate-400">
            Click any PeerFit badge to view verified cohort review photos & fabric specs
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {INITIAL_WISHLIST.map((item) => {
            const isLocked = lockedItemIds[item.id];
            return (
              <div 
                key={item.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden transition-all flex flex-col justify-between group shadow-lg"
              >
                <div className="relative">
                  {/* Product Image */}
                  <div className="h-64 overflow-hidden bg-slate-950 relative">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Days in Wishlist Pill */}
                    <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-medium">
                      In Wishlist for {item.daysInWishlist}d
                    </span>

                    {/* Size Hold Active Badge */}
                    {isLocked && (
                      <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                        🔒 Size {item.recommendedSize} Reserved (47h 59m)
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2.5">
                    <div>
                      <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                        {item.brand}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-100 line-clamp-1">
                        {item.name}
                      </h4>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-bold text-white">₹{item.price}</span>
                      <span className="text-xs text-slate-500 line-through">₹{item.originalPrice}</span>
                      <span className="text-xs text-emerald-400 font-semibold">
                        ({Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF)
                      </span>
                    </div>

                    {/* PeerFit Interactive Badge (The Core Non-Monetary Trigger) */}
                    <button
                      onClick={() => setActiveItem(item)}
                      className="w-full text-left bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 hover:border-emerald-400/80 rounded-lg p-2.5 transition-all group/badge"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                          <span className="text-xs font-bold text-emerald-300">
                            {item.matchScore}% PeerFit™ Match
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-400 group-hover/badge:translate-x-0.5 transition-transform">
                          Details →
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1">
                        Size <span className="font-bold text-white">{item.recommendedSize}</span> fits your build ({userHeight}, {userWeight})
                      </p>
                    </button>

                    {/* Capsule Wardrobe Teaser */}
                    <div className="bg-slate-950/60 rounded-lg p-2 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-1.5">
                      <span className="text-indigo-400">⚡</span>
                      <span>Pairs with: <span className="text-slate-200 font-medium">{item.pairedWithPastOrder}</span></span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 pt-0">
                  {isLocked ? (
                    <button
                      className="w-full bg-slate-800 text-emerald-300 text-xs font-semibold py-2.5 rounded-lg flex items-center justify-center gap-1.5 border border-emerald-500/30 cursor-default"
                    >
                      <span>✓ In Bag with 48h Size Lock</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleLockSize(item)}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-900/40"
                    >
                      <span>Add Size {item.recommendedSize} to Bag (Lock 48h)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PeerFit Intelligence Modal / Drawer */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
            <button 
              onClick={() => setActiveItem(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                  PeerFit™ Verification
                </span>
                <span className="text-xs text-slate-400">{activeItem.brand}</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">{activeItem.name}</h3>
              <p className="text-xs text-slate-400">
                Aggregated from {activeItem.peerCohortDescription}
              </p>
            </div>

            {/* Key Fit Metrics */}
            <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-center border-r border-slate-800">
                <div className="text-2xl font-black text-emerald-400">{activeItem.retentionRate}%</div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">Kept Size {activeItem.recommendedSize}</div>
              </div>
              <div className="text-center border-r border-slate-800">
                <div className="text-sm font-bold text-white mt-1">{activeItem.stretchLevel}</div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">Fabric Stretch</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-emerald-400 mt-1">{activeItem.transparencyIndex}</div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">Fabric Density</div>
              </div>
            </div>

            {/* Cohort Breakdown & Real Return Friction */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Cohort Fit Distribution:</span>
                <span className="text-emerald-400">{activeItem.retentionRate}% Satisfied</span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                <div style={{ width: `${activeItem.retentionRate}%` }} className="bg-emerald-500 h-full" title="Kept Size M"></div>
                <div style={{ width: "8%" }} className="bg-amber-500 h-full" title="Exchanged for L"></div>
                <div style={{ width: "4%" }} className="bg-rose-500 h-full" title="Returned"></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>🟢 {activeItem.retentionRate}% Perfect Fit (Size {activeItem.recommendedSize})</span>
                <span>🟡 8% Sized Up</span>
                <span>🔴 4% Returned</span>
              </div>
            </div>

            {/* Peer Review Gallery Preview */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">
                  Verified Peer Photos ({activeItem.peerPhotosCount} from users matching {userHeight})
                </span>
                <span className="text-[11px] text-indigo-400 cursor-pointer hover:underline">
                  Filter: Strict Body Cohort
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((idx) => (
                  <div key={idx} className="h-20 bg-slate-800 rounded-lg overflow-hidden relative border border-slate-700">
                    <img 
                      src={`https://picsum.photos/seed/peer_${activeItem.id}_${idx}/200/200`}
                      alt="Customer reviewer photo"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/70 text-[9px] text-slate-200 px-1 rounded">
                      {userHeight}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal CTA */}
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setActiveItem(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-3 rounded-xl transition-colors"
              >
                Back to Wishlist
              </button>
              <button
                onClick={() => handleLockSize(activeItem)}
                className="flex-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-950 flex items-center justify-center gap-2"
              >
                <span>🔒 Lock Size {activeItem.recommendedSize} & Add to Bag</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
