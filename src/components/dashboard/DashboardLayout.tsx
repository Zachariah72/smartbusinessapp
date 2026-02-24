import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3, ShoppingCart, Upload, Users, Activity, Menu, X, Home,
  Target, Package, MessageSquare, Moon, Sun, LogOut, Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { icon: Activity, label: "Dashboard", path: "/dashboard" },
  { icon: ShoppingCart, label: "Orders", path: "/dashboard/orders" },
  { icon: Upload, label: "Upload Data", path: "/dashboard/upload" },
  { icon: Users, label: "Customers", path: "/dashboard/customers" },
  { icon: Package, label: "Products", path: "/dashboard/products" },
  { icon: Target, label: "Goals", path: "/dashboard/goals" },
  { icon: MessageSquare, label: "Assistant", path: "/dashboard/assistant" },
];

const THEME_STORAGE_KEY = "bia.theme";
const PROFILE_PHOTO_STORAGE_KEY = "bia.profile-photo";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const DashboardLayout = ({ children, title, subtitle }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const initialTheme = savedTheme === "dark" ? "dark" : "light";
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");

    const photo = localStorage.getItem(PROFILE_PHOTO_STORAGE_KEY) ?? "";
    setProfilePhoto(photo);
  }, []);

  useEffect(() => {
    const closeMenuOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", closeMenuOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeMenuOnOutsideClick);
  }, []);

  const setThemeMode = (mode: "light" | "dark") => {
    setTheme(mode);
    localStorage.setItem(THEME_STORAGE_KEY, mode);
    document.documentElement.classList.toggle("dark", mode === "dark");
  };

  const onProfileUpload = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = typeof reader.result === "string" ? reader.result : "";
      if (!data) return;
      setProfilePhoto(data);
      localStorage.setItem(PROFILE_PHOTO_STORAGE_KEY, data);
    };
    reader.readAsDataURL(file);
  };

  const handleSignOut = () => {
    localStorage.removeItem("bia.session");
    navigate("/");
  };

  return (
    <div className="min-h-screen app-shell-bg flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card/95 backdrop-blur-sm border-r border-border/80 transform transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static`}>
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center justify-between px-6 border-b border-border">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">Biz Insights Africa</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-border">
            <Link to="/">
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground">
                <Home className="w-4 h-4" /> Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="flex-1 min-w-0 relative">
        <div className="pointer-events-none absolute inset-0 grain-overlay opacity-40" />
        <header className="h-16 bg-card/90 backdrop-blur-sm border-b border-border/80 flex items-center justify-between px-4 lg:px-8 relative z-40">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-lg font-bold text-foreground">{title}</h1>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 relative" ref={menuRef}>
            <div className="hidden sm:block text-right mr-3">
              <p className="text-sm font-medium text-foreground">Mama Fua Shop</p>
              <p className="text-xs text-muted-foreground">The Calm Business OS</p>
            </div>
            <button
              className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary overflow-hidden"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Profile menu"
            >
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                "MF"
              )}
            </button>

            {menuOpen && (
              <div className="absolute top-12 right-0 w-64 surface-card p-3 space-y-3 z-[90]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Appearance</p>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant={theme === "light" ? "default" : "outline"}
                      className="h-7 px-2"
                      onClick={() => setThemeMode("light")}
                    >
                      <Sun className="w-3.5 h-3.5 mr-1" /> Light
                    </Button>
                    <Button
                      size="sm"
                      variant={theme === "dark" ? "default" : "outline"}
                      className="h-7 px-2"
                      onClick={() => setThemeMode("dark")}
                    >
                      <Moon className="w-3.5 h-3.5 mr-1" /> Dark
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Profile Picture</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-3.5 h-3.5 mr-1" /> Upload
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={(e) => onProfileUpload(e.target.files?.[0] ?? null)}
                  />
                </div>

                <Button
                  variant="destructive"
                  className="w-full h-8"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </Button>
              </div>
            )}
          </div>
        </header>
        <div className="p-3 sm:p-4 lg:p-8 relative z-10">
          <div className="page-frame p-3 sm:p-4 lg:p-6 fade-rise max-w-[1720px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
