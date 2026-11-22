import React from 'react';
import {
  LayoutGrid,
  Info,
  Moon,
  Sun,
  History,
  Sparkles,
  Terminal,
  BookOpen,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Cpu,
  Play
} from 'lucide-react';
import { Logo } from './Logo';
import { formatModelDisplayName, GEMINI_MODEL } from '../types';

export type ViewType = 'about' | 'features' | 'docs' | 'cli' | 'assessment';

interface NavItem {
  id: ViewType;
  label: string;
  shortLabel: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
}

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  {
    id: 'assessment',
    label: 'Audit Studio',
    shortLabel: 'Studio',
    subtitle: 'Hybrid AST + Gemini 4 Workbench',
    icon: LayoutGrid
  },
  {
    id: 'about',
    label: 'Overview & DLP',
    shortLabel: 'Overview',
    subtitle: 'Architecture & Client-Side Privacy',
    icon: Info
  },
  {
    id: 'features',
    label: 'Capabilities',
    shortLabel: 'Features',
    subtitle: '12 Cloud Governance Modules',
    icon: Sparkles
  },
  {
    id: 'docs',
    label: 'Docs & Releases',
    shortLabel: 'Docs',
    subtitle: 'Engineering Manual & Changelog',
    icon: BookOpen
  },
  {
    id: 'cli',
    label: 'CLI & CI/CD',
    shortLabel: 'CLI',
    subtitle: 'dra-cli PR Bot & SARIF Gates',
    icon: Terminal
  }
];

interface CommandRailProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onBackToSplash?: () => void;
}

export const CommandRail: React.FC<CommandRailProps> = ({
  currentView,
  onNavigate,
  collapsed,
  onToggleCollapse,
  onBackToSplash
}) => {
  return (
    <aside
      aria-label="Workspace navigation rail"
      className={`hidden lg:flex flex-col shrink-0 sticky top-0 h-screen border-r border-slate-200 dark:border-slate-800/90 bg-white/95 dark:bg-[#090e1a]/95 backdrop-blur-xl z-40 transition-[width] duration-200 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div
        className={`h-16 px-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        <button
          type="button"
          onClick={() => (onBackToSplash ? onBackToSplash() : onNavigate('assessment'))}
          className="flex items-center gap-3 text-left group rounded-xl p-1"
          title="Deployment Readiness Auditor v3.1"
        >
          <Logo size="sm" animate={false} />
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-slate-900 dark:text-white leading-none">
                  DRA<span className="text-blue-600 dark:text-sky-400">.</span>studio
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-600/10 dark:bg-sky-400/15 text-blue-700 dark:text-sky-300 border border-blue-600/20 dark:border-sky-400/25">
                  v3.1
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Cloud Readiness Gate
              </span>
            </div>
          )}
        </button>

        {!collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Collapse navigation rail"
            title="Collapse sidebar"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <PanelLeftClose className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Primary Semantic Navigation List */}
      <nav aria-label="Primary" className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-1.5">
          {PRIMARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  title={collapsed ? `${item.label} — ${item.subtitle}` : undefined}
                  className={`w-full flex items-center gap-3 rounded-xl transition-all ${
                    collapsed ? 'justify-center p-3' : 'px-3.5 py-2.5 text-left'
                  } ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 font-semibold'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                    }`}
                    aria-hidden="true"
                  />
                  {!collapsed && (
                    <div className="min-w-0 flex-1">
                      <div className="text-xs leading-tight truncate">{item.label}</div>
                      <div
                        className={`text-[10px] truncate mt-0.5 ${
                          isActive
                            ? 'text-blue-100 font-medium'
                            : 'text-slate-500 dark:text-slate-400 font-normal'
                        }`}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Security Badge & Expand Trigger */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
        {collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expand navigation rail"
            title="Expand sidebar"
            className="w-full p-2.5 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <PanelLeftOpen className="w-4 h-4" aria-hidden="true" />
          </button>
        ) : (
          <div className="p-3 rounded-xl bg-emerald-500/8 dark:bg-emerald-950/30 border border-emerald-500/20 flex items-start gap-2.5">
            <ShieldCheck
              className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="text-[11px] leading-snug">
              <div className="font-bold text-slate-900 dark:text-white">
                Client-Side DLP Active
              </div>
              <div className="text-slate-600 dark:text-slate-400 text-[10px] mt-0.5">
                Secrets scrubbed locally before wire transmission.
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

interface HeaderProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  onToggleHistory: () => void;
  historyCount?: number;
  activeModel?: string;
  onRunDemo?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  isDarkMode,
  toggleTheme,
  onToggleHistory,
  historyCount = 0,
  activeModel,
  onRunDemo
}) => {
  const activeNav =
    PRIMARY_NAV_ITEMS.find((i) => i.id === currentView) || PRIMARY_NAV_ITEMS[0];
  const engineLabel = formatModelDisplayName(activeModel || GEMINI_MODEL);

  const handleMobileSelect = (view: ViewType) => {
    const pop = document.getElementById('dra-mobile-nav') as
      | (HTMLElement & { hidePopover?: () => void })
      | null;
    pop?.hidePopover?.();
    onNavigate(view);
  };

  return (
    <header className="w-full h-16 bg-white/85 dark:bg-[#090e1a]/85 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/90 sticky top-0 z-30">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Button + Active Section Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Popover Menu Trigger (per modern-web-guidance `navbar`) */}
          <button
            type="button"
            popoverTarget="dra-mobile-nav"
            aria-label="Open navigation menu"
            className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>

          <div className="lg:hidden flex items-center gap-2">
            <Logo size="sm" animate={false} />
            <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white">
              DRA<span className="text-blue-600 dark:text-sky-400">.</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2.5 min-w-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Workspace
            </span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
              /
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {activeNav.label}
            </span>
          </div>

          <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 ml-2">
            <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" aria-hidden="true" />
            <span>Engine:</span>
            <span className="font-bold text-blue-700 dark:text-sky-300">{engineLabel}</span>
          </div>
        </div>

        {/* Right: Quick Studio Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {onRunDemo && (
            <button
              type="button"
              onClick={onRunDemo}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Play className="w-3 h-3 text-blue-600 dark:text-sky-400 fill-current" aria-hidden="true" />
              Showcase
            </button>
          )}

          <button
            type="button"
            id="header-history-btn"
            onClick={onToggleHistory}
            aria-label="Open audit history and drift comparison"
            title="Audit History & Drift Comparison"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <History className="w-4 h-4 text-slate-600 dark:text-slate-300" aria-hidden="true" />
            <span className="hidden md:inline">History</span>
            {historyCount > 0 && (
              <span className="tabular-nums px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                {historyCount}
              </span>
            )}
          </button>

          <button
            type="button"
            id="header-theme-btn"
            onClick={toggleTheme}
            aria-label={isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Native Popover Mobile Navigation Drawer (light-dismiss + Esc + top-layer) */}
      <div
        id="dra-mobile-nav"
        popover="auto"
        className="m-0 p-0 w-80 max-w-[88vw] h-dvh bg-white dark:bg-[#0b111e] text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800 shadow-2xl"
      >
        <div className="flex flex-col h-full">
          <div className="h-16 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Logo size="sm" animate={false} />
              <span className="font-black text-base tracking-tight">
                DRA<span className="text-blue-600 dark:text-sky-400">.</span>studio v3.1
              </span>
            </div>
            <button
              type="button"
              popoverTarget="dra-mobile-nav"
              popoverTargetAction="hide"
              aria-label="Close navigation menu"
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <nav aria-label="Mobile Primary" className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1.5">
              {PRIMARY_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleMobileSelect(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <div>
                        <div className="text-sm">{item.label}</div>
                        <div
                          className={`text-xs ${
                            isActive ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {item.subtitle}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};
