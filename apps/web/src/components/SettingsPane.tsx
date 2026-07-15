import {
  ChevronLeft,
  ChevronRight,
  Database,
  Shield,
  SlidersHorizontal,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import type { ShortcutSettings } from "@/lib/app-helpers";
import { WORKSPACE_PAGE_TITLE_CLASSNAME } from "@/lib/workspace-ui";
import { cn } from "@/lib/utils";
import { AdvancedPlayCard } from "./settings/AdvancedPlayCard";
import { DataExportCard } from "./settings/DataExportCard";
import { EvernoteImportGuideCard } from "./settings/EvernoteImportGuideCard";
import { McpConfigCard } from "./settings/McpConfigCard";
import { PreferenceCard } from "./settings/PreferenceCard";
import { PasswordCard } from "./settings/PasswordCard";
import { SessionCard } from "./settings/SessionCard";
import { SystemInfoCard } from "./settings/SystemInfoCard";
import { UserManagementCard } from "./settings/UserManagementCard";
import { ThemeToggle } from "./ThemeToggle";

interface SettingsPaneProps {
  onClose: () => void;
  imageCompressionEnabled: boolean;
  onImageCompressionChange: (enabled: boolean) => void;
  shortcutSettings: ShortcutSettings;
  onShortcutSettingsChange: (settings: ShortcutSettings) => void;
  onLogout: () => void;
  isLoggingOut: boolean;
  authRequired: boolean;
  demoMode: boolean;
  isOwner: boolean;
  onShowGuide?: () => void;
}

const SettingsGroup = ({ children }: { children: ReactNode }) => (
  <div className="min-w-0 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950 [&>*]:rounded-none [&>*]:border-0 [&>*]:bg-transparent [&>*]:dark:bg-transparent">
    {children}
  </div>
);

type TabKey = "general" | "users" | "data" | "ai" | "account";

interface TabItem {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgColorClass: string;
  hoverColorClass: string;
  iconColorClass: string;
}

export const SettingsPane = ({
  onClose,
  imageCompressionEnabled,
  onImageCompressionChange,
  shortcutSettings,
  onShortcutSettingsChange,
  onLogout,
  isLoggingOut,
  authRequired,
  demoMode,
  isOwner,
  onShowGuide,
}: SettingsPaneProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>("general");
  const [activeMobileTab, setActiveMobileTab] = useState<TabKey | null>(null);

  const tabItems: TabItem[] = [
    {
      key: "general",
      label: t("settings.tabs.general"),
      icon: SlidersHorizontal,
      colorClass: "text-emerald-700 dark:text-emerald-400",
      bgColorClass: "bg-emerald-50/80 dark:bg-emerald-950/40",
      hoverColorClass: "hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20",
      iconColorClass: "text-emerald-600 dark:text-emerald-400",
    },
    ...(isOwner
      ? [
          {
            key: "users" as const,
            label: t("users.title"),
            icon: Users,
            colorClass: "text-emerald-700 dark:text-emerald-400",
            bgColorClass: "bg-emerald-50/80 dark:bg-emerald-950/40",
            hoverColorClass: "hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20",
            iconColorClass: "text-emerald-600 dark:text-emerald-400",
          },
        ]
      : []),
    {
      key: "data",
      label: t("settings.tabs.data"),
      icon: Database,
      colorClass: "text-emerald-700 dark:text-emerald-400",
      bgColorClass: "bg-emerald-50/80 dark:bg-emerald-950/40",
      hoverColorClass: "hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20",
      iconColorClass: "text-emerald-600 dark:text-emerald-400",
    },
    {
      key: "ai",
      label: t("settings.tabs.ai"),
      icon: Sparkles,
      colorClass: "text-emerald-700 dark:text-emerald-400",
      bgColorClass: "bg-emerald-50/80 dark:bg-emerald-950/40",
      hoverColorClass: "hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20",
      iconColorClass: "text-emerald-600 dark:text-emerald-400",
    },
    {
      key: "account",
      label: t("settings.tabs.account"),
      icon: Shield,
      colorClass: "text-emerald-700 dark:text-emerald-400",
      bgColorClass: "bg-emerald-50/80 dark:bg-emerald-950/40",
      hoverColorClass: "hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20",
      iconColorClass: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  const handleBack = () => {
    if (activeMobileTab !== null) {
      setActiveMobileTab(null);
    } else {
      onClose();
    }
  };

  const getHeaderTitle = () => {
    if (activeMobileTab !== null) {
      const activeItem = tabItems.find((item) => item.key === activeMobileTab);
      return activeItem ? activeItem.label : t("settings.title");
    }
    return t("settings.title");
  };

  const HeaderIcon = (() => {
    if (activeMobileTab !== null) {
      const activeItem = tabItems.find((item) => item.key === activeMobileTab);
      return activeItem ? activeItem.icon : User;
    }
    return User;
  })();

  const HeaderIconColorClass = (() => {
    if (activeMobileTab !== null) {
      const activeItem = tabItems.find((item) => item.key === activeMobileTab);
      return activeItem ? activeItem.iconColorClass : "text-emerald-700 dark:text-emerald-400";
    }
    return "text-emerald-700 dark:text-emerald-400";
  })();

  const renderTabContent = (key: TabKey) => {
    switch (key) {
      case "general":
        return (
          <SettingsGroup>
            <PreferenceCard
              imageCompressionEnabled={imageCompressionEnabled}
              onImageCompressionChange={onImageCompressionChange}
              shortcutSettings={shortcutSettings}
              onShortcutSettingsChange={onShortcutSettingsChange}
            />
            <SystemInfoCard />
          </SettingsGroup>
        );
      case "users":
        return isOwner ? (
          <SettingsGroup>
            <UserManagementCard />
          </SettingsGroup>
        ) : null;
      case "data":
        return (
          <SettingsGroup>
            <DataExportCard />
            <EvernoteImportGuideCard onShowGuide={onShowGuide} />
          </SettingsGroup>
        );
      case "ai":
        return (
          <SettingsGroup>
            <AdvancedPlayCard />
            <McpConfigCard />
          </SettingsGroup>
        );
      case "account":
        return (
          <SettingsGroup>
            <PasswordCard authRequired={authRequired} demoMode={demoMode} />
            <SessionCard authRequired={authRequired} isLoggingOut={isLoggingOut} onLogout={onLogout} />
          </SettingsGroup>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-x-hidden bg-slate-50 dark:bg-slate-900/40">
      <header className="flex h-[calc(3.5rem+env(safe-area-inset-top))] shrink-0 items-end justify-between border-b border-slate-200 bg-white px-4 pb-3 pt-[env(safe-area-inset-top)] dark:border-slate-800 dark:bg-slate-950 lg:h-16 lg:items-center lg:px-6 lg:pb-0 lg:pt-0">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            title={t("common.back")}
            aria-label={t("common.back")}
            onClick={handleBack}
            className="h-9 w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            <ChevronLeft className="h-5 w-5 text-slate-500" />
          </Button>
          <div className="min-w-0">
            <h1 className={`flex items-center gap-2 ${WORKSPACE_PAGE_TITLE_CLASSNAME}`}>
              <HeaderIcon className={cn("h-4 w-4 shrink-0 transition-colors", HeaderIconColorClass)} />
              <span className="truncate text-slate-900 dark:text-slate-100">{getHeaderTitle()}</span>
            </h1>
          </div>
        </div>
        <ThemeToggle className="inline-flex" showLabel />
      </header>

      <div className="flex flex-1 min-h-0 min-w-0 bg-slate-50/50 dark:bg-slate-900/20">
        {/* 桌面端布局：双栏 */}
        <div className="hidden lg:flex flex-1 min-h-0 min-w-0 mx-auto max-w-5xl px-6 py-6 gap-6">
          {/* 左侧垂直 Tab 栏 */}
          <aside className="w-52 shrink-0 flex flex-col gap-1">
            {tabItems.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveTab(item.key)}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 text-left w-full",
                    isSelected
                      ? `${item.colorClass} ${item.bgColorClass}`
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0 transition-colors", isSelected ? item.colorClass : "text-slate-400 dark:text-slate-500")} />
                  {item.label}
                </button>
              );
            })}
          </aside>

          {/* 右侧设置内容区 */}
          <main className="flex-1 min-w-0 overflow-y-auto pr-2">
            <div className="grid gap-4">
              {renderTabContent(activeTab)}
            </div>
          </main>
        </div>

        {/* 移动端布局 */}
        <div className="flex lg:hidden flex-1 flex-col min-h-0 min-w-0 overflow-y-auto px-4 py-4">
          {activeMobileTab === null ? (
            /* 分类主菜单 */
            <div className="grid gap-2">
              <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950">
                {tabItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActiveMobileTab(item.key)}
                      className="flex items-center justify-between gap-4 p-4 text-left hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors w-full"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", item.bgColorClass)}>
                          <Icon className={cn("h-4 w-4", item.iconColorClass)} />
                        </div>
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.label}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-600" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* 详情页面 */
            <div className="grid gap-4">
              {renderTabContent(activeMobileTab)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
