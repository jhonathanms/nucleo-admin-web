import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Key,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Link } from "react-router-dom";
import dashboardService from "@/services/dashboard.service";
import {
  DashboardData,
  TituloDashboard,
  LicencaDashboard,
} from "@/types/dashboard.types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const dashboardData = await dashboardService.getDashboardData();
        setData(dashboardData);
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do dashboard.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!data) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Dashboard"
        description="Visão geral do sistema"
        icon={LayoutDashboard}
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/clientes">
          <StatsCard
            title="Total de Clientes"
            value={data.stats.totalClientes.toString()}
            icon={Building2}
            trend={{
              value: data.stats.clientesTrend,
              isPositive: data.stats.clientesTrend >= 0,
            }}
            className="hover:border-primary/50 transition-colors"
          />
        </Link>
        <Link to="/licencas">
          <StatsCard
            title="Licenças Ativas"
            value={data.stats.licencasAtivas.toString()}
            icon={Key}
            trend={{
              value: data.stats.licencasTrend,
              isPositive: data.stats.licencasTrend >= 0,
            }}
            className="hover:border-primary/50 transition-colors"
          />
        </Link>
        <Link to="/usuarios">
          <StatsCard
            title="Usuários Ativos"
            value={data.stats.usuariosAtivos.toString()}
            icon={Users}
            trend={{
              value: data.stats.usuariosTrend,
              isPositive: data.stats.usuariosTrend >= 0,
            }}
            className="hover:border-primary/50 transition-colors"
          />
        </Link>
        <Link to="/financeiro">
          <StatsCard
            title="Receita Mensal"
            value={formatCurrency(data.stats.receitaMensal)}
            icon={DollarSign}
            trend={{
              value: data.stats.receitaTrend,
              isPositive: data.stats.receitaTrend >= 0,
            }}
            className="hover:border-primary/50 transition-colors"
          />
        </Link>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Receita Mensal
            </CardTitle>
            <CardDescription>
              Evolução da receita nos últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenueChart}>
                  <defs>
                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="hsl(221, 83%, 53%)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(221, 83%, 53%)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(214, 32%, 91%)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="mes"
                    stroke="hsl(215, 16%, 47%)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(215, 16%, 47%)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) =>
                      `R$ ${v >= 1000 ? (v / 1000).toFixed(1) + "k" : v}`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(214, 32%, 91%)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [
                      formatCurrency(value),
                      "Receita",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="valor"
                    stroke="hsl(221, 83%, 53%)"
                    strokeWidth={2}
                    fill="url(#colorValor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Financial Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Status Financeiro
            </CardTitle>
            <CardDescription>Distribuição de títulos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.financialStatusChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.financialStatusChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(214, 32%, 91%)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Sections - 3 Columns */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent Activities */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Atividades Recentes
            </CardTitle>
            <CardDescription>Últimas ações registradas</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-4">
              {data.recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.action} em{" "}
                      <span className="text-primary">{activity.entidade}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Por: {activity.usuario}
                    </p>
                  </div>
                  <span className="text-[10px] whitespace-nowrap text-muted-foreground font-medium uppercase">
                    {activity.tempo}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
          <div className="p-4 pt-0 mt-auto">
            <Link to="/auditoria">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs gap-1"
              >
                Ver auditoria completa <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Financial Titles */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                Títulos Financeiros
              </div>
              {data.titulosVencendoHoje.length > 0 && (
                <div className="relative flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 text-[10px] font-bold text-white items-center justify-center">
                    {data.titulosVencendoHoje.length}
                  </span>
                </div>
              )}
            </CardTitle>
            <CardDescription>Vencimentos e pendências</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-4">
              <SectionList
                title="Vencendo Hoje"
                items={data.titulosVencendoHoje}
                type="financeiro"
                empty="Nenhum título para hoje"
              />
              <SectionList
                title="Vencidos"
                items={data.titulosVencidos}
                type="financeiro"
                variant="destructive"
                empty="Nenhum título vencido"
              />
            </div>
          </CardContent>
          <div className="p-4 pt-0 mt-auto">
            <Link to="/financeiro">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs gap-1"
              >
                Ir para financeiro <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Licenses */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-amber-500" />
                Licenças
              </div>
              {data.licencasExpirandoHoje.length > 0 && (
                <div className="relative flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-500 text-[10px] font-bold text-white items-center justify-center">
                    {data.licencasExpirandoHoje.length}
                  </span>
                </div>
              )}
            </CardTitle>
            <CardDescription>Expirações e renovações</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-4">
              <SectionList
                title="Expira Hoje"
                items={data.licencasExpirandoHoje}
                type="licenca"
                empty="Nenhuma expiração para hoje"
              />
              <SectionList
                title="Expiradas"
                items={data.licencasExpiradas}
                type="licenca"
                variant="destructive"
                empty="Nenhuma licença expirada"
              />
            </div>
          </CardContent>
          <div className="p-4 pt-0 mt-auto">
            <Link to="/licencas">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs gap-1"
              >
                Gerenciar licenças <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

interface SectionListProps {
  title: string;
  items: any[];
  type: "financeiro" | "licenca";
  empty: string;
  variant?: "default" | "destructive";
}

function SectionList({
  title,
  items,
  type,
  empty,
  variant = "default",
}: SectionListProps) {
  return (
    <div className="space-y-2">
      <h4
        className={cn(
          "text-[10px] font-bold uppercase tracking-wider",
          variant === "destructive"
            ? "text-destructive"
            : "text-muted-foreground"
        )}
      >
        {title}
      </h4>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">{empty}</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-md bg-muted/30 p-2 border border-border/50"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate">
                  {item.clienteNome}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {type === "financeiro"
                    ? `Vencimento: ${new Date(
                        item.dataVencimento
                      ).toLocaleDateString("pt-BR")}`
                    : item.produtoNome}
                </p>
              </div>
              <div className="text-right ml-2">
                {type === "financeiro" ? (
                  <p className="text-xs font-bold text-primary">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(item.valor)}
                  </p>
                ) : (
                  <StatusBadge
                    status={item.status}
                    variant={
                      item.status === "ATIVO" ? "success" : "destructive"
                    }
                    className="text-[9px] px-1.5 h-4"
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
