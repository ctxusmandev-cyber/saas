import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useListCategories, useListItems } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import {
  ArrowRight, Utensils, Star, Leaf, Clock, Shield, Quote,
  Bike, ChefHat, CheckCircle2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRestaurantPath } from "@/lib/use-slug";
import { useRestaurant } from "@/lib/restaurant-context";
import { useCart } from "@/lib/cart";
import { Badge } from "@/components/ui/badge";
import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const WHY_US = [
  { icon: Leaf,       title: "Farm Fresh",    desc: "Locally sourced, seasonal ingredients from trusted farmers." },
  { icon: Clock,      title: "Fast Delivery", desc: "Hot meals delivered to your door in 30–45 minutes." },
  { icon: ChefHat,    title: "Chef Crafted",  desc: "Every dish designed and approved by our head chef." },
  { icon: Shield,     title: "Safe & Hygienic", desc: "Prepared in a certified kitchen with the highest standards." },
];

const TESTIMONIALS = [
  { name: "Ayesha R.",  stars: 5, text: "Absolutely amazing food! The Smash Burger is out of this world. Fast delivery and everything arrived piping hot.", location: "DHA, Lahore" },
  { name: "Usman K.",   stars: 5, text: "Been ordering every Friday for a month. Quality never drops. The deals are genuinely great value — Party Platter is a must!", location: "Gulberg, Lahore" },
  { name: "Fatima M.",  stars: 5, text: "The Chicken Tikka Pizza is something else — I've had it from everywhere but this hits differently. Highly recommend.", location: "Bahria Town" },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn("h-4 w-4", i < count ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
      ))}
    </div>
  );
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function FadeIn({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView();
  return (
    <section
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </section>
  );
}

export default function Home() {
  const { data: categories, isLoading: isLoadingCategories } = useListCategories();
  const { data: featuredItems, isLoading: isLoadingItems } = useListItems({ featured: true });
  const rpath = useRestaurantPath();
  const { restaurant } = useRestaurant();
  const { addToCart, items: cartItems, updateQuantity } = useCart();

  const name = restaurant?.name ?? "Terra";
  const heroTitle = restaurant?.heroTitle || "Nourish Your Body.\nDelight Your Soul.";
  const heroSubtitle =
    restaurant?.heroSubtitle ||
    restaurant?.description ||
    "Experience the rich, warm flavors of our kitchen. We source local, sustainable ingredients to craft meals you'll remember.";
  const heroImageUrl = restaurant?.heroImageUrl;

  const getQuantity = (id: number) => cartItems.find((i) => i.menuItemId === id)?.quantity || 0;

  return (
    <Layout>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70 z-10" />
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{
            backgroundImage: heroImageUrl
              ? `url(${heroImageUrl})`
              : `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 50%, hsl(20 80% 25%) 100%)`,
          }}
        />

        {/* Decorative pattern */}
        {!heroImageUrl && (
          <div className="absolute inset-0 z-[5] opacity-10" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
            backgroundSize: "60px 60px"
          }} />
        )}

        <div className="relative z-20 text-center text-white px-4 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm rounded-full px-5 py-2 text-xs tracking-widest uppercase mb-8 text-white/90">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {name} · Now Open
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold font-serif leading-[1.05] whitespace-pre-line drop-shadow-xl mb-6">
            {heroTitle}
          </h1>
          <p className="text-base md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed mb-10">
            {heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={rpath("/menu")}>
              <Button size="lg" className="text-base px-10 py-6 rounded-full shadow-2xl shadow-primary/40 hover:shadow-primary/60 transition-all duration-300 hover:scale-105">
                Order Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href={rpath("/menu")}>
              <Button size="lg" variant="outline" className="text-base px-10 py-6 rounded-full bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm hover:scale-105 transition-all duration-300">
                Browse Menu
              </Button>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-white/60 text-xs">
            {[
              { icon: CheckCircle2, text: "Fresh Daily" },
              { icon: Bike, text: "30-min Delivery" },
              { icon: Star, text: "4.9★ Rated" },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-primary" />
                {text}
              </span>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-white/40 text-xs">
          <div className="w-5 h-8 rounded-full border border-white/30 flex items-start justify-center p-1">
            <div className="w-1 h-2 bg-white/60 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────────── */}
      <section className="bg-primary text-primary-foreground py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x divide-primary-foreground/20">
            {[
              { value: "500+",   label: "Happy Customers Daily" },
              { value: "30 min", label: "Average Delivery" },
              { value: "4.9 ★",  label: "Customer Rating" },
              { value: "100%",   label: "Fresh Ingredients" },
            ].map((stat) => (
              <div key={stat.label} className="px-4">
                <div className="text-2xl md:text-3xl font-serif font-bold">{stat.value}</div>
                <div className="text-primary-foreground/65 text-xs mt-1 tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Items ────────────────────────────────────── */}
      <FadeIn className="py-16 md:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div>
              <p className="text-primary font-medium text-sm uppercase tracking-widest mb-2">Most Loved</p>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">Chef's Signatures</h2>
              <p className="text-muted-foreground mt-2 text-sm max-w-md">
                Hand-picked by our chef — the dishes our customers can't stop ordering.
              </p>
            </div>
            <Link href={rpath("/menu")}>
              <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-primary shrink-0">
                View Full Menu <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {isLoadingItems ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="w-full aspect-[4/3] rounded-2xl" />
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : featuredItems && featuredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {featuredItems.slice(0, 3).map((item, idx) => {
                const qty = getQuantity(item.id);
                const LABELS = ["#1 Bestseller", "Chef's Favourite", "Most Ordered"];
                return (
                  <div
                    key={item.id}
                    className="group flex flex-col rounded-2xl overflow-hidden border bg-card shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                  >
                    <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden">
                      <div className="absolute top-3 left-3 z-10">
                        <Badge className="bg-primary text-primary-foreground text-xs shadow-lg">
                          {LABELS[idx] ?? "Featured"}
                        </Badge>
                      </div>
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/15">
                          <Utensils className="h-14 w-14 text-primary/20" />
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="font-serif text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                          {item.name}
                        </h3>
                        <span className="text-primary font-bold text-lg shrink-0">{formatCurrency(item.price)}</span>
                      </div>
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-5 flex-1 leading-relaxed">
                        {item.description}
                      </p>
                      <div className="mt-auto">
                        {qty > 0 ? (
                          <div className="flex items-center justify-between bg-primary/5 rounded-xl p-1 border border-primary/20">
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-primary/15 hover:text-primary" onClick={() => updateQuantity(item.id, qty - 1)}>–</Button>
                            <span className="font-bold w-8 text-center">{qty}</span>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-primary/15 hover:text-primary" onClick={() => updateQuantity(item.id, qty + 1)}>+</Button>
                          </div>
                        ) : (
                          <Button className="w-full rounded-xl gap-2" onClick={() => addToCart({ menuItemId: item.id, name: item.name, price: item.price, imageUrl: item.imageUrl || undefined })}>
                            <span className="text-base">+</span> Add to Cart
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed">
              <Utensils className="h-10 w-10 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">No featured items yet. Check back soon!</p>
            </div>
          )}
        </div>
      </FadeIn>

      {/* ── Categories ───────────────────────────────────────── */}
      <FadeIn className="py-16 md:py-24 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div>
              <p className="text-primary font-medium text-sm uppercase tracking-widest mb-2">Explore</p>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">Browse by Category</h2>
            </div>
            <Link href={rpath("/menu")}>
              <Button variant="ghost" className="hidden sm:flex gap-2 text-muted-foreground hover:text-primary">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {isLoadingCategories ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="w-full aspect-[3/4] rounded-2xl" />)}
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-5">
              {categories.slice(0, 5).map((category, idx) => {
                const GRADIENTS = [
                  "from-orange-500 to-red-600",
                  "from-red-500 to-rose-600",
                  "from-primary to-primary/70",
                  "from-green-600 to-emerald-700",
                  "from-blue-600 to-indigo-700",
                ];
                return (
                  <Link key={category.id} href={rpath(`/menu/${category.id}`)}>
                    <div className="group relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer bg-muted shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                      {category.imageUrl ? (
                        <img
                          src={category.imageUrl}
                          alt={category.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          loading="lazy"
                          crossOrigin="anonymous"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className={cn("w-full h-full bg-gradient-to-br", GRADIENTS[idx % GRADIENTS.length])} />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-serif font-bold text-lg md:text-xl leading-tight drop-shadow-lg">
                          {category.name}
                        </h3>
                        <div className="flex items-center gap-1 mt-1.5 text-white/70 text-xs group-hover:text-white/90 transition-colors">
                          <span>Explore</span>
                          <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                        </div>
                      </div>
                      <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Browse
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">No categories yet.</div>
          )}

          <div className="mt-8 sm:hidden">
            <Link href={rpath("/menu")}>
              <Button variant="outline" className="w-full rounded-xl">View Full Menu</Button>
            </Link>
          </div>
        </div>
      </FadeIn>

      {/* ── Why Choose Us ────────────────────────────────────── */}
      <FadeIn className="py-16 md:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-primary font-medium text-sm uppercase tracking-widest mb-2">Our Promise</p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">Why Choose {name}?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {WHY_US.map(({ icon: Icon, title, desc }, idx) => (
              <div
                key={title}
                className="group text-center p-7 rounded-2xl border bg-card hover:border-primary/40 hover:shadow-lg transition-all duration-300"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mx-auto mb-5 transition-colors">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-serif font-bold text-lg mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <FadeIn className="py-16 md:py-24 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-primary font-medium text-sm uppercase tracking-widest mb-2">Loved By Many</p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">What Our Customers Say</h2>
            <div className="flex items-center justify-center gap-1 mt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
              ))}
              <span className="ml-2 text-muted-foreground text-sm font-medium">4.9 out of 5 · 200+ reviews</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <div
                key={idx}
                className="bg-card rounded-2xl border p-7 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-4"
              >
                <Quote className="h-8 w-8 text-primary/20 shrink-0" />
                <p className="text-foreground/80 text-sm leading-relaxed flex-1 italic">"{t.text}"</p>
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/50">
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-muted-foreground text-xs">{t.location}</p>
                  </div>
                  <StarRating count={t.stars} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* ── CTA Banner ───────────────────────────────────────── */}
      <section className="py-20 px-4 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 30% 50%, white 1px, transparent 1px), radial-gradient(circle at 70% 50%, white 1px, transparent 1px)`,
          backgroundSize: "40px 40px"
        }} />
        <div className="max-w-3xl mx-auto text-center space-y-6 relative z-10">
          <p className="text-primary-foreground/70 text-sm uppercase tracking-widest font-medium">Ready to eat?</p>
          <h2 className="text-3xl md:text-5xl font-serif font-bold">Order something amazing today.</h2>
          <p className="text-primary-foreground/70 text-lg max-w-xl mx-auto">
            Browse our full menu and get fresh food delivered straight to your door — fast.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href={rpath("/menu")}>
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 px-10 py-6 rounded-full text-base font-semibold shadow-lg hover:shadow-xl transition-all">
                See Full Menu <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href={rpath("/track-order")}>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-10 py-6 rounded-full text-base backdrop-blur-sm">
                Track an Order
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
