export interface DashboardStats {
  totalClientes: number;
  licencasAtivas: number;
  usuariosAtivos: number;
  receitaMensal: number;
  clientesTrend: number;
  licencasTrend: number;
  usuariosTrend: number;
  receitaTrend: number;
}

export interface RevenueData {
  mes: string;
  valor: number;
}

export interface LicenseStatusData {
  name: string;
  value: number;
  color: string;
}

export interface Activity {
  id: number;
  action: string;
  cliente: string;
  tempo: string;
}

export interface Alert {
  id: number;
  tipo: "warning" | "destructive" | "info";
  mensagem: string;
}

export interface DashboardData {
  stats: DashboardStats;
  revenueChart: RevenueData[];
  licenseStatusChart: LicenseStatusData[];
  recentActivities: Activity[];
  alerts: Alert[];
}
