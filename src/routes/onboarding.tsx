import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Globe, Clock, User, CheckCircle2, ShieldCheck, 
  ArrowRight, Loader2, Camera, MapPin
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/Avatar";

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guyana",
  "Haiti", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
  "Oman",
  "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar",
  "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen",
  "Zambia", "Zimbabwe"
];

function OnboardingComponent() {
  const { user } = useAuth();
  const { profile, refresh } = useProfile();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [country, setCountry] = useState("");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setCountry(profile.country || "");
      setTimezone(profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
      setAvatarUrl(profile.avatar_url || null);
      if (profile.terms_accepted_at) {
        navigate({ to: "/dashboard" });
      }
    }
  }, [profile, navigate]);

  const handleFinish = async () => {
    if (!user) {
      toast.error("You must be signed in to complete setup.");
      return;
    }
    if (!termsAccepted) {
      toast.error("Please accept the terms and conditions to continue.");
      return;
    }

    setLoading(true);
    try {
      console.log("Upserting profile for user:", user.id);
      
      // We try to upsert using both potential ID columns to be safe
      const profileData = {
        id: user.id,
        user_id: user.id,
        display_name: displayName,
        country,
        timezone,
        terms_accepted_at: new Date().toISOString(),
        avatar_url: avatarUrl,
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(profileData); 

      if (error) {
        console.error("Primary upsert failed, trying update instead...", error);
        // Fallback to update if upsert isn't allowed or fails on constraints
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            display_name: displayName,
            country,
            timezone,
            terms_accepted_at: new Date().toISOString(),
            avatar_url: avatarUrl,
          })
          .eq("user_id", user.id);
        
        if (updateError) {
          console.error("Secondary update also failed:", updateError);
          throw new Error(updateError.message);
        }
      }

      toast.success("Welcome to Velora!");
      await refresh();
      // Small delay to ensure DB consistency before navigation
      setTimeout(() => navigate({ to: "/dashboard" }), 800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Database error";
      toast.error(`Failed to save profile: ${msg}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setLoading(true);
      const path = `avatars/${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(publicUrl);
      toast.success("Avatar uploaded!");
    } catch (err) {
      toast.error("Failed to upload avatar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-xl">
        <div className="flex justify-center mb-12 scale-110">
          <Logo />
        </div>

        <div className="glass rounded-[2.5rem] p-8 sm:p-12 shadow-elegant border-primary/20 relative">
          <div className="flex gap-2 mb-8 justify-center">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? 'w-8 bg-primary' : 'w-2 bg-muted'}`} 
              />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <h2 className="text-3xl font-black tracking-tight mb-2">Build your profile</h2>
                <p className="text-muted-foreground">Let's start with the basics.</p>
              </div>

              <div className="flex flex-col items-center gap-6">
                <div className="relative group">
                  <Avatar name={displayName || "User"} src={avatarUrl} size="xl" className="h-32 w-32 ring-4 ring-primary/10 group-hover:ring-primary/30 transition-all shadow-glow" />
                  <label className="absolute bottom-0 right-0 h-10 w-10 bg-primary text-white rounded-full border-4 border-background grid place-items-center cursor-pointer hover:scale-110 transition-transform shadow-lg">
                    <Camera className="h-5 w-5" />
                    <input type="file" className="hidden" onChange={uploadAvatar} accept="image/*" />
                  </label>
                </div>
                <div className="w-full space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest font-bold ml-1">Display name</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={displayName} 
                        onChange={e => setDisplayName(e.target.value)} 
                        placeholder="What should we call you?" 
                        className="bg-card/40 h-12 pl-12 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setStep(2)} 
                  className="flex-1 rounded-2xl h-14 font-bold border-glass-border"
                >
                  Skip for now
                </Button>
                <Button 
                  onClick={() => setStep(2)} 
                  disabled={!displayName} 
                  className="flex-1 bg-primary text-white rounded-2xl h-14 text-lg font-bold shadow-glow group"
                >
                  Continue <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center">
                <h2 className="text-3xl font-black tracking-tight mb-2">Localization</h2>
                <p className="text-muted-foreground">Help us customize your experience.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest font-bold ml-1">Country</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <select 
                      value={country} 
                      onChange={e => setCountry(e.target.value)}
                      className="w-full bg-card/40 h-12 pl-12 rounded-xl border border-glass-border focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none text-sm"
                    >
                      <option value="" disabled>Select your country</option>
                      {COUNTRIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest font-bold ml-1">Timezone</Label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <select 
                      value={timezone} 
                      onChange={e => setTimezone(e.target.value)}
                      className="w-full bg-card/40 h-12 pl-12 rounded-xl border border-glass-border focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none text-sm"
                    >
                      {Intl.supportedValuesOf('timeZone').map(tz => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 rounded-2xl h-14 font-bold border-glass-border">Back</Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setStep(3)} 
                  className="flex-1 rounded-2xl h-14 font-bold border-glass-border"
                >
                  Skip for now
                </Button>
                <Button 
                  onClick={() => setStep(3)} 
                  className="flex-1 bg-primary text-white rounded-2xl h-14 text-lg font-bold shadow-glow group"
                >
                  Continue <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center">
                <h2 className="text-3xl font-black tracking-tight mb-2">Legal & security</h2>
                <p className="text-muted-foreground">Final steps to secure your account.</p>
              </div>

              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary grid place-items-center shrink-0">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Terms of service</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">By checking the box below, you agree to our <Link to="/terms" className="text-primary hover:underline font-bold">terms of service</Link> and privacy policy regarding your data and usage of Velora.</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-background/40 rounded-2xl border border-glass-border">
                    <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(v) => setTermsAccepted(!!v)} className="h-5 w-5 rounded-md border-primary" />
                    <label htmlFor="terms" className="text-sm font-medium leading-none cursor-pointer">
                      I accept the terms and conditions
                    </label>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-muted/20 border border-glass-border flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <p className="text-xs font-medium text-muted-foreground">Your account is secured with end-to-end encryption.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setStep(2)} className="flex-1 rounded-2xl h-14 font-bold border-glass-border">Back</Button>
                <Button 
                  onClick={handleFinish} 
                  disabled={!termsAccepted || loading} 
                  className="flex-1 bg-primary text-white rounded-2xl h-14 text-lg font-bold shadow-glow"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                  Finish setup
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/onboarding")({
  component: OnboardingComponent,
});
