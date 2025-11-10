import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut,
  Package,
  ShoppingCart,
  BarChart3,
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: any;
  badge?: number;
}

export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Usuários',
    href: '/dashboard/users',
    icon: Users,
  },
  {
    title: 'Produtos',
    href: '/dashboard/products',
    icon: Package,
  },
  {
    title: 'Pedidos',
    href: '/dashboard/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Relatórios',
    href: '/dashboard/reports',
    icon: BarChart3,
  },
  {
    title: 'Configurações',
    href: '/dashboard/settings',
    icon: Settings,
  },
];
