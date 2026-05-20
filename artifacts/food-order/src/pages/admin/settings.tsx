import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useRestaurant } from "@/lib/restaurant-context";
import { useAdminAuth } from "@/lib/admin-auth";
import { useState, useEffect, useRef } from "react";
import {
  KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle,
  Phone, MapPin, Clock, Instagram, Facebook, Twitter,
  MessageCircle, Save, Upload, X, ImageIcon, Megaphone,
  Share2, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

function ImageUploadField({
  value,
  onChange,
  aspectClass = "aspect-square",
  placeholder = "Click to upload or drag & drop",
}: {
  value: string;
  onChange: (url: string) => void;
  aspectClass?: string;
  placeholder?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Please select an image file."); return; }
    if (file.size > 15 * 1024 * 1024) { setError("File must be under 15 MB."); return; }
    setError("");
    setUploading(true);
    try {
      const res = await fetch("/api/storage/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      const { uploadURL, objectPath } = await res.json();
      await fetch(uploadURL, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      onChange(`/api/storage${objectPath}`);
    } catch {
      setError("Upload failed. Please try again.");
    }
    setUploading(false);
  };

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative group rounded-xl overflow-hidden border bg-muted/30 inline-flex">
          <img
            src={value}
            alt="Logo"
            className={`${aspectClass} w-48 object-contain p-2`}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button type="button" size="sm" variant="secondary" className="gap-1.5 text-xs" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload className="w-3 h-3" /> Replace
            </Button>
            <Button type="button" size="sm" variant="destructive" className="gap-1.5 text-xs" onClick={() => onChange("")}>
              <X className="w-3 h-3" /> Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all w-48 h-32 text-center`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        >
          <ImageIcon className="w-7 h-7 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground px-3">
            {uploading ? "Uploading…" : <><span className="text-primary font-medium">Click to upload</span></>}
          </p>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex items-center gap-2 max-w-sm">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">or paste a URL</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://yourdomain.com/logo.png"
        className="text-sm max-w-sm"
      />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}

function SaveFeedback({ status, message }: { status: "idle" | "loading" | "success" | "error"; message: string }) {
  if (!message) return null;
  return (
    <div className={cn(
      "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm",
      status === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
    )}>
      {status === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
      {message}
    </div>
  );
}

export default function AdminSettings() {
  const { restaurant, refetch } = useRestaurant() as { restaurant: any; refetch?: () => void };
  const { session } = useAdminAuth();
  const slug = session?.slug ?? restaurant?.slug ?? "terra";
  const { toast } = useToast();

  const patch = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/restaurants/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Failed");
    if (refetch) refetch();
    return res.json();
  };

  // ── Brand ─────────────────────────────────────────────────────────────────
  const [logoUrl, setLogoUrl] = useState(restaurant?.logoUrl ?? "");
  const [brandName, setBrandName] = useState(restaurant?.name ?? "");
  const [brandDesc, setBrandDesc] = useState(restaurant?.description ?? "");
  const [savingBrand, setSavingBrand] = useState(false);

  // ── Contact ───────────────────────────────────────────────────────────────
  const [phone, setPhone] = useState(restaurant?.phone ?? "");
  const [address, setAddress] = useState(restaurant?.address ?? "");
  const [businessHours, setBusinessHours] = useState(restaurant?.businessHours ?? "");
  const [savingContact, setSavingContact] = useState(false);

  // ── Social ────────────────────────────────────────────────────────────────
  const [instagram, setInstagram] = useState(restaurant?.instagramUrl ?? "");
  const [facebook, setFacebook] = useState(restaurant?.facebookUrl ?? "");
  const [twitter, setTwitter] = useState(restaurant?.twitterUrl ?? "");
  const [tiktok, setTiktok] = useState(restaurant?.tiktokUrl ?? "");
  const [whatsapp, setWhatsapp] = useState(restaurant?.whatsappNumber ?? "");
  const [savingSocial, setSavingSocial] = useState(false);

  // ── Announcement ──────────────────────────────────────────────────────────
  const [announcementEnabled, setAnnouncementEnabled] = useState(restaurant?.announcementEnabled ?? true);
  const [announcementText, setAnnouncementText] = useState(restaurant?.announcementText ?? "");
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  // ── Password ──────────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwStatus, setPwStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [pwMessage, setPwMessage] = useState("");

  useEffect(() => {
    if (!restaurant) return;
    setLogoUrl(restaurant.logoUrl ?? "");
    setBrandName(restaurant.name ?? "");
    setBrandDesc(restaurant.description ?? "");
    setPhone(restaurant.phone ?? "");
    setAddress(restaurant.address ?? "");
    setBusinessHours(restaurant.businessHours ?? "");
    setInstagram(restaurant.instagramUrl ?? "");
    setFacebook(restaurant.facebookUrl ?? "");
    setTwitter(restaurant.twitterUrl ?? "");
    setTiktok(restaurant.tiktokUrl ?? "");
    setWhatsapp(restaurant.whatsappNumber ?? "");
    setAnnouncementEnabled(restaurant.announcementEnabled ?? true);
    setAnnouncementText(restaurant.announcementText ?? "");
  }, [restaurant]);

  const handleSaveBrand = async () => {
    setSavingBrand(true);
    try {
      await patch({ logoUrl, name: brandName, description: brandDesc });
      toast({ title: "Brand saved!", description: "Logo and brand info updated." });
    } catch {
      toast({ title: "Error", description: "Could not save brand info.", variant: "destructive" });
    }
    setSavingBrand(false);
  };

  const handleSaveContact = async () => {
    setSavingContact(true);
    try {
      await patch({ phone, address, businessHours });
      toast({ title: "Contact info saved!", description: "Shown in your site footer." });
    } catch {
      toast({ title: "Error", description: "Could not save contact info.", variant: "destructive" });
    }
    setSavingContact(false);
  };

  const handleSaveSocial = async () => {
    setSavingSocial(true);
    try {
      await patch({ instagramUrl: instagram, facebookUrl: facebook, twitterUrl: twitter, tiktokUrl: tiktok, whatsappNumber: whatsapp });
      toast({ title: "Social links saved!", description: "Links now appear in your site footer." });
    } catch {
      toast({ title: "Error", description: "Could not save social links.", variant: "destructive" });
    }
    setSavingSocial(false);
  };

  const handleSaveAnnouncement = async () => {
    setSavingAnnouncement(true);
    try {
      await patch({ announcementEnabled, announcementText });
      toast({ title: "Announcement saved!", description: announcementEnabled ? "Bar is live on your site." : "Announcement bar is hidden." });
    } catch {
      toast({ title: "Error", description: "Could not save announcement.", variant: "destructive" });
    }
    setSavingAnnouncement(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwStatus("idle");
    setPwMessage("");
    if (!currentPassword || !newPassword || !confirmPassword) { setPwStatus("error"); setPwMessage("All fields are required."); return; }
    if (newPassword.length < 6) { setPwStatus("error"); setPwMessage("New password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setPwStatus("error"); setPwMessage("New passwords do not match."); return; }
    setPwStatus("loading");
    try {
      const verifyRes = await fetch(`/api/restaurants/${slug}/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: currentPassword }) });
      if (!verifyRes.ok) { setPwStatus("error"); setPwMessage("Current password is incorrect."); return; }
      await patch({ adminPassword: newPassword });
      setPwStatus("success");
      setPwMessage("Password updated successfully.");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch {
      setPwStatus("error");
      setPwMessage("Connection error. Please try again.");
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-3xl space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Control every aspect of your restaurant's public website</p>
        </div>

        {/* ── Brand Identity ─────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4 text-primary" />
              Brand Identity
            </CardTitle>
            <CardDescription>Your logo and restaurant name shown in the navbar and footer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Restaurant Logo</Label>
              <p className="text-xs text-muted-foreground">Use a square logo (PNG with transparent background recommended). Minimum 200×200px.</p>
              <ImageUploadField value={logoUrl} onChange={setLogoUrl} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="brand-name">Restaurant Name</Label>
                <Input id="brand-name" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Terra" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="brand-desc">Short Description</Label>
                <Textarea id="brand-desc" value={brandDesc} onChange={(e) => setBrandDesc(e.target.value)} placeholder="Authentic flavors from the heart of the earth..." rows={2} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveBrand} disabled={savingBrand} className="gap-2">
                <Save className="h-4 w-4" />
                {savingBrand ? "Saving..." : "Save Brand"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Announcement Bar ───────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="h-4 w-4 text-primary" />
              Announcement Bar
            </CardTitle>
            <CardDescription>The coloured banner at the very top of your site — great for promotions and hours</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
              <div>
                <p className="font-medium text-sm">Show announcement bar</p>
                <p className="text-xs text-muted-foreground mt-0.5">Toggle the bar on or off across your entire site</p>
              </div>
              <Switch checked={announcementEnabled} onCheckedChange={setAnnouncementEnabled} />
            </div>
            <div className="space-y-1.5">
              <Label>Announcement Text</Label>
              <Input
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="🎉 Free delivery on orders above Rs. 1,500 · Open daily 11am – 11pm"
              />
              <p className="text-xs text-muted-foreground">Use emojis to make it pop! Keep it under 100 characters.</p>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveAnnouncement} disabled={savingAnnouncement} className="gap-2">
                <Save className="h-4 w-4" />
                {savingAnnouncement ? "Saving..." : "Save Announcement"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Contact Info ───────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-4 w-4 text-primary" />
              Contact & Hours
            </CardTitle>
            <CardDescription>Displayed in your site footer and used for customer communication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone Number
              </Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92-42-3500-0000" />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Address
              </Label>
              <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="12-B, MM Alam Road, Gulberg III, Lahore, Pakistan" rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Business Hours
              </Label>
              <Input value={businessHours} onChange={(e) => setBusinessHours(e.target.value)} placeholder="Daily 11:00 AM – 11:00 PM" />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveContact} disabled={savingContact} className="gap-2">
                <Save className="h-4 w-4" />
                {savingContact ? "Saving..." : "Save Contact Info"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Social Media ───────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Share2 className="h-4 w-4 text-primary" />
              Social Media Links
            </CardTitle>
            <CardDescription>These links appear as clickable icons in your site footer. Leave blank to hide.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-pink-500" /> Instagram
                </Label>
                <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/yourrestaurant" />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-blue-600" /> Facebook
                </Label>
                <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/yourrestaurant" />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-2">
                  <Twitter className="h-4 w-4 text-sky-500" /> Twitter / X
                </Label>
                <Input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://twitter.com/yourrestaurant" />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-foreground" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.14 8.14 0 004.77 1.52V6.77a4.86 4.86 0 01-1-.08z"/></svg>
                  TikTok
                </Label>
                <Input value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="https://tiktok.com/@yourrestaurant" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-green-500" /> WhatsApp Number
                </Label>
                <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="923001234567  (country code, no spaces or +)" />
                <p className="text-xs text-muted-foreground">Enter the number with country code (e.g. 923001234567). Creates a "Chat on WhatsApp" link.</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveSocial} disabled={savingSocial} className="gap-2">
                <Save className="h-4 w-4" />
                {savingSocial ? "Saving..." : "Save Social Links"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Security ───────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4 text-primary" />
              Admin Password
            </CardTitle>
            <CardDescription>Update the password used to log in to this admin panel</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {[
                { id: "current-password", label: "Current Password", value: currentPassword, set: setCurrentPassword, show: showCurrent, setShow: setShowCurrent },
                { id: "new-password", label: "New Password", value: newPassword, set: setNewPassword, show: showNew, setShow: setShowNew },
                { id: "confirm-password", label: "Confirm New Password", value: confirmPassword, set: setConfirmPassword, show: showConfirm, setShow: setShowConfirm },
              ].map(({ id, label, value, set, show, setShow }) => (
                <div key={id} className="space-y-1.5">
                  <Label htmlFor={id}>{label}</Label>
                  <div className="relative">
                    <Input id={id} type={show ? "text" : "password"} value={value} onChange={(e) => set(e.target.value)} placeholder={`Enter ${label.toLowerCase()}`} className="pr-10" />
                    <button type="button" onClick={() => setShow((v: boolean) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}
              <SaveFeedback status={pwStatus} message={pwMessage} />
              <Button type="submit" disabled={pwStatus === "loading"} className="w-full gap-2">
                <KeyRound className="h-4 w-4" />
                {pwStatus === "loading" ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
