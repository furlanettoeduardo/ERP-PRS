import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut,
  Package,
  ShoppingCart,
  BarChart3,
  Warehouse,
  Plug,
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
    href: '/usuarios',
    icon: Users,
  },
  {
    title: 'Estoque',
    href: '/estoque',
    icon: Warehouse,
  },
  {
    title: 'Produtos',
    href: '/produtos',
    icon: Package,
  },
  {
    title: 'Pedidos',
    href: '/pedidos',
    icon: ShoppingCart,
  },
  {
    title: 'Integrações',
    href: '/integracoes',
    icon: Plug,
  },
  {
    title: 'Relatórios',
    href: '/relatorios',
    icon: BarChart3,
  },
  {
    title: 'Configurações',
    href: '/configuracoes',
    icon: Settings,
  },
];
