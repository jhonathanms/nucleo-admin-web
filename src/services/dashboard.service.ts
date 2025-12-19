import clienteService from "./cliente.service";
import licencaService from "./licenca.service";
import usuarioService from "./usuario.service";
import financeiroService from "./financeiro.service";
import auditoriaService from "./auditoria.service";
import { DashboardData, RevenueData } from "@/types/dashboard.types";

class DashboardService {
  async getDashboardData(): Promise<DashboardData> {
    try {
      // Fetch counts in parallel
      const [clientesRes, licencasRes, usuariosRes, titulosRes, logsRes] =
        await Promise.all([
          clienteService.getAll({ size: 1000 }),
          licencaService.getAll({ size: 1000 }), // Fetch more to calculate status distribution
          usuarioService.getAll({ size: 1000 }),
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

      const financialStatusCounts: Record<string, number> = {
        PAGO: 0,
        PENDENTE: 0,
        EM_ATRASO: 0,
        CANCELADO: 0,
      };

      titulos.forEach((t) => {
        if (financialStatusCounts[t.status] !== undefined) {
          financialStatusCounts[t.status]++;
        }

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

      const financialStatusChart = [
        {
          name: "Pagos",
          value: financialStatusCounts.PAGO,
          color: "hsl(160, 84%, 39%)",
        },
        {
          name: "Pendentes",
          value: financialStatusCounts.PENDENTE,
          color: "hsl(38, 92%, 50%)",
        },
        {
          name: "Em Atraso",
          value: financialStatusCounts.EM_ATRASO,
          color: "hsl(0, 84%, 60%)",
        },
        {
          name: "Cancelados",
          value: financialStatusCounts.CANCELADO,
          color: "hsl(215, 16%, 47%)",
        },
      ].filter((item) => item.value > 0);

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
      const acaoMap: Record<string, string> = {
        CREATE: "Criação",
        UPDATE: "Alteração",
        DELETE: "Exclusão",
        LOGIN: "Login",
        LOGIN_FAILED: "Falha no Login",
        LOGOUT: "Logout",
      };

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
          action: acaoMap[log.acao] || log.acao,
          usuario: log.usuarioNome,
          entidade: log.entidade,
          tempo,
        };
      });

      // Financeiro: Hoje, Vencidos, Recentes
      const todayStr = now.toISOString().split("T")[0];

      const titulosVencendoHoje = titulos
        .filter((t) => t.status === "PENDENTE" && t.dataVencimento === todayStr)
        .map((t) => ({
          id: t.id,
          clienteNome: t.clienteNome,
          valor: t.valor,
          dataVencimento: t.dataVencimento,
          status: t.status,
        }));

      const titulosVencidos = titulos
        .filter((t) => t.status === "EM_ATRASO")
        .slice(0, 5)
        .map((t) => ({
          id: t.id,
          clienteNome: t.clienteNome,
          valor: t.valor,
          dataVencimento: t.dataVencimento,
          status: t.status,
        }));

      const titulosRecentes = titulos.slice(0, 5).map((t) => ({
        id: t.id,
        clienteNome: t.clienteNome,
        valor: t.valor,
        dataVencimento: t.dataVencimento,
        status: t.status,
      }));

      // Licenças: Hoje, Expiradas, Recentes
      const licencasExpirandoHoje = licencas
        .filter((l) => l.status === "ATIVO" && l.dataExpiracao === todayStr)
        .map((l) => ({
          id: l.id,
          clienteNome: l.clienteNome,
          produtoNome: l.produtoNome,
          dataExpiracao: l.dataExpiracao,
          status: l.status,
        }));

      const licencasExpiradas = licencas
        .filter((l) => l.status === "EXPIRADO")
        .slice(0, 5)
        .map((l) => ({
          id: l.id,
          clienteNome: l.clienteNome,
          produtoNome: l.produtoNome,
          dataExpiracao: l.dataExpiracao,
          status: l.status,
        }));

      const licencasRecentes = licencas.slice(0, 5).map((l) => ({
        id: l.id,
        clienteNome: l.clienteNome,
        produtoNome: l.produtoNome,
        dataExpiracao: l.dataExpiracao,
        status: l.status,
      }));

      // Calculate Trends for Clientes, Licencas and Usuarios
      const getTrend = (items: any[], dateField: string) => {
        const currentMonthStart = new Date(currentYear, currentMonth, 1);
        const previousMonthStart = new Date(
          previousMonthYear,
          previousMonth,
          1
        );

        const newThisMonth = items.filter(
          (item) => new Date(item[dateField]) >= currentMonthStart
        ).length;
        const totalUntilLastMonth = items.filter(
          (item) => new Date(item[dateField]) < currentMonthStart
        ).length;

        if (totalUntilLastMonth === 0) return newThisMonth > 0 ? 100 : 0;
        return Math.round((newThisMonth / totalUntilLastMonth) * 100);
      };

      const clientesTrend = getTrend(clientesRes.content, "criadoEm");
      const licencasTrend = getTrend(licencasRes.content, "criadoEm");
      const usuariosTrend = getTrend(usuariosRes.content, "criadoEm");

      return {
        stats: {
          totalClientes,
          licencasAtivas: statusCounts.ATIVO,
          usuariosAtivos: totalUsuarios,
          receitaMensal,
          clientesTrend,
          licencasTrend,
          usuariosTrend,
          receitaTrend: Math.round(receitaTrend),
        },
        revenueChart,
        licenseStatusChart,
        financialStatusChart,
        recentActivities,
        titulosVencendoHoje,
        titulosVencidos,
        titulosRecentes,
        licencasExpirandoHoje,
        licencasExpiradas,
        licencasRecentes,
      };
    } catch (error) {
      console.error("Error fetching dashboard data", error);
      throw error;
    }
  }
}

export default new DashboardService();
