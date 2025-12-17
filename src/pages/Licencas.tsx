import { useState } from "react";
import { Key, Plus, Copy } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, Column, Action } from "@/components/DataTable";
import { StatusBadge, getStatusVariant } from "@/components/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Licenca {
  id: string;
  chave: string;
  clienteId: string;
  clienteNome: string;
  produtoNome: string;
  planoNome: string;
  status: "ATIVO" | "TRIAL" | "SUSPENSO" | "CANCELADO" | "EXPIRADO";
  dataInicio: string;
  dataExpiracao: string;
  limiteUsuarios: number | null;
  usuariosAtivos: number;
}

const mockLicencas: Licenca[] = [
  { id: "1", chave: "LIC-ERP-2024-001-XYZABC", clienteId: "1", clienteNome: "Tech Solutions Ltda", produtoNome: "ERP Cloud", planoNome: "Professional", status: "ATIVO", dataInicio: "2024-01-15", dataExpiracao: "2025-01-15", limiteUsuarios: 20, usuariosAtivos: 12 },
  { id: "2", chave: "LIC-ERP-2024-002-DEFGHI", clienteId: "2", clienteNome: "João Silva", produtoNome: "ERP Cloud", planoNome: "Starter", status: "ATIVO", dataInicio: "2024-02-20", dataExpiracao: "2025-02-20", limiteUsuarios: 5, usuariosAtivos: 3 },
  { id: "3", chave: "LIC-API-2024-001-JKLMNO", clienteId: "5", clienteNome: "Digital Corp", produtoNome: "API Gateway", planoNome: "Pro", status: "ATIVO", dataInicio: "2024-02-15", dataExpiracao: "2025-02-15", limiteUsuarios: null, usuariosAtivos: 8 },
  { id: "4", chave: "LIC-ERP-2024-003-PQRSTU", clienteId: "3", clienteNome: "Empresa ABC S.A.", produtoNome: "ERP Cloud", planoNome: "Enterprise", status: "SUSPENSO", dataInicio: "2024-01-10", dataExpiracao: "2025-01-10", limiteUsuarios: null, usuariosAtivos: 45 },
  { id: "5", chave: "LIC-PDV-2024-001-VWXYZA", clienteId: "8", clienteNome: "Mega Systems", produtoNome: "PDV Desktop", planoNome: "PDV Único", status: "TRIAL", dataInicio: "2024-03-01", dataExpiracao: "2024-03-08", limiteUsuarios: 3, usuariosAtivos: 2 },
  { id: "6", chave: "LIC-CRM-2024-001-BCDEFG", clienteId: "6", clienteNome: "StartupXYZ", produtoNome: "CRM Plus", planoNome: "Professional", status: "CANCELADO", dataInicio: "2023-12-01", dataExpiracao: "2024-12-01", limiteUsuarios: 10, usuariosAtivos: 0 },
];

export default function Licencas() {
  const [licencas, setLicencas] = useState<Licenca[]>(mockLicencas);
  const [modalAberto, setModalAberto] = useState(false);
  const [licencaEditando, setLicencaEditando] = useState<Licenca | null>(null);
  const { toast } = useToast();

  const copiarChave = (chave: string) => {
    navigator.clipboard.writeText(chave);
    toast({
      title: "Chave copiada",
      description: "A chave foi copiada para a área de transferência.",
    });
  };

  const columns: Column<Licenca>[] = [
    {
      key: "chave",
      header: "Chave",
      cell: (licenca) => (
        <div className="flex items-center gap-2">
          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
            {licenca.chave.substring(0, 20)}...
          </code>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => copiarChave(licenca.chave)}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
    {
      key: "cliente",
      header: "Cliente",
      cell: (licenca) => (
        <span className="font-medium">{licenca.clienteNome}</span>
      ),
    },
    {
      key: "produto",
      header: "Produto / Plano",
      cell: (licenca) => (
        <div>
          <p className="text-sm">{licenca.produtoNome}</p>
          <p className="text-xs text-muted-foreground">{licenca.planoNome}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (licenca) => (
        <StatusBadge status={licenca.status} variant={getStatusVariant(licenca.status)} />
      ),
    },
    {
      key: "usuarios",
      header: "Usuários",
      cell: (licenca) => (
        <span className="text-sm">
          {licenca.usuariosAtivos} / {licenca.limiteUsuarios || "∞"}
        </span>
      ),
    },
    {
      key: "validade",
      header: "Validade",
      cell: (licenca) => (
        <div>
          <p className="text-sm">{new Date(licenca.dataExpiracao).toLocaleDateString("pt-BR")}</p>
          <p className="text-xs text-muted-foreground">
            {Math.ceil((new Date(licenca.dataExpiracao).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias restantes
          </p>
        </div>
      ),
    },
  ];

  const actions: Action<Licenca>[] = [
    {
      label: "Editar",
      onClick: (licenca) => {
        setLicencaEditando(licenca);
        setModalAberto(true);
      },
    },
    {
      label: "Renovar",
      onClick: (licenca) => {
        toast({
          title: "Licença renovada",
          description: `Licença de ${licenca.clienteNome} renovada por mais 1 ano.`,
        });
      },
    },
    {
      label: "Suspender",
      onClick: (licenca) => {
        toast({
          title: "Licença suspensa",
          description: `Licença de ${licenca.clienteNome} foi suspensa.`,
          variant: "destructive",
        });
      },
      variant: "destructive",
    },
  ];

  const handleSalvar = () => {
    setModalAberto(false);
    setLicencaEditando(null);
    toast({
      title: licencaEditando ? "Licença atualizada" : "Licença criada",
      description: "Operação realizada com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Licenças"
        description="Gerencie as licenças dos clientes"
        icon={Key}
        action={{
          label: "Nova Licença",
          onClick: () => {
            setLicencaEditando(null);
            setModalAberto(true);
          },
          icon: Plus,
        }}
      />

      <DataTable
        data={licencas}
        columns={columns}
        actions={actions}
        searchKey="clienteNome"
        searchPlaceholder="Buscar por cliente..."
      />

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{licencaEditando ? "Editar Licença" : "Nova Licença"}</DialogTitle>
            <DialogDescription>
              {licencaEditando ? "Atualize as informações da licença" : "Configure uma nova licença para o cliente"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <Select defaultValue={licencaEditando?.clienteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Tech Solutions Ltda</SelectItem>
                  <SelectItem value="2">João Silva</SelectItem>
                  <SelectItem value="3">Empresa ABC S.A.</SelectItem>
                  <SelectItem value="5">Digital Corp</SelectItem>
                  <SelectItem value="8">Mega Systems</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="produto">Produto</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Produto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">ERP Cloud</SelectItem>
                    <SelectItem value="2">API Gateway</SelectItem>
                    <SelectItem value="3">PDV Desktop</SelectItem>
                    <SelectItem value="5">CRM Plus</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plano">Plano</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Plano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data de Início</Label>
                <Input id="dataInicio" type="date" defaultValue={licencaEditando?.dataInicio} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataExpiracao">Data de Expiração</Label>
                <Input id="dataExpiracao" type="date" defaultValue={licencaEditando?.dataExpiracao} />
              </div>
            </div>

            {licencaEditando && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue={licencaEditando.status}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVO">Ativo</SelectItem>
                    <SelectItem value="TRIAL">Trial</SelectItem>
                    <SelectItem value="SUSPENSO">Suspenso</SelectItem>
                    <SelectItem value="CANCELADO">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar}>
              {licencaEditando ? "Salvar" : "Cadastrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
