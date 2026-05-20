import { Link, useLocation } from "wouter";
import { useCart } from "@/lib/cart";
import { useRestaurant } from "@/lib/restaurant-context";
import { useRestaurantPath } from "@/lib/use-slug";
import {
  ShoppingBag, Menu as MenuIcon, X, Phone, MapPin, Clock,
  Instagram, Facebook, Twitter, ArrowRight, Package, MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.14 8.14 0 004.77 1.52V6.77a4.86 4.86 0 01-1-.08z" />
    </svg>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { itemCount, total } = useCart();
  const [location] = useLocation();
  const { restaurant } = useRestaurant();
  const rpath = useRestaurantPath();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const name = restaurant?.name ?? "Terra";
  const logoUrl = (restaurant as any)?.logoUrl;
  const announcementEnabled = (restaurant as any)?.announcementEnabled ?? true;
  const announcementText = (restaurant as any)?.announcementText || "🎉 Free delivery on orders above Rs. 1,500 · Open daily 11am – 11pm";

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const navLinks = [
    { href: rpath("/menu"), label: "Our Menu", match: "/menu" },
    { href: rpath("/track-order"), label: "Track Order", match: "/track-order" },
    { href: rpath("/my-orders"), label: "My Orders", match: "/my-orders" },
  ];

  // Social links
  const instagramUrl = (restaurant as any)?.instagramUrl;
  const facebookUrl = (restaurant as any)?.facebookUrl;
  const twitterUrl = (restaurant as any)?.twitterUrl;
  const tiktokUrl = (restaurant as any)?.tiktokUrl;
  const whatsappNumber = (restaurant as any)?.whatsappNumber;
  const businessHours = (restaurant as any)?.businessHours || "Daily 11:00 AM – 11:00 PM";

  const socialLinks = [
    ...(instagramUrl ? [{ href: instagramUrl, Icon: Instagram, label: "Instagram", color: "hover:bg-pink-500" }] : []),
    ...(facebookUrl ? [{ href: facebookUrl, Icon: Facebook, label: "Facebook", color: "hover:bg-blue-600" }] : []),
    ...(twitterUrl ? [{ href: twitterUrl, Icon: Twitter, label: "Twitter / X", color: "hover:bg-sky-500" }] : []),
    ...(tiktokUrl ? [{ href: tiktokUrl, Icon: TikTokIcon, label: "TikTok", color: "hover:bg-zinc-600" }] : []),
    ...(whatsappNumber ? [{ href: `https://wa.me/${whatsappNumber}`, Icon: MessageCircle, label: "WhatsApp", color: "hover:bg-green-500" }] : []),
  ];

  // Fallback social links for demo (when no links are set, show placeholder icons that don't link anywhere)
  const hasSocialLinks = socialLinks.length > 0;
  const fallbackSocials = [
    { Icon: Instagram, label: "Instagram", color: "hover:bg-pink-500" },
    { Icon: Facebook, label: "Facebook", color: "hover:bg-blue-600" },
    { Icon: Twitter, label: "Twitter / X", color: "hover:bg-sky-500" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Announcement Bar ─────────────────────────────────────────────── */}
      {announcementEnabled && announcementText && (
        <div className="bg-primary text-primary-foreground text-center text-xs py-2.5 px-4 font-medium tracking-wide">
          {announcementText}
        </div>
      )}

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <header className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        scrolled
          ? "border-border/60 bg-background/95 backdrop-blur-md shadow-sm"
          : "border-border/20 bg-background"
      )}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8 min-w-0">
            <Link href={rpath("")} className="group shrink-0 flex items-center gap-2.5">
              {logoUrl ? (
                <>
                  <img
                    src={logoUrl}
                    alt={name}
                    className="h-9 w-9 object-contain rounded-lg"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                  <span className="font-serif text-xl font-bold text-primary group-hover:opacity-75 transition-opacity hidden sm:block">
                    {name}
                  </span>
                </>
              ) : (
                <span className="font-serif text-2xl font-bold text-primary group-hover:opacity-75 transition-opacity">
                  {name}
                </span>
              )}
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative py-1 transition-colors hover:text-primary whitespace-nowrap",
                    location.includes(link.match) ? "text-primary font-semibold" : "text-foreground/60"
                  )}
                >
                  {link.label}
                  {location.includes(link.match) && (
                    <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href={rpath("/checkout")}>
              <Button
                variant={itemCount > 0 ? "default" : "outline"}
                size="sm"
                className={cn(
                  "relative gap-2 transition-all duration-300",
                  itemCount > 0 && "shadow-sm shadow-primary/20"
                )}
              >
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {itemCount > 0 ? `${itemCount} item${itemCount > 1 ? "s" : ""}` : "Cart"}
                </span>
                {itemCount > 0 && (
                  <span className="sm:hidden absolute -top-2 -right-2 bg-white text-primary text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border border-primary/20 shadow-sm">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
              <MenuIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── Mobile Menu ──────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 max-w-full bg-background shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-2.5">
                {logoUrl && (
                  <img src={logoUrl} alt={name} className="h-8 w-8 object-contain rounded-lg" />
                )}
                <span className="font-serif text-2xl font-bold text-primary">{name}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 p-5 space-y-1 overflow-y-auto">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors",
                    location.includes(link.match)
                      ? "bg-primary/10 text-primary font-semibold"
                      : "hover:bg-muted text-foreground/70"
                  )}
                >
                  {link.label}
                  <ArrowRight className="ml-auto h-4 w-4 opacity-40" />
                </Link>
              ))}
              <Link
                href={rpath("/my-orders")}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-foreground/70 hover:bg-muted transition-colors"
              >
                <Package className="h-4 w-4" />
                My Orders
                <ArrowRight className="ml-auto h-4 w-4 opacity-40" />
              </Link>
            </nav>
            {itemCount > 0 && (
              <div className="p-5 border-t bg-muted/30">
                <div className="flex items-center justify-between mb-3 text-sm text-muted-foreground">
                  <span>{itemCount} item{itemCount > 1 ? "s" : ""} in cart</span>
                  <span className="font-semibold text-foreground">Rs {total.toLocaleString("en-PK")}</span>
                </div>
                <Link href={rpath("/checkout")}>
                  <Button className="w-full gap-2 rounded-xl" size="lg">
                    <ShoppingBag className="h-4 w-4" />
                    Checkout
                  </Button>
                </Link>
              </div>
            )}
            {itemCount === 0 && (
              <div className="p-5 border-t">
                <Link href={rpath("/checkout")}>
                  <Button className="w-full gap-2" variant="outline" size="lg">
                    <ShoppingBag className="h-4 w-4" />
                    View Cart
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <main className="flex-1">{children}</main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-zinc-950 text-zinc-300 mt-16">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                {logoUrl ? (
                  <img src={logoUrl} alt={name} className="h-10 w-10 object-contain rounded-xl bg-white/10 p-1" />
                ) : null}
                <span className="font-serif text-2xl font-bold text-white">{name}</span>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                {restaurant?.description || "Authentic flavors crafted with passion and the finest local ingredients."}
              </p>
              {/* Social icons */}
              <div className="flex flex-wrap gap-2">
                {hasSocialLinks ? (
                  socialLinks.map(({ href, Icon, label, color }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className={cn(
                        "w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center transition-all duration-200 hover:scale-110",
                        color
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  ))
                ) : (
                  fallbackSocials.map(({ Icon, label, color }) => (
                    <button
                      key={label}
                      aria-label={label}
                      className={cn(
                        "w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center transition-all duration-200 hover:scale-110",
                        color
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Menu Links */}
            <div>
              <h4 className="font-semibold mb-5 text-white text-sm uppercase tracking-widest">Menu</h4>
              <ul className="space-y-3 text-sm text-zinc-400">
                {["Burgers", "Pizza", "Deals", "Sides", "Drinks"].map((cat) => (
                  <li key={cat}>
                    <Link href={rpath("/menu")} className="hover:text-primary transition-colors">{cat}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-5 text-white text-sm uppercase tracking-widest">Quick Links</h4>
              <ul className="space-y-3 text-sm text-zinc-400">
                <li><Link href={rpath("/menu")} className="hover:text-primary transition-colors">Our Menu</Link></li>
                <li><Link href={rpath("/track-order")} className="hover:text-primary transition-colors">Track Your Order</Link></li>
                <li><Link href={rpath("/my-orders")} className="hover:text-primary transition-colors">My Orders</Link></li>
                <li><Link href={rpath("/checkout")} className="hover:text-primary transition-colors">Cart & Checkout</Link></li>
                <li><Link href={rpath("/admin/login")} className="hover:text-primary transition-colors">Admin Login</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-5 text-white text-sm uppercase tracking-widest">Contact & Hours</h4>
              <ul className="space-y-4 text-sm text-zinc-400">
                {restaurant?.phone && (
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <a href={`tel:${restaurant.phone}`} className="hover:text-primary transition-colors">{restaurant.phone}</a>
                  </li>
                )}
                {restaurant?.address && (
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span>{restaurant.address}</span>
                  </li>
                )}
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span>{businessHours}</span>
                </li>
                {whatsappNumber && (
                  <li>
                    <a
                      href={`https://wa.me/${whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 px-3 py-1.5 rounded-full transition-colors"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Chat on WhatsApp
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
            <span>© {new Date().getFullYear()} {name}. All rights reserved.</span>
            <span>Powered by Terra — Professional Food Ordering Platform</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
