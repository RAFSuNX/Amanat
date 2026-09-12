export type Locale = "en" | "bn"
export const defaultLocale: Locale = "en"

const en = {
  nav: {
    ledger: "Ledger",
    howItWorks: "How it works",
    principles: "Principles",
    signIn: "Sign in",
    donate: "Donate",
  },
  hero: {
    eyebrow: "The Hope of All of Us",
    headline: "Built on trust. Sustained by charity.",
    body: "Amanat connects people who want to give with volunteers who help those who genuinely cannot support themselves. Every taka in, every taka out is on public record.",
    ctaDonate: "Make a Donation",
    ctaLedger: "Public Ledger",
  },
  stats: {
    totalDonated: "Total Donated",
    familiesActive: "Families Active",
    cyclesDone: "Cycles Done",
  },
  how: {
    eyebrow: "How It Works",
    steps: [
      {
        n: "01",
        title: "You Contribute",
        body: "Send money via bKash or Nagad. Submit your transaction reference. An admin verifies and adds it to the fund pool. You can track it on the public ledger.",
      },
      {
        n: "02",
        title: "Volunteers Register Families",
        body: "Verified volunteers visit communities, identify families who cannot support themselves, and register them with full household details and a monthly need assessment.",
      },
      {
        n: "03",
        title: "Fair Distribution",
        body: "Each month the pool is distributed proportionally, weighted by family size, children, disability, and earner status. Those in greater need receive more. Volunteers handle delivery.",
      },
    ],
  },
  principles: {
    eyebrow: "Our Principles",
    items: [
      {
        title: "Full Transparency",
        body: "Every confirmed donation and every completed distribution is on the public ledger. No login required. Anyone can verify.",
      },
      {
        title: "Need-Based Priority",
        body: "We do not distribute equally. A family with three young children and no earner receives more than a household with income. The algorithm is documented.",
      },
      {
        title: "Volunteer Accountability",
        body: "Every volunteer is KYC-verified before accessing the system. Each family registration is tied to a named, verified volunteer.",
      },
      {
        title: "No Cash to Beneficiaries",
        body: "Funds go to volunteers who handle actual purchases for each family. This prevents misuse and ensures the money reaches its purpose.",
      },
      {
        title: "Special Needs Process",
        body: "If a family faces an emergency, a volunteer can submit a special application. Admin reviews and approves additional funds outside the regular cycle.",
      },
      {
        title: "Permanent Records",
        body: "Every family registered stays in the system indefinitely. Their history, assessments, and distributions are permanently on record.",
      },
    ],
  },
  cta: {
    headline: "Ready to contribute?",
    body: "Every amount matters. Your donation enters a transparent, fair system.",
    donate: "Donate Now",
    ledger: "View Ledger",
  },
  footer: {
    tagline: "The Hope of All of Us",
    donationLedger: "Donation Ledger",
    distributionLedger: "Distribution Ledger",
    signIn: "Sign in",
  },
}

// Bengali translations -- filled as needed
const bn: typeof en = {
  nav: {
    ledger: "লেজার",
    howItWorks: "কিভাবে কাজ করে",
    principles: "নীতিমালা",
    signIn: "লগইন",
    donate: "অনুদান দিন",
  },
  hero: {
    eyebrow: "আমাদের সকলের আশা",
    headline: "বিশ্বাসের উপর গড়া। দানের মাধ্যমে টিকে থাকা।",
    body: "আমানত দাতাদের সাথে স্বেচ্ছাসেবীদের সংযুক্ত করে যারা সত্যিকারের অসহায় মানুষদের সাহায্য করে। প্রতিটি টাকার হিসাব প্রকাশ্যে থাকে।",
    ctaDonate: "অনুদান দিন",
    ctaLedger: "পাবলিক লেজার",
  },
  stats: {
    totalDonated: "মোট অনুদান",
    familiesActive: "সক্রিয় পরিবার",
    cyclesDone: "বিতরণ চক্র",
  },
  how: {
    eyebrow: "কিভাবে কাজ করে",
    steps: [
      {
        n: "০১",
        title: "আপনি অনুদান দিন",
        body: "বিকাশ বা নগদে টাকা পাঠান। ট্রানজেকশন রেফারেন্স দিন। অ্যাডমিন যাচাই করে ফান্ড পুলে যোগ করবেন।",
      },
      {
        n: "০২",
        title: "স্বেচ্ছাসেবীরা পরিবার নিবন্ধন করেন",
        body: "যাচাইকৃত স্বেচ্ছাসেবীরা সমাজে গিয়ে অসহায় পরিবার খুঁজে বের করেন এবং তাদের মাসিক চাহিদাসহ নিবন্ধন করেন।",
      },
      {
        n: "০৩",
        title: "ন্যায্য বিতরণ",
        body: "প্রতি মাসে পরিবারের আকার, শিশু, প্রতিবন্ধিতা অনুযায়ী আনুপাতিকভাবে বিতরণ করা হয়। বেশি প্রয়োজন, বেশি পাবেন।",
      },
    ],
  },
  principles: {
    eyebrow: "আমাদের নীতিমালা",
    items: [
      {
        title: "সম্পূর্ণ স্বচ্ছতা",
        body: "প্রতিটি নিশ্চিত অনুদান ও বিতরণ পাবলিক লেজারে প্রকাশিত। লগইন ছাড়াই যে কেউ যাচাই করতে পারবেন।",
      },
      {
        title: "প্রয়োজন অনুযায়ী অগ্রাধিকার",
        body: "সমানভাবে নয়, ন্যায্যভাবে বিতরণ করা হয়। অ্যালগরিদম নথিভুক্ত।",
      },
      {
        title: "স্বেচ্ছাসেবী জবাবদিহিতা",
        body: "প্রতিটি স্বেচ্ছাসেবী কেওয়াইসি যাচাইকৃত। প্রতিটি নিবন্ধন একজন নামধারী স্বেচ্ছাসেবীর সাথে সংযুক্ত।",
      },
      {
        title: "সুবিধাভোগীকে নগদ নয়",
        body: "তহবিল স্বেচ্ছাসেবীদের কাছে যায় যারা পরিবারের প্রকৃত চাহিদা পূরণ করেন।",
      },
      {
        title: "বিশেষ চাহিদা প্রক্রিয়া",
        body: "জরুরি প্রয়োজনে স্বেচ্ছাসেবী বিশেষ আবেদন করতে পারেন। অ্যাডমিন পর্যালোচনা করে অনুমোদন দেন।",
      },
      {
        title: "স্থায়ী রেকর্ড",
        body: "নিবন্ধিত প্রতিটি পরিবারের ইতিহাস, মূল্যায়ন ও বিতরণ স্থায়ীভাবে সংরক্ষিত থাকে।",
      },
    ],
  },
  cta: {
    headline: "অবদান রাখতে প্রস্তুত?",
    body: "প্রতিটি পরিমাণ গুরুত্বপূর্ণ। আপনার অনুদান একটি স্বচ্ছ, ন্যায্য ব্যবস্থায় প্রবেশ করে।",
    donate: "এখনই দিন",
    ledger: "লেজার দেখুন",
  },
  footer: {
    tagline: "আমাদের সকলের আশা",
    donationLedger: "অনুদান লেজার",
    distributionLedger: "বিতরণ লেজার",
    signIn: "লগইন",
  },
}

export const translations: Record<Locale, typeof en> = { en, bn }
