import clienteService from "./cliente.service";
import licencaService from "./licenca.service";
import usuarioService from "./usuario.service";
import financeiroService from "./financeiro.service";
import auditoriaService from "./auditoria.service";
import { DashboardData, RevenueData, Alert } from "@/types/dashboard.types";

class DashboardService {
  async getDashboardData(): Promise<DashboardData> {
    try {
      // Fetch counts in parallel
      const [clientesRes, licencasRes, usuariosRes, titulosRes, logsRes] =
        await Promise.all([
          clienteService.getAll({ size: 1 }),
          licencaService.getAll({ size: 1000 }), // Fetch more to calculate status distribution
          usuarioService.getAll({ size: 1 }),
          financeiroService.getAll({ size: 1000 }), // Fetch more to calculate revenue
          auditoriaService.getAll({ size: 5, sort: "dataHora,desc" }),
        ]);

      const totalClientes = clientesRes.totalElements;
      const totalLicencas = licencasRes.totalElements;
      const totalUsuarios = usuariosRes.totalElements;

      // Calculate License Status Distribution
      const licencas = licencasRes.content;
      const statusCounts: Record<string, number> = {
        ATIVO: 0,
        TRIAL: 0,
        SUSPENSO: 0,
        CANCELADO: 0,
        EXPIRADO: 0,
        INATIVO: 0,
      };

      licencas.forEach((l) => {
        if (statusCounts[l.status] !== undefined) {
          statusCounts[l.status]++;
        }
      });

      const licenseStatusChart = [
        {
          name: "Ativas",
          value: statusCounts.ATIVO,
          color: "hsl(160, 84%, 39%)",
        },
        {
          name: "Trial",
          value: statusCounts.TRIAL,
          color: "hsl(199, 89%, 48%)",
        },
        {
          name: "Suspensas",
          value: statusCounts.SUSPENSO,
          color: "hsl(38, 92%, 50%)",
        },
        {
          name: "Canceladas",
          value:
            statusCounts.CANCELADO +
            statusCounts.EXPIRADO +
            statusCounts.INATIVO,
          color: "hsl(0, 84%, 60%)",
        },
      ].filter((item) => item.value > 0);

      // Calculate Revenue Data
      const titulos = titulosRes.content;
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const previousMonthYear =
        currentMonth === 0 ? currentYear - 1 : currentYear;

      let receitaMensal = 0;
      let receitaMesAnterior = 0;
      const revenueByMonth: Record<string, number> = {};

      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = d.toLocaleString("pt-BR", { month: "short" });
        // Capitalize first letter
        const formattedMonth =
          monthName.charAt(0).toUpperCase() + monthName.slice(1);
        revenueByMonth[formattedMonth] = 0;
      }

      titulos.forEach((t) => {
        if (t.status === "PAGO" && t.dataPagamento) {
          const dataPagamento = new Date(t.dataPagamento);
          const mes = dataPagamento.getMonth();
          const ano = dataPagamento.getFullYear();

          // Current Month Revenue
          if (mes === currentMonth && ano === currentYear) {
            receitaMensal += t.valor;
          }

          // Previous Month Revenue
          if (mes === previousMonth && ano === previousMonthYear) {
            receitaMesAnterior += t.valor;
          }

          // Chart Data (Last 6 months)
          // Check if within last 6 months
          const diffMonths = (currentYear - ano) * 12 + (currentMonth - mes);
          if (diffMonths >= 0 && diffMonths <= 5) {
            const monthName = dataPagamento.toLocaleString("pt-BR", {
              month: "short",
            });
            const formattedMonth =
              monthName.charAt(0).toUpperCase() + monthName.slice(1);
            if (revenueByMonth[formattedMonth] !== undefined) {
              revenueByMonth[formattedMonth] += t.valor;
            }
          }
        }
      });

      // Calculate Trend
      let receitaTrend = 0;
      if (receitaMesAnterior > 0) {
        receitaTrend =
          ((receitaMensal - receitaMesAnterior) / receitaMesAnterior) * 100;
      } else if (receitaMensal > 0) {
        receitaTrend = 100; // 100% growth if previous was 0
      }

      const revenueChart: RevenueData[] = Object.entries(revenueByMonth).map(
        ([mes, valor]) => ({
          mes,
          valor,
        })
      );

      // Recent Activities from Audit Logs
      const recentActivities = logsRes.content.map((log, index) => {
        const logDate = new Date(log.dataHora);
        const diffMs = now.getTime() - logDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        let tempo = "";
        if (diffDays > 0) tempo = `${diffDays}d atrás`;
        else if (diffHours > 0) tempo = `${diffHours}h atrás`;
        else tempo = `${diffMins} min atrás`;

        return {
          id: index + 1,
          action: log.acao,
          cliente: log.entidade, // Using entity as client/context
          tempo,
        };
      });

      // Alerts
      const alerts: Alert[] = [];

      // Expired Licenses
      if (statusCounts.EXPIRADO > 0) {
        alerts.push({
          id: 1,
          tipo: "warning",
          mensagem: `${statusCounts.EXPIRADO} licenças expiradas`,
        });
      }

      // Trial Clients
      if (statusCounts.TRIAL > 0) {
        alerts.push({
          id: 2,
          tipo: "info",
          mensagem: `${statusCounts.TRIAL} clientes em período de trial`,
        });
      }

      // Overdue Titles
      const overdueTitles = titulos.filter(
        (t) => t.status === "EM_ATRASO"
      ).length;
      if (overdueTitles > 0) {
        alerts.push({
          id: 3,
          tipo: "destructive",
          mensagem: `${overdueTitles} títulos em atraso`,
        });
      }

      return {
        stats: {
          totalClientes,
          licencasAtivas: statusCounts.ATIVO,
          usuariosAtivos: totalUsuarios,
          receitaMensal,
          clientesTrend: 12, // Still mocked as we don't have historical data for clients
          licencasTrend: 8, // Still mocked
          usuariosTrend: 5, // Still mocked
          receitaTrend,
        },
        revenueChart,
        licenseStatusChart,
        recentActivities,
        alerts:
          alerts.length > 0
            ? alerts
            : [
                {
                  id: 0,
                  tipo: "info",
                  mensagem: "Sistema operando normalmente",
                },
              ],
      };
    } catch (error) {
      console.error("Error fetching dashboard data", error);
      throw error;
    }
  }
}

export default new DashboardService();
