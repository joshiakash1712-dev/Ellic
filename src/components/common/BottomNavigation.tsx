import React from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Receipt,
  Package,
  Users,
  BarChart3,
  Zap,
  Building2,
  Sliders,
  ShieldCheck,
  Menu
} from 'lucide-react';

interface BottomNavigationProps {
  activeView: string;
  onSelectView: (view: string) => void;
  onOpenMenu?: () => void;
  isMenuOpen?: boolean;
}

interface BottomTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  badgeCount?: number;
  highlightBadge?: boolean;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeView,
  onSelectView,
  onOpenMenu,
  isMenuOpen = false
}) => {
  const { activeModule, products, activeRole } = useStore();
  const { userProfile } = useAuth();
  const isCrew = activeRole === 'crew' || userProfile?.role === 'crew';

  const lowStockCount = products.filter(p => p.stock <= p.minThreshold).length;

  // Retailer Critical Actions for Crew: Strictly daily-work POS, Stock, My Sales, and Menu
  const crewTabs: BottomTab[] = [
    {
      id: 'pos',
      label: 'POS Bill',
      icon: <Receipt className="w-5 h-5" />
    },
    {
      id: 'inventory',
      label: 'Stock',
      icon: <Package className="w-5 h-5" />,
      badgeCount: lowStockCount > 0 ? lowStockCount : undefined,
      highlightBadge: lowStockCount > 0
    },
    {
      id: 'my_sales',
      label: 'My Sales',
      icon: <Receipt className="w-5 h-5" />
    },
    {
      id: 'more',
      label: 'Menu',
      icon: <Menu className="w-5 h-5" />
    }
  ];

  // Retailer Critical Actions for Client/Store Owner: Home, POS, Stock, Clients, More
  const clientTabs: BottomTab[] = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
      id: 'pos',
      label: 'POS',
      icon: <Receipt className="w-5 h-5" />
    },
    {
      id: 'inventory',
      label: 'Stock',
      icon: <Package className="w-5 h-5" />,
      badgeCount: lowStockCount > 0 ? lowStockCount : undefined,
      highlightBadge: lowStockCount > 0
    },
    {
      id: 'crm',
      label: 'Customers',
      icon: <Users className="w-5 h-5" />
    },
    {
      id: 'more',
      label: 'More',
      icon: <Menu className="w-5 h-5" />
    }
  ];

  // Wholesaler Critical Actions: Orders, Catalog, Retailers, More
  const wholesalerTabs: BottomTab[] = [
    {
      id: 'wholesaler_portal',
      label: 'Orders',
      icon: <Zap className="w-5 h-5" />
    },
    {
      id: 'wholesaler_catalog',
      label: 'Catalog',
      icon: <Package className="w-5 h-5" />
    },
    {
      id: 'wholesaler_retailers',
      label: 'Retailers',
      icon: <Building2 className="w-5 h-5" />
    },
    {
      id: 'more',
      label: 'More',
      icon: <Menu className="w-5 h-5" />
    }
  ];

  // Admin Critical Actions: Console, UX Journey, More
  const adminTabs: BottomTab[] = [
    {
      id: 'admin_dashboard',
      label: 'Console',
      icon: <Sliders className="w-5 h-5" />
    },
    {
      id: 'journey_map',
      label: 'Journey',
      icon: <ShieldCheck className="w-5 h-5" />
    },
    {
      id: 'more',
      label: 'More',
      icon: <Menu className="w-5 h-5" />
    }
  ];

  const currentTabs =
    activeModule === 'retailer'
      ? (isCrew ? crewTabs : clientTabs)
      : activeModule === 'wholesaler'
      ? wholesalerTabs
      : adminTabs;

  // Secondary views that live inside the More/Drawer menu
  const extendedViews = ['suppliers', 'reports', 'templates', 'employees', 'journey_map'];

  return (
    <nav
      id="native-android-bottom-navigation"
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-slate-800 md:hidden min-h-[68px] px-1.5 py-1 shadow-2xl flex items-center justify-around select-none safe-area-bottom overflow-hidden"
    >
      {/* Subtle brand backdrop behind the glass mobile bar */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-600/10 via-slate-900/60 to-sky-600/10 pointer-events-none" />
      {currentTabs.map(tab => {
        const isMoreTab = tab.id === 'more';
        const isActive = isMoreTab
          ? isMenuOpen || (!currentTabs.some(t => t.id === activeView && t.id !== 'more') && extendedViews.includes(activeView))
          : activeView === tab.id;

        return (
          <button
            key={tab.id}
            id={`bottom-nav-tab-${tab.id}`}
            onClick={() => {
              if (isMoreTab) {
                if (onOpenMenu) {
                  onOpenMenu();
                }
              } else {
                onSelectView(tab.id);
              }
            }}
            className="flex-1 h-full min-w-[48px] min-h-[48px] p-1.5 flex flex-col items-center justify-center transition-all active:scale-95 group focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl focus:outline-none touch-manipulation"
            aria-current={isActive ? 'page' : undefined}
            title={tab.label}
          >
            {/* Material 3 Active Indicator Pill with enlarged touch target padding */}
            <div
              className={`relative min-w-[48px] min-h-[32px] flex items-center justify-center px-3.5 sm:px-4 py-1.5 rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-blue-500/20 text-sky-400 border border-blue-500/35 shadow-sm shadow-blue-500/10 scale-105'
                  : 'text-slate-400 group-hover:text-slate-200'
              }`}
            >
              {tab.icon}

              {/* Notification / Alert Badge */}
              {tab.badgeCount !== undefined && (
                <span
                  className={`absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center border border-slate-900 shadow-sm ${
                    tab.highlightBadge
                      ? 'bg-amber-500 text-slate-950 animate-pulse'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {tab.badgeCount}
                </span>
              )}
            </div>

            {/* Tab Label - Short, robust and unclipped on 360px+ screens */}
            <span
              className={`text-[10px] mt-0.5 tracking-tight truncate max-w-[68px] text-center transition-colors ${
                isActive ? 'font-bold text-sky-400' : 'font-medium text-slate-400 group-hover:text-slate-300'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
