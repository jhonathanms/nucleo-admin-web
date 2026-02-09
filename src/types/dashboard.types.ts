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

export interface FinancialStatusData {
  name: string;
  value: number;
  color: string;
}

export interface Activity {
  id: number;
  action: string;
  usuario: string;
  entidade: string;
  tempo: string;
}

export interface TituloDashboard {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteCodigoCrm: string;
  valor: number;
  dataVencimento: string;
  status: string;
}

export interface LicencaDashboard {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteCodigoCrm: string;
  produtoId: string;
  produtoNome: string;
  planoId: string;
  planoNome: string;
  dataExpiracao: string;
  status: string;
}

export interface DashboardData {
  stats: DashboardStats;
  revenueChart: RevenueData[];
  licenseStatusChart: LicenseStatusData[];
  financialStatusChart: FinancialStatusData[];
  recentActivities: Activity[];
  titulosVencendoHoje: TituloDashboard[];
  titulosVencidos: TituloDashboard[];
  titulosRecentes: TituloDashboard[];
  licencasExpirandoHoje: LicencaDashboard[];
  licencasExpiradas: LicencaDashboard[];
  licencasRecentes: LicencaDashboard[];
}
