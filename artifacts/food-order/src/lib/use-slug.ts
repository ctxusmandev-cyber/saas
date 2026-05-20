import { useLocation } from "wouter";

export function useSlug(): string {
  const [location] = useLocation();
  const match = location.match(/^\/r\/([^/]+)/);
  return match ? match[1] : "terra";
}

export function useRestaurantPath() {
  const slug = useSlug();
  return (path: string) => `/r/${slug}${path}`;
}
