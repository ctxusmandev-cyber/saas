import { useAdminAuth } from "@/lib/admin-auth";
import { Redirect, useParams } from "wouter";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { session, isAuthenticated } = useAdminAuth();
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "terra";

  if (!isAuthenticated || session?.slug !== slug) {
    return <Redirect to={`/r/${slug}/admin/login`} />;
  }
  return <>{children}</>;
}
