import {
  LayoutDashboard,
  Users,
  Building2,
  Key,
  DollarSign,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge, getStatusVariant } from "@/components/StatusBadge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
} from "recharts";

const revenueData = [
  { mes: "Jan", valor: 85000 },
  { mes: "Fev", valor: 92000 },
  { mes: "Mar", valor: 88000 },
  { mes: "Abr", valor: 105000 },
  { mes: "Mai", valor: 112000 },
  { mes: "Jun", valor: 125000 },
];

const licenseStatusData = [
  { name: "Ativas", value: 1850, color: "hsl(160, 84%, 39%)" },
  { name: "Trial", value: 320, color: "hsl(199, 89%, 48%)" },
  { name: "Suspensas", value: 45, color: "hsl(38, 92%, 50%)" },
  { name: "Canceladas", value: 85, color: "hsl(0, 84%, 60%)" },
];

const recentActivities = [
  { id: 1, action: "Nova licença criada", cliente: "Tech Solutions", tempo: "5 min" },
  { id: 2, action: "Pagamento recebido", cliente: "Empresa ABC", tempo: "15 min" },
  { id: 3, action: "Cliente suspenso", cliente: "StartupXYZ", tempo: "1h" },
  { id: 4, action: "Novo usuário cadastrado", cliente: "Digital Corp", tempo: "2h" },
  { id: 5, action: "Upgrade de plano", cliente: "Mega Systems", tempo: "3h" },
];

const alertas = [
  { id: 1, tipo: "warning", mensagem: "15 licenças expiram em 7 dias" },
  { id: 2, tipo: "destructive", mensagem: "8 clientes inadimplentes há +30 dias" },
  { id: 3, tipo: "info", mensagem: "Nova versão do produto ERP disponível" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral do sistema"
        icon={LayoutDashboard}
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Clientes"
          value="524"
          icon={Building2}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Licenças Ativas"
          value="2.300"
          icon={Key}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Usuários Ativos"
          value="4.850"
          icon={Users}
          trend={{ value: 5, isPositive: true }}
        />
        <StatsCard
          title="Receita Mensal"
          value="R$ 125.000"
          icon={DollarSign}
          trend={{ value: 15, isPositive: true }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Receita Mensal
            </CardTitle>
            <CardDescription>Evolução da receita nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                  <XAxis dataKey="mes" stroke="hsl(215, 16%, 47%)" fontSize={12} />
                  <YAxis stroke="hsl(215, 16%, 47%)" fontSize={12} tickFormatter={(v) => `R$ ${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(214, 32%, 91%)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Valor"]}
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

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Status das Licenças
            </CardTitle>
            <CardDescription>Distribuição por status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={licenseStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {licenseStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {licenseStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                  <span className="ml-auto text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>Últimas ações no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.cliente}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.tempo}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Alertas
            </CardTitle>
            <CardDescription>Itens que requerem atenção</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alertas.map((alerta) => (
                <div
                  key={alerta.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <StatusBadge
                    status={alerta.tipo === "warning" ? "Atenção" : alerta.tipo === "destructive" ? "Crítico" : "Info"}
                    variant={alerta.tipo as "warning" | "destructive" | "info"}
                  />
                  <span className="text-sm">{alerta.mensagem}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
