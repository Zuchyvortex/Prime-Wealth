export const INVESTMENT_PLANS = [
  {
    id: "Starter",
    name: "Starter Yield Plan",
    roi: 450,
    duration: 12,
    min: 5102,
    yieldString: "Up to 450%",
    desc: "Ideal for individual crypto investors starting out in yield generation.",
    badge: "Standard",
    color: "from-brand-emerald-dark to-brand-emerald-deep",
    badgeColor: "bg-emerald-500/10 text-brand-emerald border border-emerald-500/20",
    highlight: false,
    features: [
      "Standard security protection",
      "Automated daily audit reports",
      "Basic live analytics support",
      "Digital wallet custody keys",
      "Secure wallet ledger access"
    ]
  },
  {
    id: "Growth",
    name: "Growth Yield Plan",
    roi: 850,
    duration: 20,
    min: 10450,
    yieldString: "Up to 850%",
    desc: "Designed for scaling portfolios seeking higher returns and faster clearance.",
    badge: "Popular",
    color: "from-brand-emerald-dark/80 to-brand-emerald-deep",
    badgeColor: "bg-emerald-500/10 text-brand-emerald border border-emerald-500/20",
    highlight: false,
    features: [
      "Advanced insurance shielding",
      "Real-time asset optimization",
      "Dedicated wallet dashboard",
      "Full borderless transacting",
      "Priority dashboard authorization"
    ]
  },
  {
    id: "Elite",
    name: "Elite Treasury Yield",
    roi: 1030,
    duration: 40,
    min: 35750,
    yieldString: "Up to 1030%",
    desc: "Premium treasury yield optimization for high-net-worth investors.",
    badge: "VIP Elite",
    color: "from-amber-950/40 to-amber-950/20",
    badgeColor: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    highlight: true,
    features: [
      "Custom high-yield APY tiers",
      "1-on-1 dedicated human support advisor",
      "Unlimited custom vault clearances",
      "Instant transaction authorization",
      "Comprehensive regulatory compliance reports",
      "Gold-plated security authentication"
    ]
  },
  {
    id: "Ultimate",
    name: "Ultimate Yield Plan",
    roi: 7000,
    duration: 60,
    min: 57760,
    yieldString: "Up to 7000%",
    desc: "Maximum efficiency yield architecture for long-term capital preservation.",
    badge: "Institutional",
    color: "from-emerald-950/80 to-[#070913]",
    badgeColor: "bg-emerald-500/10 text-brand-emerald border border-emerald-500/20",
    highlight: false,
    features: [
      "Sovereign multi-sig vault authorization",
      "Immediate compliance auto-clearance",
      "VIP platform admin access privileges",
      "Bespoke wealth growth reports",
      "Highest tier system health priority",
      "Zero platform performance fees"
    ]
  }
];

export const PLAN_IDS = ["Starter", "Growth", "Elite", "Ultimate"] as const;

export type PlanId = typeof PLAN_IDS[number];
