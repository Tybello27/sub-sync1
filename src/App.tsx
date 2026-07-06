import { AnimatePresence, motion } from "framer-motion";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

type Page = "home" | "subscriptions" | "calendar" | "analytics" | "reminders" | "profile";
type Status = "active" | "paused" | "cancelled";
type BillingCycle = "weekly" | "monthly" | "quarterly" | "yearly";
type Category = "Entertainment" | "Productivity" | "Utilities" | "AI" | "Design" | "Cloud" | "Music" | "Education";
type Currency = "USD" | "EUR" | "GBP" | "NGN" | "CAD";

type Subscription = {
  id: string;
  serviceName: string;
  category: Category;
  plan: string;
  billingCycle: BillingCycle;
  renewalDate: string;
  paymentMethod: string;
  amount: number;
  notes: string;
  reminderDays: number[];
  status: Status;
  favorite: boolean;
  logoText: string;
  logoGradient: string;
  logoDataUrl?: string;
  createdAt: string;
};

type Settings = {
  theme: "light" | "dark" | "system";
  currency: Currency;
  notifications: boolean;
  renewalAlerts: boolean;
  budgetAlerts: boolean;
  defaultReminderDays: number[];
  accent: "ocean" | "violet" | "mint";
};

type Activity = {
  id: string;
  text: string;
  time: string;
  tone: "success" | "info" | "warning";
};

type SubSyncData = {
  version: 1;
  onboarded: boolean;
  subscriptions: Subscription[];
  settings: Settings;
  activity: Activity[];
};

type DraftSubscription = Omit<Subscription, "id" | "createdAt">;

type Toast = {
  id: string;
  message: string;
  tone: "success" | "error" | "info";
};

const DATA_KEY = "subsync.data.v1";
const categories: Category[] = ["Entertainment", "Productivity", "Utilities", "AI", "Design", "Cloud", "Music", "Education"];
const cycles: BillingCycle[] = ["weekly", "monthly", "quarterly", "yearly"];
const statuses: Status[] = ["active", "paused", "cancelled"];
const gradients = [
  "from-red-500 via-rose-600 to-black",
  "from-emerald-400 via-green-500 to-slate-950",
  "from-blue-500 via-indigo-500 to-purple-500",
  "from-slate-900 via-slate-700 to-cyan-400",
  "from-fuchsia-500 via-purple-500 to-cyan-400",
  "from-red-500 via-orange-500 to-yellow-300",
  "from-pink-500 via-rose-400 to-purple-500",
  "from-sky-400 via-cyan-400 to-teal-300",
];

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: "⌂" },
  { id: "subscriptions", label: "Subs", icon: "▤" },
  { id: "calendar", label: "Calendar", icon: "◷" },
  { id: "analytics", label: "Insights", icon: "◌" },
  { id: "reminders", label: "Alerts", icon: "◔" },
  { id: "profile", label: "Profile", icon: "♙" },
];

const logoPresets = [
  { name: "Netflix", text: "N", gradient: "from-red-600 via-red-700 to-black" },
  { name: "Spotify", text: "♬", gradient: "from-green-400 via-emerald-500 to-black" },
  { name: "Disney+", text: "D+", gradient: "from-blue-500 via-indigo-600 to-slate-950" },
  { name: "ChatGPT Plus", text: "AI", gradient: "from-slate-800 via-teal-500 to-cyan-300" },
  { name: "Microsoft 365", text: "M", gradient: "from-blue-500 via-violet-500 to-fuchsia-500" },
  { name: "Canva Pro", text: "C", gradient: "from-cyan-400 via-purple-500 to-pink-400" },
  { name: "YouTube Premium", text: "▶", gradient: "from-red-500 via-red-600 to-rose-900" },
  { name: "Adobe Creative Cloud", text: "A", gradient: "from-rose-500 via-purple-600 to-indigo-700" },
];

const now = new Date();
const isoInDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};
const todayIso = () => new Date().toISOString().slice(0, 10);
const uid = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const defaultSettings: Settings = {
  theme: "light",
  currency: "USD",
  notifications: true,
  renewalAlerts: true,
  budgetAlerts: true,
  defaultReminderDays: [1, 3, 7],
  accent: "ocean",
};

const seedSubscriptions = (): Subscription[] => [
  {
    id: uid(),
    serviceName: "Netflix",
    category: "Entertainment",
    plan: "Premium 4K",
    billingCycle: "monthly",
    renewalDate: isoInDays(3),
    paymentMethod: "Visa •••• 4482",
    amount: 19.99,
    notes: "Family movie nights and originals.",
    reminderDays: [1, 3, 7],
    status: "active",
    favorite: true,
    logoText: "N",
    logoGradient: "from-red-600 via-red-700 to-black",
    createdAt: isoInDays(-42),
  },
  {
    id: uid(),
    serviceName: "Spotify",
    category: "Music",
    plan: "Family",
    billingCycle: "monthly",
    renewalDate: isoInDays(6),
    paymentMethod: "Mastercard •••• 1190",
    amount: 16.99,
    notes: "Shared playlist account.",
    reminderDays: [1, 3],
    status: "active",
    favorite: true,
    logoText: "♬",
    logoGradient: "from-green-400 via-emerald-500 to-black",
    createdAt: isoInDays(-77),
  },
  {
    id: uid(),
    serviceName: "Disney+",
    category: "Entertainment",
    plan: "Bundle Duo",
    billingCycle: "monthly",
    renewalDate: isoInDays(1),
    paymentMethod: "Apple Pay",
    amount: 13.99,
    notes: "Due soon — compare with annual bundle.",
    reminderDays: [1, 3, 7],
    status: "active",
    favorite: false,
    logoText: "D+",
    logoGradient: "from-blue-500 via-indigo-600 to-slate-950",
    createdAt: isoInDays(-18),
  },
  {
    id: uid(),
    serviceName: "ChatGPT Plus",
    category: "AI",
    plan: "Plus",
    billingCycle: "monthly",
    renewalDate: isoInDays(11),
    paymentMethod: "Visa •••• 4482",
    amount: 20,
    notes: "Productivity and research assistant.",
    reminderDays: [3],
    status: "active",
    favorite: true,
    logoText: "AI",
    logoGradient: "from-slate-800 via-teal-500 to-cyan-300",
    createdAt: isoInDays(-12),
  },
  {
    id: uid(),
    serviceName: "Microsoft 365",
    category: "Productivity",
    plan: "Business Standard",
    billingCycle: "yearly",
    renewalDate: isoInDays(8),
    paymentMethod: "Amex •••• 2208",
    amount: 149.99,
    notes: "Annual team productivity subscription.",
    reminderDays: [7, 14],
    status: "active",
    favorite: false,
    logoText: "M",
    logoGradient: "from-blue-500 via-violet-500 to-fuchsia-500",
    createdAt: isoInDays(-155),
  },
  {
    id: uid(),
    serviceName: "Canva Pro",
    category: "Design",
    plan: "Pro",
    billingCycle: "monthly",
    renewalDate: isoInDays(15),
    paymentMethod: "PayPal",
    amount: 14.99,
    notes: "Design templates and social assets.",
    reminderDays: [1, 3],
    status: "paused",
    favorite: false,
    logoText: "C",
    logoGradient: "from-cyan-400 via-purple-500 to-pink-400",
    createdAt: isoInDays(-93),
  },
  {
    id: uid(),
    serviceName: "YouTube Premium",
    category: "Entertainment",
    plan: "Individual",
    billingCycle: "monthly",
    renewalDate: isoInDays(-2),
    paymentMethod: "Visa •••• 4482",
    amount: 13.99,
    notes: "Overdue — update backup card.",
    reminderDays: [1, 3],
    status: "active",
    favorite: false,
    logoText: "▶",
    logoGradient: "from-red-500 via-red-600 to-rose-900",
    createdAt: isoInDays(-38),
  },
  {
    id: uid(),
    serviceName: "Adobe Creative Cloud",
    category: "Design",
    plan: "All Apps",
    billingCycle: "monthly",
    renewalDate: isoInDays(23),
    paymentMethod: "Mastercard •••• 1190",
    amount: 59.99,
    notes: "Most expensive monthly plan.",
    reminderDays: [3, 7],
    status: "active",
    favorite: true,
    logoText: "A",
    logoGradient: "from-rose-500 via-purple-600 to-indigo-700",
    createdAt: isoInDays(-214),
  },
];

const seedData = (): SubSyncData => ({
  version: 1,
  onboarded: false,
  subscriptions: seedSubscriptions(),
  settings: defaultSettings,
  activity: [
    { id: uid(), text: "Disney+ reminder scheduled for tomorrow", time: isoInDays(0), tone: "warning" },
    { id: uid(), text: "Spotify Family renewal confirmed", time: isoInDays(-1), tone: "success" },
    { id: uid(), text: "Canva Pro moved to paused", time: isoInDays(-3), tone: "info" },
  ],
});

function readData(): SubSyncData {
  try {
    const stored = localStorage.getItem(DATA_KEY);
    if (!stored) return seedData();
    const parsed = JSON.parse(stored) as Partial<SubSyncData>;
    if (parsed.version !== 1 || !Array.isArray(parsed.subscriptions)) return seedData();
    return {
      version: 1,
      onboarded: parsed.onboarded ?? false,
      subscriptions: parsed.subscriptions,
      settings: { ...defaultSettings, ...parsed.settings },
      activity: parsed.activity?.length ? parsed.activity : seedData().activity,
    };
  } catch {
    return seedData();
  }
}

const parseDate = (value: string) => new Date(`${value}T12:00:00`);
const daysUntil = (value: string) => Math.ceil((parseDate(value).getTime() - parseDate(todayIso()).getTime()) / 86_400_000);
const monthlyAmount = (subscription: Subscription) => {
  if (subscription.status !== "active") return 0;
  if (subscription.billingCycle === "weekly") return (subscription.amount * 52) / 12;
  if (subscription.billingCycle === "quarterly") return subscription.amount / 3;
  if (subscription.billingCycle === "yearly") return subscription.amount / 12;
  return subscription.amount;
};
const yearlyAmount = (subscription: Subscription) => monthlyAmount(subscription) * 12;
const compactDate = (date: string) => parseDate(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const fullDate = (date: string) => parseDate(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

function currencyFormatter(currency: Currency) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: currency === "NGN" ? 0 : 2 });
}

function defaultDraft(): DraftSubscription {
  return {
    serviceName: "",
    category: "Entertainment",
    plan: "Premium",
    billingCycle: "monthly",
    renewalDate: isoInDays(7),
    paymentMethod: "Visa •••• 4482",
    amount: 9.99,
    notes: "",
    reminderDays: [1, 3],
    status: "active",
    favorite: false,
    logoText: "S",
    logoGradient: gradients[0],
  };
}

function App() {
  const [data, setData] = useState<SubSyncData>(() => readData());
  const [page, setPage] = useState<Page>("home");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [isFormOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 780);
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", data.settings.theme === "dark" || (data.settings.theme === "system" && prefersDark));
    document.querySelector("meta[name='theme-color']")?.setAttribute("content", data.settings.theme === "dark" ? "#07111f" : "#69c8d0");
  }, [data]);

  const money = useMemo(() => currencyFormatter(data.settings.currency), [data.settings.currency]);
  const activeSubs = data.subscriptions.filter((subscription) => subscription.status === "active");
  const dueSoon = activeSubs.filter((subscription) => daysUntil(subscription.renewalDate) >= 0 && daysUntil(subscription.renewalDate) <= 7);
  const overdue = activeSubs.filter((subscription) => daysUntil(subscription.renewalDate) < 0);
  const monthlyCost = activeSubs.reduce((sum, subscription) => sum + monthlyAmount(subscription), 0);
  const yearlyCost = activeSubs.reduce((sum, subscription) => sum + yearlyAmount(subscription), 0);

  const showToast = (message: string, tone: Toast["tone"] = "success") => {
    const id = uid();
    setToast({ id, message, tone });
    window.setTimeout(() => setToast((current) => (current?.id === id ? null : current)), 2600);
  };

  const addActivity = (text: string, tone: Activity["tone"] = "info") => {
    setData((current) => ({
      ...current,
      activity: [{ id: uid(), text, time: todayIso(), tone }, ...current.activity].slice(0, 8),
    }));
  };

  const saveSubscription = (draft: DraftSubscription, id?: string) => {
    if (id) {
      setData((current) => ({
        ...current,
        subscriptions: current.subscriptions.map((item) => (item.id === id ? { ...item, ...draft } : item)),
      }));
      addActivity(`${draft.serviceName} details updated`, "success");
      showToast("Subscription updated");
    } else {
      setData((current) => ({
        ...current,
        subscriptions: [{ ...draft, id: uid(), createdAt: todayIso() }, ...current.subscriptions],
      }));
      addActivity(`${draft.serviceName} added to SubSync`, "success");
      showToast("Subscription added");
    }
    setEditing(null);
    setFormOpen(false);
  };

  const deleteSubscription = (id: string, name: string) => {
    setData((current) => ({ ...current, subscriptions: current.subscriptions.filter((subscription) => subscription.id !== id) }));
    addActivity(`${name} removed`, "warning");
    showToast("Subscription deleted", "info");
  };

  const toggleFavorite = (id: string) => {
    setData((current) => ({
      ...current,
      subscriptions: current.subscriptions.map((subscription) =>
        subscription.id === id ? { ...subscription, favorite: !subscription.favorite } : subscription,
      ),
    }));
    showToast("Favorite updated");
  };

  const updateSettings = (settings: Partial<Settings>) => {
    setData((current) => ({ ...current, settings: { ...current.settings, ...settings } }));
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `subsync-export-${todayIso()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Data exported");
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result)) as SubSyncData;
        if (imported.version !== 1 || !Array.isArray(imported.subscriptions)) throw new Error("Invalid file");
        setData({ ...imported, settings: { ...defaultSettings, ...imported.settings } });
        showToast("Data imported");
      } catch {
        showToast("Import failed. Choose a valid SubSync export.", "error");
      }
    };
    reader.readAsText(file);
  };

  const promptInstall = async () => {
    if (!installPrompt) {
      showToast("On iPhone Safari, tap Share then Add to Home Screen.", "info");
      return;
    }
    await installPrompt.prompt();
    setInstallPrompt(null);
  };

  const currentPage = () => {
    const props = { data, money, monthlyCost, yearlyCost, dueSoon, overdue };
    switch (page) {
      case "home":
        return <Dashboard {...props} setPage={setPage} openAdd={() => { setEditing(null); setFormOpen(true); }} promptInstall={promptInstall} />;
      case "subscriptions":
        return <SubscriptionsPage data={data} money={money} onEdit={(subscription) => { setEditing(subscription); setFormOpen(true); }} onDelete={deleteSubscription} onFavorite={toggleFavorite} />;
      case "calendar":
        return <CalendarPage data={data} money={money} openAdd={() => { setEditing(null); setFormOpen(true); }} />;
      case "analytics":
        return <AnalyticsPage data={data} money={money} monthlyCost={monthlyCost} yearlyCost={yearlyCost} />;
      case "reminders":
        return <RemindersPage data={data} money={money} dueSoon={dueSoon} overdue={overdue} />;
      case "profile":
        return <ProfilePage data={data} updateSettings={updateSettings} exportData={exportData} importData={importData} promptInstall={promptInstall} showToast={showToast} />;
      default:
        return null;
    }
  };

  if (loading) return <LoadingScreen />;

  if (!data.onboarded) {
    return (
      <Onboarding
        onDone={() => {
          setData((current) => ({ ...current, onboarded: true }));
          showToast("Welcome to SubSync, Ola 👋");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen overflow-hidden text-[var(--text)]">
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-80">
        <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-cyan-300/35 blur-3xl" />
        <div className="absolute -right-24 top-24 h-80 w-80 rounded-full bg-violet-300/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
      </div>

      <div className="phone-shell safe-top px-4 pb-28 lg:max-w-7xl lg:px-8">
        <Header
          page={page}
          setPage={setPage}
          openAdd={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          theme={data.settings.theme}
          updateTheme={(theme) => updateSettings({ theme })}
        />

        <div className="mt-4 grid gap-6 lg:grid-cols-[96px_1fr]">
          <DesktopRail page={page} setPage={setPage} />
          <AnimatePresence mode="wait">
            <motion.main
              key={page}
              initial={{ opacity: 0, y: 18, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="min-w-0"
            >
              {currentPage()}
            </motion.main>
          </AnimatePresence>
        </div>
      </div>

      <MobileNav page={page} setPage={setPage} />
      <FloatingAdd onClick={() => { setEditing(null); setFormOpen(true); }} />

      <AnimatePresence>{isFormOpen && <SubscriptionModal subscription={editing} onClose={() => { setEditing(null); setFormOpen(false); }} onSave={saveSubscription} />}</AnimatePresence>
      <AnimatePresence>{toast && <ToastView toast={toast} />}</AnimatePresence>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center px-6 text-[var(--text)]">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card w-full max-w-sm rounded-[2.25rem] p-8 text-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }} className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-cyan-300 to-violet-500 text-4xl text-white shadow-2xl">
          S
        </motion.div>
        <h1 className="mt-6 text-3xl font-black tracking-tight">SubSync</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Syncing renewals, reminders, and spending insights…</p>
        <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" initial={{ width: "15%" }} animate={{ width: "100%" }} transition={{ duration: 0.75 }} />
        </div>
      </motion.div>
    </div>
  );
}

function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const slides = [
    { title: "Control Your Spending", text: "Track every recurring payment in one polished, offline-first command center.", icon: "💳" },
    { title: "Never Miss Renewals", text: "Smart reminders, overdue alerts, and a premium calendar keep Ola ahead of every bill.", icon: "🔔" },
    { title: "See Saving Insights", text: "Analyze trends, categories, and expensive subscriptions with beautiful charts.", icon: "📊" },
  ];
  const slide = slides[step];
  return (
    <div className="min-h-screen px-5 py-6 text-[var(--text)]">
      <div className="phone-shell grid min-h-[calc(100svh-3rem)] place-items-center">
        <motion.section layout className="glass-card premium-ring relative w-full overflow-hidden rounded-[2.5rem] p-7 text-center">
          <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-cyan-200/70 to-transparent dark:from-cyan-500/15" />
          <div className="relative flex items-center justify-between text-sm font-bold text-[var(--muted)]">
            <span>9:41</span>
            <span>●●●</span>
          </div>
          <motion.div key={slide.title} initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative mt-12">
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{slide.title}</h1>
            <div className="mx-auto mt-10 grid h-56 w-56 place-items-center rounded-[3rem] bg-gradient-to-br from-white/90 via-cyan-100 to-violet-100 shadow-2xl dark:from-white/10 dark:via-cyan-500/20 dark:to-violet-500/20">
              <motion.div animate={{ y: [0, -10, 0], rotate: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 3 }} className="text-8xl">
                {slide.icon}
              </motion.div>
            </div>
            <h2 className="mt-12 text-4xl font-black tracking-tight">SubSync</h2>
            <p className="mx-auto mt-3 max-w-xs text-base font-medium leading-7 text-[var(--muted)]">{slide.text}</p>
            <div className="mt-8 flex justify-center gap-2">
              {slides.map((item, index) => (
                <button key={item.title} aria-label={`Go to onboarding slide ${index + 1}`} onClick={() => setStep(index)} className={`h-2.5 rounded-full transition-all ${index === step ? "w-8 bg-cyan-500" : "w-2.5 bg-slate-300 dark:bg-white/20"}`} />
              ))}
            </div>
          </motion.div>
          <div className="relative mt-8 flex gap-3">
            <button onClick={onDone} className="h-14 flex-1 rounded-2xl font-bold text-[var(--muted)]">Skip</button>
            <button onClick={() => (step === slides.length - 1 ? onDone() : setStep((current) => current + 1))} className="gradient-button h-14 flex-1 rounded-2xl font-black">
              {step === slides.length - 1 ? "Start" : "Next"}
            </button>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

function Header({ page, setPage, openAdd, theme, updateTheme }: { page: Page; setPage: (page: Page) => void; openAdd: () => void; theme: Settings["theme"]; updateTheme: (theme: Settings["theme"]) => void }) {
  const title = page === "home" ? "Dashboard" : navItems.find((item) => item.id === page)?.label;
  return (
    <header className="flex items-center justify-between gap-3">
      <button onClick={() => setPage("home")} className="flex items-center gap-3 rounded-3xl pr-3 text-left">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-violet-500 text-xl font-black text-white shadow-xl">S</div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--muted)]">SubSync</p>
          <h1 className="text-xl font-black tracking-tight">{title}</h1>
        </div>
      </button>
      <div className="flex items-center gap-2">
        <button onClick={() => updateTheme(theme === "dark" ? "light" : "dark")} className="soft-card grid h-12 w-12 place-items-center rounded-2xl text-lg" aria-label="Toggle theme">
          {theme === "dark" ? "☀" : "☾"}
        </button>
        <button onClick={openAdd} className="gradient-button hidden h-12 rounded-2xl px-5 font-black lg:block">+ Add</button>
      </div>
    </header>
  );
}

function DesktopRail({ page, setPage }: { page: Page; setPage: (page: Page) => void }) {
  return (
    <aside className="glass-card sticky top-6 hidden h-[calc(100svh-3rem)] rounded-[2rem] p-3 lg:flex lg:flex-col lg:items-center lg:gap-2">
      {navItems.map((item) => (
        <button key={item.id} onClick={() => setPage(item.id)} className={`grid h-16 w-16 place-items-center rounded-2xl text-center transition ${page === item.id ? "bg-cyan-400 text-white shadow-xl" : "text-[var(--muted)] hover:bg-white/50 dark:hover:bg-white/10"}`}>
          <span className="text-xl leading-none">{item.icon}</span>
          <span className="text-[10px] font-black">{item.label}</span>
        </button>
      ))}
    </aside>
  );
}

function MobileNav({ page, setPage }: { page: Page; setPage: (page: Page) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[470px] px-4 pb-3 lg:hidden">
      <div className="glass-card safe-bottom grid grid-cols-5 items-center rounded-[2rem] px-3 py-3">
        {navItems.filter((item) => item.id !== "analytics").map((item) => (
          <button key={item.id} onClick={() => setPage(item.id)} className={`rounded-2xl px-1 py-2 text-center transition ${page === item.id ? "text-cyan-600 dark:text-cyan-300" : "text-slate-400"}`}>
            <div className="text-2xl leading-none">{item.icon}</div>
            <div className="mt-1 text-[10px] font-black">{item.label}</div>
          </button>
        ))}
      </div>
    </nav>
  );
}

function FloatingAdd({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label="Add subscription" className="gradient-button fixed bottom-10 left-1/2 z-50 grid h-16 w-16 -translate-x-1/2 place-items-center rounded-full text-4xl shadow-2xl lg:hidden">
      +
    </button>
  );
}

function Dashboard({ data, money, monthlyCost, yearlyCost, dueSoon, overdue, setPage, openAdd, promptInstall }: { data: SubSyncData; money: Intl.NumberFormat; monthlyCost: number; yearlyCost: number; dueSoon: Subscription[]; overdue: Subscription[]; setPage: (page: Page) => void; openAdd: () => void; promptInstall: () => void }) {
  const active = data.subscriptions.filter((subscription) => subscription.status === "active");
  const categoryTotals = getCategoryTotals(data.subscriptions);
  return (
    <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
      <section className="space-y-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden rounded-[2.25rem] p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-200/60 to-violet-200/60 p-1 shadow-xl ring-2 ring-white/60 dark:from-cyan-500/10 dark:to-violet-500/10 dark:ring-white/5">
                <img src="/avatar-ola.png" alt="Animated boy avatar for Ola" className="h-full w-full rounded-xl object-cover" />
              </div>
              <div>
                <p className="text-lg font-black">Hi, Ola 👋</p>
                <h2 className="mt-1 text-3xl font-black tracking-tight">Welcome back, Ola 💳</h2>
                <p className="mt-2 max-w-sm text-sm font-medium leading-6 text-[var(--muted)]">Your subscriptions are synced locally and ready offline. {overdue.length ? `${overdue.length} overdue alert needs attention.` : "Everything looks calm today."}</p>
              </div>
            </div>
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity }} className="hidden h-24 w-24 shrink-0 rounded-[2rem] bg-gradient-to-br from-cyan-200 via-white to-violet-200 p-3 shadow-xl dark:from-cyan-500/20 dark:via-white/10 dark:to-violet-500/20 sm:block">
              <div className="grid h-full place-items-center rounded-[1.5rem] bg-white/70 text-4xl dark:bg-white/10">💸</div>
            </motion.div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric title="Active" value={String(active.length)} label="Total Active Subscriptions" />
            <Metric title="Monthly" value={money.format(monthlyCost)} label="Monthly Subscription Cost" />
            <Metric title="Renewals" value={String(dueSoon.length + overdue.length)} label="Upcoming Renewals" />
            <Metric title="This Week" value={String(dueSoon.length)} label="Due This Week" />
          </div>
        </motion.div>

        <div className="grid gap-4 lg:grid-cols-2">
          <SpendingCard money={money} monthlyCost={monthlyCost} yearlyCost={yearlyCost} />
          <CategoryCard totals={categoryTotals} money={money} />
        </div>

        <section className="soft-card rounded-[2rem] p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black">Quick Actions</h3>
              <p className="text-sm text-[var(--muted)]">Fast moves for Ola’s subscription stack.</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ActionButton icon="＋" label="Add Sub" onClick={openAdd} />
            <ActionButton icon="🔎" label="Search" onClick={() => setPage("subscriptions")} />
            <ActionButton icon="📅" label="Calendar" onClick={() => setPage("calendar")} />
            <ActionButton icon="⬇" label="Install" onClick={promptInstall} />
          </div>
        </section>
      </section>

      <aside className="space-y-4">
        <RenewalList title="Upcoming Renewals" subscriptions={[...overdue, ...dueSoon].slice(0, 5)} money={money} empty="No renewals this week." />
        <RecentActivity activity={data.activity} />
        <FavoriteStack subscriptions={data.subscriptions.filter((subscription) => subscription.favorite)} money={money} />
      </aside>
    </div>
  );
}

function Metric({ title, value, label }: { title: string; value: string; label: string }) {
  return (
    <motion.div whileHover={{ y: -3 }} className="rounded-3xl border border-white/40 bg-white/55 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">{title}</p>
      <p className="mt-2 truncate text-2xl font-black tabular">{value}</p>
      <p className="mt-1 text-xs font-semibold leading-4 text-[var(--muted)]">{label}</p>
    </motion.div>
  );
}

function SpendingCard({ money, monthlyCost, yearlyCost }: { money: Intl.NumberFormat; monthlyCost: number; yearlyCost: number }) {
  const points = [0.42, 0.5, 0.38, 0.68, 0.56, 0.8, 0.72].map((value, index) => `${index * 52},${120 - value * 100}`).join(" ");
  return (
    <section className="soft-card overflow-hidden rounded-[2rem] p-5">
      <p className="text-sm font-bold text-[var(--muted)]">Monthly Spending Chart</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <h3 className="text-4xl font-black tracking-tight tabular">{money.format(monthlyCost)}</h3>
        <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-600 dark:text-emerald-300">+4.8%</span>
      </div>
      <svg viewBox="0 0 312 138" className="mt-4 h-36 w-full overflow-visible">
        <defs>
          <linearGradient id="lineGradient" x1="0" x2="1" y1="0" y2="0">
            <stop stopColor="#59c4cb" />
            <stop offset="1" stopColor="#7c6df2" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="#59c4cb" stopOpacity="0.32" />
            <stop offset="1" stopColor="#59c4cb" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={`0,124 ${points} 312,42 312,138 0,138`} fill="url(#areaGradient)" />
        <polyline points={points} fill="none" stroke="url(#lineGradient)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6" />
        <circle cx="156" cy="52" r="7" fill="white" stroke="#59c4cb" strokeWidth="4" />
      </svg>
      <div className="flex justify-between text-xs font-bold text-[var(--muted)]"><span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span></div>
      <p className="mt-4 rounded-2xl bg-cyan-400/10 p-3 text-sm font-bold text-cyan-700 dark:text-cyan-200">Estimated yearly cost: {money.format(yearlyCost)}</p>
    </section>
  );
}

function CategoryCard({ totals, money }: { totals: { category: Category; total: number; color: string }[]; money: Intl.NumberFormat }) {
  const sum = totals.reduce((value, item) => value + item.total, 0) || 1;
  let start = 0;
  const gradient = totals.map((item) => {
    const end = start + (item.total / sum) * 100;
    const segment = `${item.color} ${start}% ${end}%`;
    start = end;
    return segment;
  }).join(", ");
  return (
    <section className="soft-card rounded-[2rem] p-5">
      <h3 className="text-xl font-black">Category Breakdown</h3>
      <div className="mt-5 grid grid-cols-[132px_1fr] items-center gap-5">
        <div className="grid h-32 w-32 place-items-center rounded-full" style={{ background: `conic-gradient(${gradient || "#59c4cb 0 100%"})` }}>
          <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--app-bg)] text-sm font-black">{totals.length}</div>
        </div>
        <div className="space-y-3">
          {totals.slice(0, 4).map((item) => (
            <div key={item.category} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 font-bold"><span className="h-3 w-3 rounded-full" style={{ background: item.color }} />{item.category}</span>
              <span className="font-black tabular">{money.format(item.total)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ActionButton({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.96 }} onClick={onClick} className="rounded-3xl border border-white/40 bg-white/55 p-4 text-left shadow-sm dark:border-white/10 dark:bg-white/5">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400/15 text-xl text-cyan-700 dark:text-cyan-200">{icon}</span>
      <span className="mt-3 block text-sm font-black">{label}</span>
    </motion.button>
  );
}

function RenewalList({ title, subscriptions, money, empty }: { title: string; subscriptions: Subscription[]; money: Intl.NumberFormat; empty: string }) {
  return (
    <section className="soft-card rounded-[2rem] p-5">
      <h3 className="text-xl font-black">{title}</h3>
      <div className="mt-4 space-y-3">
        {subscriptions.length === 0 ? <EmptyMini text={empty} /> : subscriptions.map((subscription) => <MiniSubCard key={subscription.id} subscription={subscription} money={money} />)}
      </div>
    </section>
  );
}

function MiniSubCard({ subscription, money }: { subscription: Subscription; money: Intl.NumberFormat }) {
  const days = daysUntil(subscription.renewalDate);
  const message = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `${days}d left`;
  return (
    <div className="flex items-center gap-3 rounded-3xl bg-white/55 p-3 dark:bg-white/5">
      <Logo subscription={subscription} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-black">{subscription.serviceName}</p>
        <p className="text-xs font-semibold text-[var(--muted)]">{subscription.plan} · {money.format(subscription.amount)}</p>
      </div>
      <div className={`rounded-full px-3 py-1 text-xs font-black ${days < 0 ? "bg-red-500/15 text-red-600 dark:text-red-300" : "bg-cyan-400/15 text-cyan-700 dark:text-cyan-200"}`}>{message}</div>
    </div>
  );
}

function RecentActivity({ activity }: { activity: Activity[] }) {
  return (
    <section className="soft-card rounded-[2rem] p-5">
      <h3 className="text-xl font-black">Recent Activity</h3>
      <div className="mt-4 space-y-3">
        {activity.map((item) => (
          <div key={item.id} className="flex gap-3 rounded-3xl bg-white/45 p-3 dark:bg-white/5">
            <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.tone === "success" ? "bg-emerald-400" : item.tone === "warning" ? "bg-amber-400" : "bg-cyan-400"}`} />
            <div>
              <p className="text-sm font-bold">{item.text}</p>
              <p className="text-xs text-[var(--muted)]">{compactDate(item.time)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FavoriteStack({ subscriptions, money }: { subscriptions: Subscription[]; money: Intl.NumberFormat }) {
  return (
    <section className="soft-card rounded-[2rem] p-5">
      <h3 className="text-xl font-black">Favorites</h3>
      <div className="mt-4 flex -space-x-3">
        {subscriptions.slice(0, 6).map((subscription) => <Logo key={subscription.id} subscription={subscription} size="sm" />)}
      </div>
      <p className="mt-4 text-sm font-bold text-[var(--muted)]">{subscriptions.length ? `${subscriptions.length} favorite subscriptions total ${money.format(subscriptions.reduce((sum, subscription) => sum + monthlyAmount(subscription), 0))}/mo.` : "Mark favorites for quick access."}</p>
    </section>
  );
}

function SubscriptionsPage({ data, money, onEdit, onDelete, onFavorite }: { data: SubSyncData; money: Intl.NumberFormat; onEdit: (subscription: Subscription) => void; onDelete: (id: string, name: string) => void; onFavorite: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"All" | Category>("All");
  const [cycle, setCycle] = useState<"All" | BillingCycle>("All");
  const [status, setStatus] = useState<"All" | Status>("All");
  const [favorites, setFavorites] = useState(false);
  const [sort, setSort] = useState("renewal");
  const filtered = useMemo(() => {
    return data.subscriptions
      .filter((subscription) => subscription.serviceName.toLowerCase().includes(search.toLowerCase()))
      .filter((subscription) => category === "All" || subscription.category === category)
      .filter((subscription) => cycle === "All" || subscription.billingCycle === cycle)
      .filter((subscription) => status === "All" || subscription.status === status)
      .filter((subscription) => !favorites || subscription.favorite)
      .sort((a, b) => {
        if (sort === "amount") return b.amount - a.amount;
        if (sort === "name") return a.serviceName.localeCompare(b.serviceName);
        return parseDate(a.renewalDate).getTime() - parseDate(b.renewalDate).getTime();
      });
  }, [data.subscriptions, search, category, cycle, status, favorites, sort]);

  return (
    <div className="space-y-4">
      <section className="glass-card rounded-[2rem] p-5">
        <h2 className="text-3xl font-black tracking-tight">My Subscriptions</h2>
        <p className="mt-1 text-sm font-medium text-[var(--muted)]">Search, filter, sort, edit, pause, favorite, or cancel every plan.</p>
        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_180px]">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by service name" className="input-shell h-13 rounded-2xl px-4 font-bold" />
          <select value={sort} onChange={(event) => setSort(event.target.value)} className="input-shell h-13 rounded-2xl px-4 font-bold">
            <option value="renewal">Sort: Renewal date</option>
            <option value="amount">Sort: Amount</option>
            <option value="name">Sort: Service name</option>
          </select>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          <Pill active={category === "All"} onClick={() => setCategory("All")}>All</Pill>
          {categories.map((item) => <Pill key={item} active={category === item} onClick={() => setCategory(item)}>{item}</Pill>)}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <select value={cycle} onChange={(event) => setCycle(event.target.value as "All" | BillingCycle)} className="input-shell h-12 rounded-2xl px-3 text-sm font-bold"><option>All</option>{cycles.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={status} onChange={(event) => setStatus(event.target.value as "All" | Status)} className="input-shell h-12 rounded-2xl px-3 text-sm font-bold"><option>All</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select>
          <button onClick={() => setFavorites((current) => !current)} className={`h-12 rounded-2xl px-3 text-sm font-black ${favorites ? "gradient-button" : "input-shell"}`}>★ Favorites</button>
          <button onClick={() => { setSearch(""); setCategory("All"); setCycle("All"); setStatus("All"); setFavorites(false); }} className="input-shell h-12 rounded-2xl px-3 text-sm font-black">Reset</button>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <AnimatePresence initial={false}>
          {filtered.map((subscription) => (
            <motion.article key={subscription.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="soft-card rounded-[2rem] p-4">
              <div className="flex items-start gap-4">
                <Logo subscription={subscription} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="truncate text-xl font-black">{subscription.serviceName}</h3>
                      <p className="font-semibold text-[var(--muted)]">{subscription.plan}</p>
                    </div>
                    <button onClick={() => onFavorite(subscription.id)} className="text-2xl">{subscription.favorite ? "★" : "☆"}</button>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Chip tone={subscription.status === "active" ? "green" : subscription.status === "paused" ? "amber" : "slate"}>{subscription.status}</Chip>
                    <Chip>{subscription.category}</Chip>
                    <Chip>{subscription.billingCycle}</Chip>
                  </div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 rounded-3xl bg-white/45 p-3 dark:bg-white/5">
                <div><p className="text-xs font-bold text-[var(--muted)]">Amount</p><p className="text-2xl font-black tabular">{money.format(subscription.amount)}</p></div>
                <div><p className="text-xs font-bold text-[var(--muted)]">Renewal</p><p className="text-lg font-black">{compactDate(subscription.renewalDate)}</p></div>
                <div><p className="text-xs font-bold text-[var(--muted)]">Payment</p><p className="truncate text-sm font-bold">{subscription.paymentMethod}</p></div>
                <div><p className="text-xs font-bold text-[var(--muted)]">Reminder</p><p className="text-sm font-bold">{subscription.reminderDays.join("d, ")}d</p></div>
              </div>
              {subscription.notes && <p className="mt-3 text-sm font-medium leading-6 text-[var(--muted)]">{subscription.notes}</p>}
              <div className="mt-4 flex gap-2">
                <button onClick={() => onEdit(subscription)} className="h-12 flex-1 rounded-2xl bg-cyan-400/15 font-black text-cyan-700 dark:text-cyan-200">Edit</button>
                <button onClick={() => onDelete(subscription.id, subscription.serviceName)} className="h-12 flex-1 rounded-2xl bg-red-500/10 font-black text-red-600 dark:text-red-300">Delete</button>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </section>
      {filtered.length === 0 && <EmptyState title="No subscriptions found" text="Try another search term or clear filters to see Ola’s subscriptions." icon="🔎" />}
    </div>
  );
}

function CalendarPage({ data, money, openAdd }: { data: SubSyncData; money: Intl.NumberFormat; openAdd: () => void }) {
  const [cursor, setCursor] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  const monthSubs = data.subscriptions.filter((subscription) => parseDate(subscription.renewalDate).getMonth() === month && parseDate(subscription.renewalDate).getFullYear() === year);
  const weekSubs = data.subscriptions.filter((subscription) => daysUntil(subscription.renewalDate) >= 0 && daysUntil(subscription.renewalDate) <= 7);
  const go = (offset: number) => setCursor(new Date(year, month + offset, 1));
  const renewalsForDay = (day: number) => monthSubs.filter((subscription) => parseDate(subscription.renewalDate).getDate() === day);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.72fr]">
      <section className="glass-card rounded-[2rem] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-3xl font-black tracking-tight">Renewal Calendar</h2>
            <p className="text-sm text-[var(--muted)]">Visual indicators show upcoming payments.</p>
          </div>
          <button onClick={openAdd} className="gradient-button h-12 rounded-2xl px-4 font-black">Add</button>
        </div>
        <div className="mt-5 rounded-[2rem] bg-white/55 p-4 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <button onClick={() => go(-1)} className="grid h-11 w-11 place-items-center rounded-2xl bg-white/70 text-2xl dark:bg-white/10">‹</button>
            <h3 className="text-xl font-black">{monthLabel}</h3>
            <button onClick={() => go(1)} className="grid h-11 w-11 place-items-center rounded-2xl bg-white/70 text-2xl dark:bg-white/10">›</button>
          </div>
          <div className="calendar-grid mt-5 gap-2 text-center text-sm font-black text-[var(--muted)]">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <div key={day}>{day}</div>)}</div>
          <div className="calendar-grid mt-3 gap-2">
            {cells.map((day, index) => {
              const renewals = typeof day === "number" ? renewalsForDay(day) : [];
              const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
              return (
                <div key={`${day}-${index}`} className={`min-h-16 rounded-2xl p-2 text-center ${isToday ? "bg-cyan-400 text-white" : "bg-white/45 dark:bg-white/5"}`}>
                  <span className="text-sm font-black">{day ?? ""}</span>
                  <div className="mt-1 flex justify-center gap-1">
                    {renewals.slice(0, 3).map((subscription) => <span key={subscription.id} className={`h-1.5 w-1.5 rounded-full ${isToday ? "bg-white" : "bg-cyan-500"}`} />)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <aside className="space-y-4">
        <RenewalList title="Week’s Renewals" subscriptions={weekSubs} money={money} empty="No renewals due this week." />
        <RenewalList title="This Month" subscriptions={monthSubs} money={money} empty="No renewals this month." />
      </aside>
    </div>
  );
}

function AnalyticsPage({ data, money, monthlyCost, yearlyCost }: { data: SubSyncData; money: Intl.NumberFormat; monthlyCost: number; yearlyCost: number }) {
  const expensive = [...data.subscriptions].filter((subscription) => subscription.status === "active").sort((a, b) => monthlyAmount(b) - monthlyAmount(a)).slice(0, 4);
  const totals = getCategoryTotals(data.subscriptions);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SpendingCard money={money} monthlyCost={monthlyCost} yearlyCost={yearlyCost} />
      <CategoryCard totals={totals} money={money} />
      <section className="soft-card rounded-[2rem] p-5">
        <h2 className="text-2xl font-black">Most Expensive Subscriptions</h2>
        <div className="mt-4 space-y-3">
          {expensive.map((subscription, index) => (
            <div key={subscription.id} className="flex items-center gap-3 rounded-3xl bg-white/50 p-3 dark:bg-white/5">
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-violet-400/15 font-black text-violet-600 dark:text-violet-200">{index + 1}</span>
              <Logo subscription={subscription} size="sm" />
              <div className="min-w-0 flex-1"><p className="truncate font-black">{subscription.serviceName}</p><p className="text-xs text-[var(--muted)]">{subscription.category}</p></div>
              <p className="font-black tabular">{money.format(monthlyAmount(subscription))}/mo</p>
            </div>
          ))}
        </div>
      </section>
      <section className="soft-card rounded-[2rem] p-5">
        <h2 className="text-2xl font-black">Yearly Estimate</h2>
        <p className="mt-2 text-5xl font-black tracking-tight tabular">{money.format(yearlyCost)}</p>
        <p className="mt-2 text-sm font-bold text-[var(--muted)]">Based on active weekly, monthly, quarterly, and yearly plans.</p>
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Ring label="Budget" value={62} />
          <Ring label="Annual" value={74} />
          <Ring label="Savings" value={38} />
        </div>
      </section>
    </div>
  );
}

function Ring({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="mx-auto grid h-24 w-24 place-items-center rounded-full" style={{ background: `conic-gradient(#59c4cb 0 ${value}%, rgba(148,163,184,.25) ${value}% 100%)` }}>
        <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--app-bg)] text-xl font-black">{value}%</div>
      </div>
      <p className="mt-2 text-sm font-black">{label}</p>
    </div>
  );
}

function RemindersPage({ data, money, dueSoon, overdue }: { data: SubSyncData; money: Intl.NumberFormat; dueSoon: Subscription[]; overdue: Subscription[] }) {
  const allReminders = [...overdue, ...dueSoon, ...data.subscriptions.filter((subscription) => daysUntil(subscription.renewalDate) > 7).slice(0, 3)];
  return (
    <div className="space-y-4">
      <section className="glass-card rounded-[2rem] p-5">
        <h2 className="text-3xl font-black tracking-tight">Alerts & Reminders</h2>
        <p className="mt-1 text-sm font-medium text-[var(--muted)]">Upcoming renewal reminders, overdue payment alerts, and recurring notifications.</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Metric title="Overdue" value={String(overdue.length)} label="Payment alerts" />
          <Metric title="Due Soon" value={String(dueSoon.length)} label="Next 7 days" />
        </div>
      </section>
      <section className="grid gap-3 lg:grid-cols-2">
        {allReminders.map((subscription) => {
          const days = daysUntil(subscription.renewalDate);
          return (
            <motion.article key={subscription.id} whileHover={{ y: -3 }} className="soft-card rounded-[2rem] p-4">
              <div className="flex items-center gap-4">
                <Logo subscription={subscription} />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-xl font-black">{subscription.serviceName}</h3>
                  <p className="font-semibold text-[var(--muted)]">{days < 0 ? `Overdue by ${Math.abs(days)} days` : days === 0 ? "Due today" : `Due in ${days} days`} · {money.format(subscription.amount)}</p>
                </div>
                <span className="text-2xl">🔔</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Chip tone={days < 0 ? "red" : days <= 3 ? "amber" : "blue"}>{days < 0 ? "Overdue alerts" : "Renewal alert"}</Chip>
                <Chip>{subscription.reminderDays.map((day) => `${day}d`).join(" · ")}</Chip>
                <Chip>{subscription.paymentMethod}</Chip>
              </div>
            </motion.article>
          );
        })}
      </section>
    </div>
  );
}

function ProfilePage({ data, updateSettings, exportData, importData, promptInstall, showToast }: { data: SubSyncData; updateSettings: (settings: Partial<Settings>) => void; exportData: () => void; importData: (file: File) => void; promptInstall: () => void; showToast: (message: string, tone?: Toast["tone"]) => void }) {
  const resetDemo = () => {
    localStorage.removeItem(DATA_KEY);
    window.location.reload();
  };
  return (
    <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <section className="space-y-4">
        <div className="glass-card rounded-[2rem] p-5 text-center">
          <div className="mx-auto h-28 w-28 overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-cyan-200/60 to-violet-200/60 p-1 shadow-xl ring-4 ring-white/50 dark:from-cyan-500/10 dark:to-violet-500/10 dark:ring-white/5">
            <img src="/avatar-ola.png" alt="Animated boy avatar for Ola" className="h-full w-full rounded-[1.35rem] object-cover" />
          </div>
          <h2 className="mt-4 text-3xl font-black">Ola</h2>
          <p className="text-sm font-bold text-[var(--muted)]">Premium subscription command center</p>
          <button onClick={promptInstall} className="gradient-button mt-5 h-12 w-full rounded-2xl font-black">Install SubSync PWA</button>
          <p className="mt-3 text-xs leading-5 text-[var(--muted)]">iPhone Safari: tap Share → Add to Home Screen for the best app-like experience.</p>
        </div>
        <section className="soft-card rounded-[2rem] p-5">
          <h3 className="text-xl font-black">About SubSync</h3>
          <p className="mt-2 text-sm font-medium leading-6 text-[var(--muted)]">SubSync stores data locally with the versioned key <span className="font-black">subsync.data.v1</span>, works offline after the first visit, and never sends Ola’s subscription details to a server.</p>
        </section>
      </section>

      <section className="soft-card rounded-[2rem] p-5">
        <h2 className="text-3xl font-black tracking-tight">Profile & Settings</h2>
        <div className="mt-5 divide-y divide-[var(--line)] overflow-hidden rounded-[2rem] bg-white/45 dark:bg-white/5">
          <SettingRow icon="☾" title="Theme customization">
            <select value={data.settings.theme} onChange={(event) => updateSettings({ theme: event.target.value as Settings["theme"] })} className="input-shell h-11 rounded-2xl px-3 font-bold">
              <option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option>
            </select>
          </SettingRow>
          <SettingRow icon="◎" title="Currency selection">
            <select value={data.settings.currency} onChange={(event) => updateSettings({ currency: event.target.value as Currency })} className="input-shell h-11 rounded-2xl px-3 font-bold">
              {(["USD", "EUR", "GBP", "NGN", "CAD"] as Currency[]).map((currency) => <option key={currency}>{currency}</option>)}
            </select>
          </SettingRow>
          <SettingRow icon="🔔" title="Notifications">
            <Toggle checked={data.settings.notifications} onChange={(checked) => updateSettings({ notifications: checked })} />
          </SettingRow>
          <SettingRow icon="↻" title="Renewal reminders">
            <Toggle checked={data.settings.renewalAlerts} onChange={(checked) => updateSettings({ renewalAlerts: checked })} />
          </SettingRow>
          <SettingRow icon="⚠" title="Budget alerts">
            <Toggle checked={data.settings.budgetAlerts} onChange={(checked) => updateSettings({ budgetAlerts: checked })} />
          </SettingRow>
          <SettingRow icon="⇩" title="Export data"><button onClick={exportData} className="h-11 rounded-2xl bg-cyan-400/15 px-4 font-black text-cyan-700 dark:text-cyan-200">Export</button></SettingRow>
          <SettingRow icon="⇧" title="Import data"><label className="h-11 rounded-2xl bg-violet-400/15 px-4 py-3 text-sm font-black text-violet-700 dark:text-violet-200">Import<input type="file" accept="application/json" className="hidden" onChange={(event) => event.target.files?.[0] && importData(event.target.files[0])} /></label></SettingRow>
          <SettingRow icon="✦" title="Success/error toasts"><button onClick={() => showToast("This is a polished SubSync toast ✨", "success")} className="h-11 rounded-2xl bg-emerald-400/15 px-4 font-black text-emerald-700 dark:text-emerald-200">Test</button></SettingRow>
          <SettingRow icon="⟲" title="Restore demo data"><button onClick={resetDemo} className="h-11 rounded-2xl bg-red-500/10 px-4 font-black text-red-600 dark:text-red-300">Reset</button></SettingRow>
        </div>
      </section>
    </div>
  );
}

function SettingRow({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/70 text-lg dark:bg-white/10">{icon}</span>
        <span className="font-black">{title}</span>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className={`flex h-9 w-16 items-center rounded-full p-1 transition ${checked ? "bg-cyan-400" : "bg-slate-300 dark:bg-slate-700"}`}>
      <motion.span layout className="h-7 w-7 rounded-full bg-white shadow-lg" animate={{ x: checked ? 28 : 0 }} transition={{ type: "spring", stiffness: 520, damping: 32 }} />
    </button>
  );
}

function SubscriptionModal({ subscription, onClose, onSave }: { subscription: Subscription | null; onClose: () => void; onSave: (draft: DraftSubscription, id?: string) => void }) {
  const [draft, setDraft] = useState<DraftSubscription>(() => subscription ? { ...subscription } : defaultDraft());
  const set = <K extends keyof DraftSubscription>(key: K, value: DraftSubscription[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.serviceName.trim()) return;
    onSave({ ...draft, serviceName: draft.serviceName.trim(), logoText: draft.logoText.trim().slice(0, 3) || draft.serviceName.slice(0, 1).toUpperCase() }, subscription?.id);
  };
  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("logoDataUrl", String(reader.result));
    reader.readAsDataURL(file);
  };
  return (
    <motion.div className="fixed inset-0 z-[70] grid place-items-end bg-slate-950/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.form onSubmit={submit} initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} className="glass-card safe-bottom max-h-[92svh] w-full max-w-2xl overflow-y-auto rounded-t-[2.25rem] p-5 sm:rounded-[2.25rem]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-3xl font-black tracking-tight">{subscription ? "Edit Subscription" : "Add Subscription"}</h2>
          <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-slate-200 text-2xl dark:bg-white/10">×</button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Field label="Service name"><input required value={draft.serviceName} onChange={(event) => set("serviceName", event.target.value)} placeholder="Netflix" className="input-shell h-13 rounded-2xl px-4 font-bold" /></Field>
          <Field label="Plan"><input value={draft.plan} onChange={(event) => set("plan", event.target.value)} placeholder="Premium" className="input-shell h-13 rounded-2xl px-4 font-bold" /></Field>
          <Field label="Category"><select value={draft.category} onChange={(event) => set("category", event.target.value as Category)} className="input-shell h-13 rounded-2xl px-4 font-bold">{categories.map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Billing cycle"><select value={draft.billingCycle} onChange={(event) => set("billingCycle", event.target.value as BillingCycle)} className="input-shell h-13 rounded-2xl px-4 font-bold">{cycles.map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Amount"><input type="number" min="0" step="0.01" value={draft.amount} onChange={(event) => set("amount", Number(event.target.value))} className="input-shell h-13 rounded-2xl px-4 font-bold" /></Field>
          <Field label="Renewal date"><input type="date" value={draft.renewalDate} onChange={(event) => set("renewalDate", event.target.value)} className="input-shell h-13 rounded-2xl px-4 font-bold" /></Field>
          <Field label="Payment method"><input value={draft.paymentMethod} onChange={(event) => set("paymentMethod", event.target.value)} className="input-shell h-13 rounded-2xl px-4 font-bold" /></Field>
          <Field label="Status"><select value={draft.status} onChange={(event) => set("status", event.target.value as Status)} className="input-shell h-13 rounded-2xl px-4 font-bold">{statuses.map((item) => <option key={item}>{item}</option>)}</select></Field>
        </div>

        <div className="mt-5 rounded-[2rem] bg-white/45 p-4 dark:bg-white/5">
          <p className="text-sm font-black">Upload or choose subscription logo</p>
          <div className="mt-4 flex items-center gap-3 overflow-x-auto pb-1">
            {logoPresets.map((preset) => (
              <button type="button" key={preset.name} onClick={() => setDraft((current) => ({ ...current, logoText: preset.text, logoGradient: preset.gradient, logoDataUrl: undefined, serviceName: current.serviceName || preset.name }))} className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${preset.gradient} text-lg font-black text-white shadow-lg`}>{preset.text}</button>
            ))}
            <label className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-dashed border-cyan-400 text-xl font-black text-cyan-600">↑<input type="file" accept="image/*" className="hidden" onChange={handleUpload} /></label>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[90px_1fr_1fr]">
            <div className="grid place-items-center"><Logo subscription={{ serviceName: draft.serviceName || "Preview", logoText: draft.logoText, logoGradient: draft.logoGradient, logoDataUrl: draft.logoDataUrl }} /></div>
            <input value={draft.logoText} onChange={(event) => set("logoText", event.target.value)} placeholder="Logo text" className="input-shell h-13 rounded-2xl px-4 font-bold" />
            <label className="flex items-center gap-3 rounded-2xl bg-white/50 px-4 text-sm font-black dark:bg-white/5"><input type="checkbox" checked={draft.favorite} onChange={(event) => set("favorite", event.target.checked)} /> Mark favorite</label>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Field label="Reminder settings"><div className="grid grid-cols-4 gap-2">{[1, 3, 7, 14].map((day) => <button type="button" key={day} onClick={() => set("reminderDays", draft.reminderDays.includes(day) ? draft.reminderDays.filter((item) => item !== day) : [...draft.reminderDays, day].sort((a, b) => a - b))} className={`h-12 rounded-2xl font-black ${draft.reminderDays.includes(day) ? "gradient-button" : "input-shell"}`}>{day}d</button>)}</div></Field>
          <Field label="Notes"><textarea value={draft.notes} onChange={(event) => set("notes", event.target.value)} placeholder="Notes" className="input-shell min-h-28 rounded-2xl p-4 font-bold" /></Field>
        </div>
        <button type="submit" className="gradient-button mt-5 h-14 w-full rounded-2xl text-lg font-black">{subscription ? "Save Changes" : "Add Subscription"}</button>
      </motion.form>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-black text-[var(--muted)]">{label}{children}</label>;
}

function Logo({ subscription, size = "md" }: { subscription: Pick<Subscription, "logoText" | "logoGradient" | "logoDataUrl" | "serviceName">; size?: "sm" | "md" }) {
  const className = size === "sm" ? "h-12 w-12 rounded-2xl text-base" : "h-16 w-16 rounded-3xl text-xl";
  if (subscription.logoDataUrl) return <img src={subscription.logoDataUrl} alt={`${subscription.serviceName} logo`} className={`${className} object-cover shadow-lg`} />;
  return <div className={`${className} grid shrink-0 place-items-center bg-gradient-to-br ${subscription.logoGradient} font-black text-white shadow-lg`}>{subscription.logoText}</div>;
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={`shrink-0 rounded-full px-4 py-2 text-sm font-black transition ${active ? "bg-cyan-500 text-white shadow-lg" : "bg-white/55 text-[var(--text)] dark:bg-white/5"}`}>{children}</button>;
}

function Chip({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "green" | "amber" | "red" | "slate" }) {
  const colors = {
    blue: "bg-cyan-400/15 text-cyan-700 dark:text-cyan-200",
    green: "bg-emerald-400/15 text-emerald-700 dark:text-emerald-200",
    amber: "bg-amber-400/15 text-amber-700 dark:text-amber-200",
    red: "bg-red-500/15 text-red-600 dark:text-red-300",
    slate: "bg-slate-400/15 text-slate-600 dark:text-slate-200",
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-black capitalize ${colors[tone]}`}>{children}</span>;
}

function EmptyMini({ text }: { text: string }) {
  return <div className="rounded-3xl bg-white/45 p-4 text-center text-sm font-bold text-[var(--muted)] dark:bg-white/5">{text}</div>;
}

function EmptyState({ title, text, icon }: { title: string; text: string; icon: string }) {
  return (
    <section className="soft-card rounded-[2rem] p-8 text-center">
      <div className="text-6xl">{icon}</div>
      <h3 className="mt-4 text-2xl font-black">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-6 text-[var(--muted)]">{text}</p>
    </section>
  );
}

function ToastView({ toast }: { toast: Toast }) {
  const colors = toast.tone === "error" ? "bg-red-500" : toast.tone === "info" ? "bg-slate-900 dark:bg-white dark:text-slate-950" : "bg-emerald-500";
  return (
    <motion.div initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} className={`fixed left-1/2 top-5 z-[90] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl px-4 py-3 text-sm font-black text-white shadow-2xl ${colors}`}>
      {toast.message}
    </motion.div>
  );
}

function getCategoryTotals(subscriptions: Subscription[]) {
  const colors = ["#59c4cb", "#7c6df2", "#8be5cf", "#f0a6ca", "#8ec5ff", "#fbbf24", "#34d399", "#fb7185"];
  return categories
    .map((category, index) => ({ category, total: subscriptions.filter((subscription) => subscription.category === category).reduce((sum, subscription) => sum + monthlyAmount(subscription), 0), color: colors[index] }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);
}

export default App;
