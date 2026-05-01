import { useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth, getDisplayName } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Avatar } from "@/components/Avatar";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { SignOutDialog } from "@/components/SignOutDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2, Users, CreditCard, Settings, ShieldCheck, 
  Menu, X, LogOut, UserCircle2, PanelLeftClose, PanelLeft,
  ArrowLeft, Activity, Globe
} from "lucide-react";
import { NotificationsPopover } from "./NotificationsPopover";

type NavItem = { id: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string };

const NAV: NavItem[] = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "members", label: "Team Members", icon: Users },
  { id: "security", label: "Security & SSO", icon: ShieldCheck },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "settings", label: "Settings", icon: Settings },
];

export function OrgShell({ children, title, actions, orgName, activeTab, onTabChange, onBackToOrgs }: {
  children: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
  orgName?: string;
  activeTab: string;
  onTabChange: (id: string) => void;
  onBackToOrgs?: () => void;
}) {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);

  const name = profile?.display_name || getDisplayName(user);

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Sidebar — desktop */}
      <aside
        className={`hidden md:flex flex-col shrink-0 h-full border-r border-glass-border bg-sidebar/60 backdrop-blur-2xl transition-all duration-300 ${collapsed ? "w-[72px]" : "w-64"}`}
      >
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} px-3 py-4 border-b border-glass-border`}>
          {!collapsed && <Logo />}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="h-8 w-8 grid place-items-center rounded-md hover:bg-card/60 text-muted-foreground hover:text-foreground"
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        {/* Back to Personal / Switch Org */}
        <div className={`px-3 mt-3 ${collapsed ? "" : "pb-2"}`}>
          {onBackToOrgs ? (
            <Button
              onClick={onBackToOrgs}
              variant="outline"
              className={`w-full ${collapsed ? "h-10 px-0" : "h-10"} border-glass-border gap-2 hover:bg-card/60`}
              title="Switch Organization"
            >
              <ArrowLeft className="h-4 w-4" />
              {!collapsed && <span>Switch Organization</span>}
            </Button>
          ) : (
            <Button
              onClick={() => navigate({ to: "/dashboard" })}
              variant="outline"
              className={`w-full ${collapsed ? "h-10 px-0" : "h-10"} border-glass-border gap-2 hover:bg-card/60`}
              title="Back to Personal"
            >
              <ArrowLeft className="h-4 w-4" />
              {!collapsed && <span>Personal Workspace</span>}
            </Button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          <div className={`px-3 mb-2 mt-2 ${collapsed ? "hidden" : "block"}`}>
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{orgName || "Organization"}</p>
          </div>
          {NAV.map((item) => (
            <SidebarLink key={item.id} item={item} active={activeTab === item.id} collapsed={collapsed} onClick={() => onTabChange(item.id)} />
          ))}
        </nav>

        {/* Profile footer */}
        <button
          onClick={() => navigate({ to: "/profile" })}
          className={`m-2 p-2 rounded-xl flex items-center gap-2 hover:bg-card/60 text-left ${collapsed ? "justify-center" : ""}`}
        >
          <Avatar name={name} src={profile?.avatar_url} size="sm" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}
        </button>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-sidebar border-r border-glass-border flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-glass-border">
              <Logo />
              <button onClick={() => setMobileOpen(false)} className="h-8 w-8 grid place-items-center rounded-md hover:bg-card/60">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-3 mt-3 pb-2">
              {onBackToOrgs ? (
                <Button
                  onClick={() => { setMobileOpen(false); onBackToOrgs(); }}
                  variant="outline"
                  className="w-full h-10 border-glass-border gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Switch Organization</span>
                </Button>
              ) : (
                <Button
                  onClick={() => { setMobileOpen(false); navigate({ to: "/dashboard" }); }}
                  variant="outline"
                  className="w-full h-10 border-glass-border gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Personal Workspace</span>
                </Button>
              )}
            </div>
            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
              <div className="px-3 mb-2 mt-2">
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{orgName || "Organization"}</p>
              </div>
              {NAV.map((item) => (
                <SidebarLink key={item.id} item={item} active={activeTab === item.id} collapsed={false} onClick={() => { setMobileOpen(false); onTabChange(item.id); }} />
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-glass-border">
          <div className="flex items-center gap-2 px-3 sm:px-6 h-14">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden h-9 w-9 grid place-items-center rounded-md hover:bg-card/60"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-base sm:text-lg font-semibold truncate flex-1 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> {title}
            </h1>

            <div className="flex items-center gap-1 sm:gap-2">
              {actions}
              <NotificationsPopover />
              <ThemeToggle />
              <div className="h-6 w-[1px] bg-glass-border mx-1 hidden sm:block" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    <Avatar name={name} src={profile?.avatar_url} size="sm" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass border-glass-border w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="text-sm font-medium truncate">{name}</div>
                    <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                    <UserCircle2 className="h-4 w-4 mr-2" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSignOutOpen(true)}>
                    <LogOut className="h-4 w-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      <SignOutDialog open={signOutOpen} onOpenChange={setSignOutOpen} />
    </div>
  );
}

function SidebarLink({ item, active, collapsed, onClick }: {
  item: NavItem; active: boolean; collapsed: boolean; onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-smooth ${
        active
          ? "bg-primary/15 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-card/60"
      } ${collapsed ? "justify-center" : "text-left"}`}
      title={collapsed ? item.label : undefined}
    >
      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-primary" : ""}`} />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && item.badge && (
        <span className="ml-auto text-[10px] glass rounded-md px-1.5 py-0.5 text-primary">{item.badge}</span>
      )}
    </button>
  );
}
