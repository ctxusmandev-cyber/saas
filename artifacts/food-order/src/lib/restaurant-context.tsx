import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { setDefaultHeader } from "@workspace/api-client-react";

export interface RestaurantInfo {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  phone?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  active: boolean;
  themeColor?: string | null;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  heroImageUrl?: string | null;
  jazzCashNumber?: string | null;
  easyPaisaNumber?: string | null;
  // Social media
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  twitterUrl?: string | null;
  tiktokUrl?: string | null;
  whatsappNumber?: string | null;
  // Announcement bar
  announcementText?: string | null;
  announcementEnabled?: boolean | null;
  // Footer / business
  footerTagline?: string | null;
  businessHours?: string | null;
}

interface RestaurantContextType {
  restaurant: RestaurantInfo | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const RestaurantContext = createContext<RestaurantContextType>({
  restaurant: null,
  isLoading: false,
  error: null,
  refetch: () => {},
});

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function RestaurantProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    fetch(`/api/restaurants/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Restaurant not found");
        return r.json();
      })
      .then((data: RestaurantInfo) => {
        setRestaurant(data);
        setDefaultHeader("x-restaurant-id", String(data.id));
        setIsLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setIsLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    load();
    return () => { setDefaultHeader("x-restaurant-id", null); };
  }, [load]);

  useEffect(() => {
    if (!restaurant?.themeColor) return;
    const hsl = hexToHsl(restaurant.themeColor);
    const style = document.createElement("style");
    style.id = `theme-${slug}`;
    style.textContent = `:root { --primary: ${hsl}; --ring: ${hsl}; }`;
    document.head.appendChild(style);
    return () => { document.getElementById(`theme-${slug}`)?.remove(); };
  }, [restaurant?.themeColor, slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-sm px-4">
          <div className="text-6xl">🍽️</div>
          <h1 className="text-2xl font-bold font-serif">Restaurant Not Found</h1>
          <p className="text-muted-foreground">This restaurant doesn't exist or is unavailable.</p>
        </div>
      </div>
    );
  }

  if (!restaurant.active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-sm px-4">
          <div className="text-6xl">🔒</div>
          <h1 className="text-2xl font-bold font-serif">{restaurant.name}</h1>
          <p className="text-muted-foreground text-lg">This restaurant is currently inactive.</p>
          <p className="text-sm text-muted-foreground">Please contact the administrator or check back later.</p>
        </div>
      </div>
    );
  }

  return (
    <RestaurantContext.Provider value={{ restaurant, isLoading, error, refetch: load }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  return useContext(RestaurantContext);
}
