import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "./lib/cart";
import { AdminAuthProvider, SuperAdminProvider } from "./lib/admin-auth";
import { AdminGuard } from "@/components/admin-guard";
import { RestaurantProvider } from "@/lib/restaurant-context";

import Home from "@/pages/home";
import Menu from "@/pages/menu";
import Checkout from "@/pages/checkout";
import OrderTracking from "@/pages/order";
import MyOrders from "@/pages/my-orders";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminMenu from "@/pages/admin/menu";
import AdminCategories from "@/pages/admin/categories";
import AdminOrders from "@/pages/admin/orders";
import AdminAppearance from "@/pages/admin/appearance";
import AdminRiders from "@/pages/admin/riders";
import AdminSettings from "@/pages/admin/settings";
import TrackOrder from "@/pages/track-order";
import Receipt from "@/pages/receipt";
import SuperAdminLogin from "@/pages/super-admin/login";
import SuperAdminDashboard from "@/pages/super-admin/index";

function R({
  slug,
  admin = false,
  children,
}: {
  slug: string;
  admin?: boolean;
  children: React.ReactNode;
}) {
  return (
    <RestaurantProvider slug={slug}>
      <CartProvider>
        {admin ? <AdminGuard>{children}</AdminGuard> : children}
      </CartProvider>
    </RestaurantProvider>
  );
}

function Router() {
  return (
    <Switch>
      {/* ── Super admin ─────────────────────────────── */}
      <Route path="/super-admin/login" component={SuperAdminLogin} />
      <Route path="/super-admin" component={SuperAdminDashboard} />

      {/* ── Legacy redirects → terra ─────────────────── */}
      <Route path="/admin/login"><Redirect to="/r/terra/admin/login" /></Route>
      <Route path="/admin/orders"><Redirect to="/r/terra/admin/orders" /></Route>
      <Route path="/admin/menu"><Redirect to="/r/terra/admin/menu" /></Route>
      <Route path="/admin/categories"><Redirect to="/r/terra/admin/categories" /></Route>
      <Route path="/admin"><Redirect to="/r/terra/admin" /></Route>
      <Route path="/menu/:categoryId">
        {(p) => <Redirect to={`/r/terra/menu/${p.categoryId}`} />}
      </Route>
      <Route path="/menu"><Redirect to="/r/terra/menu" /></Route>
      <Route path="/checkout"><Redirect to="/r/terra/checkout" /></Route>
      <Route path="/order/:id">
        {(p) => <Redirect to={`/r/terra/order/${p.id}`} />}
      </Route>
      <Route path="/my-orders"><Redirect to="/r/terra/my-orders" /></Route>

      {/* ── Restaurant admin routes ───────────────────── */}
      <Route path="/r/:slug/admin/login">
        {(p) => <R slug={p.slug}><AdminLogin /></R>}
      </Route>
      <Route path="/r/:slug/admin/orders">
        {(p) => <R slug={p.slug} admin><AdminOrders /></R>}
      </Route>
      <Route path="/r/:slug/admin/menu">
        {(p) => <R slug={p.slug} admin><AdminMenu /></R>}
      </Route>
      <Route path="/r/:slug/admin/categories">
        {(p) => <R slug={p.slug} admin><AdminCategories /></R>}
      </Route>
      <Route path="/r/:slug/admin/appearance">
        {(p) => <R slug={p.slug} admin><AdminAppearance /></R>}
      </Route>
      <Route path="/r/:slug/admin/riders">
        {(p) => <R slug={p.slug} admin><AdminRiders /></R>}
      </Route>
      <Route path="/r/:slug/admin/settings">
        {(p) => <R slug={p.slug} admin><AdminSettings /></R>}
      </Route>
      <Route path="/r/:slug/admin">
        {(p) => <R slug={p.slug} admin><AdminDashboard /></R>}
      </Route>

      {/* ── Restaurant customer routes ────────────────── */}
      <Route path="/r/:slug/track-order">
        {(p) => <R slug={p.slug}><TrackOrder /></R>}
      </Route>
      <Route path="/r/:slug/order/:id/receipt">
        {(p) => <R slug={p.slug}><Receipt /></R>}
      </Route>
      <Route path="/r/:slug/order/:id">
        {(p) => <R slug={p.slug}><OrderTracking /></R>}
      </Route>
      <Route path="/r/:slug/my-orders">
        {(p) => <R slug={p.slug}><MyOrders /></R>}
      </Route>
      <Route path="/r/:slug/checkout">
        {(p) => <R slug={p.slug}><Checkout /></R>}
      </Route>
      <Route path="/r/:slug/menu/:categoryId">
        {(p) => <R slug={p.slug}><Menu /></R>}
      </Route>
      <Route path="/r/:slug/menu">
        {(p) => <R slug={p.slug}><Menu /></R>}
      </Route>
      <Route path="/r/:slug">
        {(p) => <R slug={p.slug}><Home /></R>}
      </Route>

      {/* ── Default ──────────────────────────────────── */}
      <Route path="/"><Redirect to="/r/terra" /></Route>

      <Route>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-primary">404</h1>
            <p className="text-muted-foreground">Page not found</p>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SuperAdminProvider>
          <AdminAuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </AdminAuthProvider>
        </SuperAdminProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
