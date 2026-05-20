import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { useGetDashboardStats, useGetRecentOrders, useGetTopItems } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, ShoppingBag, Package, ListTodo, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRestaurant } from "@/lib/restaurant-context";
import { useRestaurantPath } from "@/lib/use-slug";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  preparing: "bg-purple-100 text-purple-800 border-purple-200",
  ready:     "bg-green-100 text-green-800 border-green-200",
  delivered: "bg-gray-100 text-gray-800 border-gray-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

export default function AdminDashboard() {
  const { data: stats, isLoading: isLoadingStats } = useGetDashboardStats();
  const { data: recentOrders, isLoading: isLoadingOrders } = useGetRecentOrders();
  const { data: topItems, isLoading: isLoadingItems } = useGetTopItems();
  const { restaurant } = useRestaurant();
  const rpath = useRestaurantPath();

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-serif font-bold">Dashboard</h1>
          {restaurant && (
            <p className="text-sm text-muted-foreground mt-1">{restaurant.name} — Overview</p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          {isLoadingStats ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                  <CardTitle className="text-xs md:text-sm font-medium">Today's Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-xl md:text-2xl font-bold">{formatCurrency(stats?.todayRevenue || 0)}</div>
                  <p className="text-xs text-muted-foreground">Total: {formatCurrency(stats?.totalRevenue || 0)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                  <CardTitle className="text-xs md:text-sm font-medium">Today's Orders</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-xl md:text-2xl font-bold">{stats?.todayOrders || 0}</div>
                  <p className="text-xs text-muted-foreground">Total: {stats?.totalOrders || 0} orders</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                  <CardTitle className="text-xs md:text-sm font-medium">Pending</CardTitle>
                  <ListTodo className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-xl md:text-2xl font-bold">{stats?.pendingOrders || 0}</div>
                  <p className="text-xs text-muted-foreground">Awaiting action</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                  <CardTitle className="text-xs md:text-sm font-medium">Menu Items</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-xl md:text-2xl font-bold">{stats?.totalItems || 0}</div>
                  <p className="text-xs text-muted-foreground">{stats?.totalCategories || 0} categories</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="grid gap-4 md:gap-8 md:grid-cols-2">
          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base md:text-lg">Recent Orders</CardTitle>
              <Link href={rpath("/admin/orders")}>
                <Button variant="ghost" size="sm" className="text-xs h-7">View all</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {isLoadingOrders ? (
                <div className="space-y-3">
                  {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : recentOrders?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No recent orders</p>
              ) : (
                <div className="space-y-3">
                  {recentOrders?.map(order => (
                    <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">#{order.id} — {order.customerName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {order.items?.map((i: any) => i.name).join(", ")}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="font-semibold text-sm">{formatCurrency(order.total)}</p>
                        <Badge className={`${STATUS_COLORS[order.status] ?? "bg-gray-100"} text-xs`} variant="outline">
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Selling Items */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <TrendingUp className="h-4 w-4 text-primary" />
                Top Selling Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingItems ? (
                <div className="space-y-3">
                  {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : topItems?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No sales data yet</p>
              ) : (
                <div className="space-y-3">
                  {topItems?.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                      <span className="text-sm font-bold text-muted-foreground w-5 shrink-0">#{idx + 1}</span>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-muted shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.orderCount} orders</p>
                      </div>
                      <div className="font-semibold text-sm shrink-0">{formatCurrency(item.revenue)}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
