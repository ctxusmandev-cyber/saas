import { Layout } from "@/components/layout";
import { Link, useParams } from "wouter";
import { useListCategories, useListItems } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Utensils, Search, X, ShoppingBag, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useRestaurantPath } from "@/lib/use-slug";
import { useState, useMemo, useRef, useEffect } from "react";
import { useRestaurant } from "@/lib/restaurant-context";

function ItemCard({
  item,
  quantity,
  onAdd,
  onInc,
  onDec,
}: {
  item: any;
  quantity: number;
  onAdd: () => void;
  onInc: () => void;
  onDec: () => void;
}) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAdd();
    setAdded(true);
    setTimeout(() => setAdded(false), 600);
  };

  return (
    <div className={cn(
      "group flex flex-col bg-card rounded-2xl border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5",
      !item.available && "opacity-60"
    )}>
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/15">
            <Utensils className="h-10 w-10 text-primary/25" />
          </div>
        )}

        {!item.available && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
            <Badge variant="secondary" className="text-sm font-bold px-4 py-1.5">Sold Out</Badge>
          </div>
        )}

        <div className="absolute top-3 left-3 flex gap-1.5">
          {item.featured && (
            <Badge className="bg-amber-500 text-white text-[10px] px-2 py-0.5 shadow gap-1">
              <Star className="h-2.5 w-2.5 fill-white" /> Chef's Pick
            </Badge>
          )}
        </div>

        {item.prepTimeMinutes && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
            ~{item.prepTimeMinutes} min
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-2 mb-1.5">
          <h3 className="font-bold text-base font-serif leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {item.name}
          </h3>
          <span className="font-bold text-primary shrink-0 text-base">{formatCurrency(item.price)}</span>
        </div>
        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1 leading-relaxed">
            {item.description}
          </p>
        )}

        <div className="mt-auto pt-2">
          {quantity > 0 ? (
            <div className="flex items-center justify-between bg-primary/5 rounded-xl p-1 border border-primary/20">
              <Button
                variant="ghost" size="icon"
                className="h-9 w-9 rounded-lg hover:bg-primary/15 hover:text-primary"
                onClick={onDec}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-bold w-8 text-center tabular-nums">{quantity}</span>
              <Button
                variant="ghost" size="icon"
                className="h-9 w-9 rounded-lg hover:bg-primary/15 hover:text-primary"
                onClick={onInc}
                disabled={!item.available}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              className={cn(
                "w-full rounded-xl gap-2 transition-all duration-300",
                added && "bg-green-600 hover:bg-green-600"
              )}
              onClick={handleAdd}
              disabled={!item.available}
            >
              {added ? (
                "✓ Added!"
              ) : (
                <><Plus className="h-4 w-4" /> Add to Order</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Menu() {
  const params = useParams<{ slug: string; categoryId?: string }>();
  const activeCategoryId = params?.categoryId ? parseInt(params.categoryId, 10) : undefined;
  const rpath = useRestaurantPath();
  const [search, setSearch] = useState("");
  const { restaurant } = useRestaurant();
  const tabsRef = useRef<HTMLDivElement>(null);
  const [tabsStuck, setTabsStuck] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data: categories, isLoading: isLoadingCategories } = useListCategories();
  const { data: items, isLoading: isLoadingItems } = useListItems(
    activeCategoryId ? { categoryId: activeCategoryId } : undefined
  );
  const { items: cartItems, addToCart, updateQuantity, itemCount } = useCart();

  const getQuantity = (id: number) => cartItems.find((i) => i.menuItemId === id)?.quantity || 0;

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items?.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
    );
  }, [items, search]);

  const activeCategory = categories?.find((c) => c.id === activeCategoryId);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setTabsStuck(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (activeCategoryId && tabsRef.current) {
      const btn = tabsRef.current.querySelector(`[data-cat="${activeCategoryId}"]`) as HTMLElement;
      btn?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeCategoryId]);

  return (
    <Layout>
      {/* Page Header */}
      <div className="relative bg-primary/5 border-b overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--primary))_0%,_transparent_60%)]" />
        <div className="container mx-auto px-4 py-12 text-center relative">
          <p className="text-primary font-medium text-sm uppercase tracking-widest mb-2">
            {activeCategory ? activeCategory.name : "Full Collection"}
          </p>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-3">
            {activeCategory ? activeCategory.name : "Our Menu"}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm mb-6">
            {restaurant?.description || "Thoughtfully sourced, carefully crafted. Explore our seasonal offerings and timeless classics."}
          </p>
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search dishes..."
              className="pl-10 pr-10 rounded-full bg-background border-border/60 shadow-sm h-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sentinel for sticky detection */}
      <div ref={sentinelRef} />

      {/* Sticky Category Tabs */}
      <div className={cn(
        "sticky top-16 z-30 bg-background/95 backdrop-blur-md border-b transition-shadow duration-200",
        tabsStuck && "shadow-sm"
      )}>
        <div className="container mx-auto px-4">
          <div ref={tabsRef} className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-none">
            {isLoadingCategories ? (
              <div className="flex gap-2">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-28 rounded-full shrink-0" />)}
              </div>
            ) : (
              <>
                <Link href={rpath("/menu")}>
                  <button className={cn(
                    "shrink-0 flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap border",
                    !activeCategoryId
                      ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                      : "bg-background border-border/60 text-foreground/60 hover:border-primary/40 hover:text-primary"
                  )}>
                    <span className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                      !activeCategoryId ? "bg-white/20" : "bg-muted"
                    )}>
                      🍽️
                    </span>
                    All
                    {!activeCategoryId && items && (
                      <span className="opacity-60 text-xs">({items.length})</span>
                    )}
                  </button>
                </Link>
                {categories?.map((cat) => (
                  <Link key={cat.id} href={rpath(`/menu/${cat.id}`)}>
                    <button
                      data-cat={cat.id}
                      className={cn(
                        "shrink-0 flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap border",
                        activeCategoryId === cat.id
                          ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                          : "bg-background border-border/60 text-foreground/60 hover:border-primary/40 hover:text-primary"
                      )}
                    >
                      <span className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-border/40">
                        {cat.imageUrl ? (
                          <img
                            src={cat.imageUrl}
                            alt={cat.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center bg-primary/10 text-sm">🍽️</span>
                        )}
                      </span>
                      {cat.name}
                    </button>
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="container mx-auto px-4 py-8">
        {search && (
          <div className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            <span>
              {filteredItems?.length ?? 0} result{filteredItems?.length !== 1 ? "s" : ""} for{" "}
              <strong className="text-foreground">"{search}"</strong>
            </span>
            <button onClick={() => setSearch("")} className="ml-1 text-primary hover:underline text-xs">
              Clear
            </button>
          </div>
        )}

        {isLoadingItems ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="space-y-3 rounded-2xl border p-4">
                <Skeleton className="w-full aspect-[4/3] rounded-xl" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredItems?.length === 0 ? (
          <div className="text-center py-24 bg-muted/30 rounded-2xl border border-dashed">
            <Utensils className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-xl font-bold mb-2 font-serif">
              {search ? "No dishes match your search" : "No items in this category"}
            </h3>
            <p className="text-muted-foreground text-sm">
              {search ? "Try a different search term." : "Check back soon for new additions."}
            </p>
            {search && (
              <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setSearch("")}>
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredItems?.map((item) => {
              const quantity = getQuantity(item.id);
              return (
                <ItemCard
                  key={item.id}
                  item={item}
                  quantity={quantity}
                  onAdd={() => addToCart({ menuItemId: item.id, name: item.name, price: item.price, imageUrl: item.imageUrl || undefined })}
                  onInc={() => updateQuantity(item.id, quantity + 1)}
                  onDec={() => updateQuantity(item.id, quantity - 1)}
                />
              );
            })}
          </div>
        )}
      </div>

    </Layout>
  );
}
