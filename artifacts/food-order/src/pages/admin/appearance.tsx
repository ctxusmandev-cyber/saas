import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRestaurant } from "@/lib/restaurant-context";
import { useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Palette, ImageIcon, Type, Save, Eye, Smartphone, Upload, X, Image } from "lucide-react";

const PRESET_COLORS = [
  { label: "Terra Orange",   value: "#c2410c" },
  { label: "Crimson Red",    value: "#dc2626" },
  { label: "Forest Green",   value: "#16a34a" },
  { label: "Royal Blue",     value: "#1d4ed8" },
  { label: "Deep Purple",    value: "#7c3aed" },
  { label: "Gold",           value: "#d97706" },
  { label: "Ocean Teal",     value: "#0d9488" },
  { label: "Rose Pink",      value: "#db2777" },
  { label: "Slate",          value: "#475569" },
  { label: "Indigo",         value: "#4338ca" },
];

function ImageUploadField({
  label,
  hint,
  value,
  onChange,
  aspectClass = "aspect-[16/5]",
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
  aspectClass?: string;
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
      {label && <Label>{label}</Label>}
      {hint && <p className="text-xs text-muted-foreground -mt-1">{hint}</p>}

      {value ? (
        <div className="relative group rounded-xl overflow-hidden border">
          <img
            src={value}
            alt={label}
            className={`w-full ${aspectClass} object-cover`}
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button type="button" size="sm" variant="secondary" className="gap-1.5" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload className="w-3.5 h-3.5" /> Replace
            </Button>
            <Button type="button" size="sm" variant="destructive" className="gap-1.5" onClick={() => onChange("")}>
              <X className="w-3.5 h-3.5" /> Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all ${aspectClass}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        >
          <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
          <div className="text-sm text-muted-foreground text-center">
            {uploading ? "Uploading…" : <><span className="text-primary font-medium">Click to upload</span> or drag & drop</>}
          </div>
          <p className="text-xs text-muted-foreground/70">PNG, JPG, WebP · max 15 MB</p>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or paste a URL</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://images.unsplash.com/..."
        className="text-sm"
      />

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}

function LogoUploadField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Logo must be under 5 MB."); return; }
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
      <div className="flex items-start gap-6">
        <div
          className="w-24 h-24 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all shrink-0 overflow-hidden bg-muted/30"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        >
          {value ? (
            <img src={value} alt="Logo" className="w-full h-full object-contain p-1" onError={(e) => (e.currentTarget.style.display = "none")} />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground/50 p-2">
              <Image className="w-7 h-7" />
              <span className="text-[10px] text-center leading-tight">Upload logo</span>
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-sm text-muted-foreground leading-relaxed">Upload a square image (PNG with transparent background recommended). Your logo appears in the navbar and footer.</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload className="w-3.5 h-3.5" /> {uploading ? "Uploading…" : value ? "Replace Logo" : "Upload Logo"}
            </Button>
            {value && (
              <Button type="button" size="sm" variant="ghost" className="gap-1.5 text-xs text-destructive hover:text-destructive" onClick={() => onChange("")}>
                <X className="w-3.5 h-3.5" /> Remove
              </Button>
            )}
          </div>
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or paste image URL</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://yourdomain.com/logo.png"
        className="text-sm"
      />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}

export default function AdminAppearance() {
  const { restaurant, refetch } = useRestaurant() as { restaurant: any; refetch?: () => void };
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? restaurant?.slug ?? "terra";
  const { toast } = useToast();

  const [logoUrl, setLogoUrl] = useState(restaurant?.logoUrl ?? "");
  const [themeColor, setThemeColor] = useState(restaurant?.themeColor ?? "#c2410c");
  const [heroTitle, setHeroTitle] = useState(restaurant?.heroTitle ?? "");
  const [heroSubtitle, setHeroSubtitle] = useState(restaurant?.heroSubtitle ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState(restaurant?.heroImageUrl ?? "");
  const [jazzCashNumber, setJazzCashNumber] = useState(restaurant?.jazzCashNumber ?? "");
  const [easyPaisaNumber, setEasyPaisaNumber] = useState(restaurant?.easyPaisaNumber ?? "");
  const [savingLogo, setSavingLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    if (restaurant) {
      setLogoUrl(restaurant.logoUrl ?? "");
      setThemeColor(restaurant.themeColor ?? "#c2410c");
      setHeroTitle(restaurant.heroTitle ?? "");
      setHeroSubtitle(restaurant.heroSubtitle ?? "");
      setHeroImageUrl(restaurant.heroImageUrl ?? "");
      setJazzCashNumber(restaurant.jazzCashNumber ?? "");
      setEasyPaisaNumber(restaurant.easyPaisaNumber ?? "");
    }
  }, [restaurant]);

  const patch = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/restaurants/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Failed to save");
    if (refetch) refetch();
  };

  const handleSaveLogo = async () => {
    setSavingLogo(true);
    try {
      await patch({ logoUrl });
      toast({ title: "Logo saved!", description: "Your logo is now live on the site." });
    } catch {
      toast({ title: "Error saving logo", variant: "destructive" });
    }
    setSavingLogo(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await patch({ themeColor, heroTitle, heroSubtitle, heroImageUrl });
      toast({ title: "Appearance saved!", description: "Changes are live on your customer site." });
    } catch {
      toast({ title: "Error saving", description: "Please try again.", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleSavePayment = async () => {
    setSavingPayment(true);
    try {
      await patch({ jazzCashNumber, easyPaisaNumber });
      toast({ title: "Payment numbers saved!", description: "Customers will see these at checkout." });
    } catch {
      toast({ title: "Error saving", description: "Please try again.", variant: "destructive" });
    }
    setSavingPayment(false);
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-4xl">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-serif font-bold">Appearance</h1>
          <p className="text-sm text-muted-foreground mt-1">Customize your restaurant's customer-facing website</p>
        </div>

        <div className="space-y-6">
          {/* ── Logo ──────────────────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Image className="h-5 w-5 text-primary" />
                Restaurant Logo
              </CardTitle>
              <CardDescription>Shown in the navbar and footer. Use a square PNG with transparent background.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <LogoUploadField value={logoUrl} onChange={setLogoUrl} />
              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveLogo} disabled={savingLogo} className="gap-2 px-8">
                  <Save className="h-4 w-4" />
                  {savingLogo ? "Saving..." : "Save Logo"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ── Theme Color ───────────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Palette className="h-5 w-5 text-primary" />
                Brand Color
              </CardTitle>
              <CardDescription>The primary color used throughout your site — buttons, accents, navbar highlights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    title={c.label}
                    onClick={() => setThemeColor(c.value)}
                    className="w-9 h-9 rounded-full border-2 transition-all hover:scale-110"
                    style={{
                      backgroundColor: c.value,
                      borderColor: themeColor === c.value ? "#000" : "transparent",
                      boxShadow: themeColor === c.value ? `0 0 0 2px white, 0 0 0 4px ${c.value}` : "none",
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer border border-input p-0.5"
                />
                <Input
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  placeholder="#c2410c"
                  className="w-36 font-mono text-sm"
                  maxLength={7}
                />
                <div className="flex-1 h-10 rounded-lg border shadow-sm" style={{ backgroundColor: themeColor }} />
              </div>
            </CardContent>
          </Card>

          {/* ── Hero Text ─────────────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Type className="h-5 w-5 text-primary" />
                Hero Section Text
              </CardTitle>
              <CardDescription>The big headline and subtitle visitors see first on your homepage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Headline</Label>
                <Input
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  placeholder="Nourish Your Body. Delight Your Soul."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Subtext</Label>
                <Textarea
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  placeholder="A short description of your restaurant shown below the headline..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Hero Image ────────────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <ImageIcon className="h-5 w-5 text-primary" />
                Hero Background Image
              </CardTitle>
              <CardDescription>Upload a high-quality landscape photo or paste a URL. Recommended: 1400×600px or wider.</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUploadField
                label=""
                value={heroImageUrl}
                onChange={setHeroImageUrl}
                aspectClass="aspect-[16/5]"
              />
            </CardContent>
          </Card>

          {/* ── Live Preview ──────────────────────────────────────────────── */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Eye className="h-5 w-5 text-primary" />
                Hero Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div
                className="relative w-full aspect-[16/6] flex items-center justify-center overflow-hidden"
                style={{
                  backgroundImage: heroImageUrl ? `url(${heroImageUrl})` : undefined,
                  backgroundColor: heroImageUrl ? undefined : themeColor,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-black/45" />
                <div className="relative z-10 text-center text-white px-6 w-full">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    {logoUrl && (
                      <img src={logoUrl} alt="Logo" className="h-8 w-8 object-contain rounded-lg bg-white/10 p-0.5" />
                    )}
                    <h2 className="text-xl md:text-3xl font-bold font-serif leading-tight">
                      {heroTitle || "Nourish Your Body. Delight Your Soul."}
                    </h2>
                  </div>
                  {heroSubtitle && (
                    <p className="text-sm text-white/80 max-w-md mx-auto line-clamp-2 mb-3">{heroSubtitle}</p>
                  )}
                  <div
                    className="inline-flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold text-white shadow-lg"
                    style={{ backgroundColor: themeColor }}
                  >
                    Order Now →
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pb-2">
            <Button onClick={handleSave} disabled={saving} className="gap-2 px-8">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Appearance"}
            </Button>
          </div>

          {/* ── Payment Numbers ───────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Smartphone className="h-5 w-5 text-primary" />
                Mobile Payment Numbers
              </CardTitle>
              <CardDescription>
                These numbers are shown to customers at checkout when they select JazzCash or EasyPaisa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                    JazzCash Number
                  </Label>
                  <Input
                    value={jazzCashNumber}
                    onChange={(e) => setJazzCashNumber(e.target.value)}
                    placeholder="e.g. 0300-1234567"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                    EasyPaisa Number
                  </Label>
                  <Input
                    value={easyPaisaNumber}
                    onChange={(e) => setEasyPaisaNumber(e.target.value)}
                    placeholder="e.g. 0311-7654321"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={handleSavePayment} disabled={savingPayment} className="gap-2 px-8">
                  <Save className="h-4 w-4" />
                  {savingPayment ? "Saving..." : "Save Payment Numbers"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
