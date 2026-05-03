import { Link, useLocation, useNavigate } from "@tanstack/react-router";
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
  Home, Calendar, Users2, History, Video, Settings, Building2,
  GraduationCap, HelpCircle, Menu, X, LogOut, UserCircle2, PanelLeftClose, PanelLeft,
  Info, Code2, ChevronDown, ChevronUp, HeartHandshake
} from "lucide-react";
import { Bell, Search, Sparkles, Command, MoreHorizontal, MessageCircle, Headphones, BrainCircuit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NotificationsPopover } from "./NotificationsPopover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AiAssistant } from "./AiAssistant";
import { EllaIcon } from "@/components/EllaIcon";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string };

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/dashboard/meetings", label: "Meetings", icon: Video },
  { to: "/dashboard/schedule", label: "Schedule", icon: Calendar },
  { to: "/dashboard/recordings", label: "Recordings", icon: History },
  { to: "/dashboard/classroom", label: "Classroom", icon: GraduationCap },
  { to: "/dashboard/contacts", label: "Contacts", icon: Users2 },
  { to: "/dashboard/ai", label: "Velora AI", icon: BrainCircuit, badge: "New" },
];

const MORE: NavItem[] = [
  { to: "/dashboard/partners", label: "Partners", icon: HeartHandshake },
  { to: "/dashboard/enterprise", label: "Enterprise", icon: Building2 },
  { to: "/dashboard/academy", label: "Academy", icon: GraduationCap },
  { to: "/dashboard/faq", label: "Help & FAQ", icon: HelpCircle },
];

const SECONDARY: NavItem[] = []; // Now empty as they are in MORE

export function DashboardShell({ children, title, actions }: {
  children: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
}) {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [moreExpanded, setMoreExpanded] = useState(false);

  const name = profile?.display_name || getDisplayName(user);
  const isActive = (path: string) =>
    path === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(path);

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

        {/* Quick start */}
        <div className={`px-3 mt-3 ${collapsed ? "" : "pb-2"}`}>
          <Button
            onClick={() => navigate({ to: "/dashboard" })}
            className={`w-full ${collapsed ? "h-10 px-0" : "h-10"} bg-gradient-primary text-primary-foreground border-0 shadow-glow gap-2`}
            title="Start meeting"
          >
            <Video className="h-4 w-4" />
            {!collapsed && <span>New meeting</span>}
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {NAV.map((item) => (
            <SidebarLink key={item.to} item={item} active={isActive(item.to)} collapsed={collapsed} />
          ))}
          
          <div className="px-3 py-2 mt-4 mb-1">
            <span className={`text-[11px] font-bold text-muted-foreground/60 ${collapsed ? "hidden" : "block"}`}>
              Management
            </span>
            {collapsed && <div className="h-px bg-glass-border/40 w-full" />}
          </div>

          <div className="space-y-0.5">
            <button 
              onClick={() => !collapsed && setMoreExpanded(!moreExpanded)}
              className={`w-full flex items-center gap-2 p-2 rounded-xl text-sm font-medium transition-smooth hover:bg-card/60 text-muted-foreground hover:text-foreground ${collapsed ? "justify-center" : ""}`}
            >
              <MoreHorizontal className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">More options</span>
                  {moreExpanded ? <ChevronUp className="h-3 w-3 opacity-50" /> : <ChevronDown className="h-3 w-3 opacity-50" />}
                </>
              )}
            </button>
            
            {moreExpanded && !collapsed && (
              <div className="pl-4 space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                {MORE.map((item) => (
                  <SidebarLink key={item.to} item={item} active={isActive(item.to)} collapsed={false} />
                ))}
              </div>
            )}
            
            {collapsed && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex justify-center p-2 rounded-xl hover:bg-card/60 text-muted-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="glass border-glass-border p-1 w-52 shadow-brand">
                  {MORE.map((item) => (
                    <DropdownMenuItem key={item.to} asChild className="rounded-lg">
                      <Link to={item.to} className="flex items-center gap-2 w-full cursor-pointer h-10 px-3 font-medium">
                        <item.icon className="h-4 w-4 text-primary" />
                        <span>{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="my-3 border-t border-glass-border/60" />
          {/* Secondary nav is now empty, but keeping the logic in case of future additions */}
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
            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
              {NAV.map((item) => (
                <SidebarLink key={item.to} item={item} active={isActive(item.to)} collapsed={false} onClick={() => setMobileOpen(false)} />
              ))}
              <div className="px-3 py-2 mt-4 mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                Management
              </div>
              {MORE.map((item) => (
                <SidebarLink key={item.to} item={item} active={isActive(item.to)} collapsed={false} onClick={() => setMobileOpen(false)} />
              ))}
              <div className="my-3 border-t border-glass-border/60" />
              {/* Secondary items also moved to MORE in mobile for consistency */}
            </nav>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-glass-border">
          <div className="flex items-center gap-2 px-3 sm:px-6 h-14">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden h-9 w-9 grid place-items-center rounded-md hover:bg-card/60"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-base sm:text-lg font-semibold truncate flex-1">{title}</h1>

            <div className="hidden lg:flex items-center gap-2 mx-6 max-w-md flex-1 relative group">
              <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search meetings, contacts, help..."
                className="pl-10 h-11 bg-card/40 border-glass-border rounded-xl focus:ring-primary/20 focus:bg-card/60 transition-all placeholder:text-muted-foreground/60"
              />
              <div className="absolute right-3 h-6 px-1.5 rounded-md border border-glass-border bg-background/50 text-[10px] font-bold text-muted-foreground grid place-items-center">
                <Command className="h-2.5 w-2.5 mr-0.5" /> K
              </div>
            </div>

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
                  <DropdownMenuItem onClick={() => navigate({ to: "/dashboard/settings" })}>
                    <Settings className="h-4 w-4 mr-2" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/dashboard/about" })}>
                    <Info className="h-4 w-4 mr-2" /> About Velora
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/dashboard/developer" })}>
                    <Code2 className="h-4 w-4 mr-2" /> Developer
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

      {/* Floating Help Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              className="fixed bottom-6 right-6 h-14 w-14 rounded-2xl glass border-glass-border shadow-brand ring-4 ring-background hover:scale-110 active:scale-95 transition-all duration-300 grid place-items-center z-50 group"
              onClick={() => setAiOpen(true)}
            >
              <div className="h-8 w-8 group-hover:rotate-12 transition-transform">
                <EllaIcon />
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="glass border-glass-border py-1 px-2 mr-2 font-bold text-[10px] shadow-brand uppercase tracking-widest">
            Velora AI
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <AiAssistant open={aiOpen} onOpenChange={setAiOpen} />

      <SignOutDialog open={signOutOpen} onOpenChange={setSignOutOpen} />
    </div>
  );
}

function SidebarLink({ item, active, collapsed, onClick }: {
  item: NavItem; active: boolean; collapsed: boolean; onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-smooth ${
        active
          ? "bg-primary/15 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-card/60"
      } ${collapsed ? "justify-center" : ""}`}
      title={collapsed ? item.label : undefined}
    >
      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-primary" : ""}`} />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && item.badge && (
        <span className="ml-auto text-[10px] glass rounded-md px-1.5 py-0.5 text-primary">{item.badge}</span>
      )}
    </Link>
  );
}