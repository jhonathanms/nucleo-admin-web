import { useState } from "react";
import { Building2, Plus } from "lucide-react";
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

interface Cliente {
  id: string;
  nome: string;
  documento: string;
  tipo: "PF" | "PJ";
  email: string;
  telefone: string;
  status: "ATIVO" | "INADIMPLENTE" | "SUSPENSO" | "CANCELADO";
  criadoEm: string;
}

const mockClientes: Cliente[] = [
  { id: "1", nome: "Tech Solutions Ltda", documento: "12.345.678/0001-90", tipo: "PJ", email: "contato@techsolutions.com", telefone: "(11) 99999-0001", status: "ATIVO", criadoEm: "2024-01-15" },
  { id: "2", nome: "João Silva", documento: "123.456.789-00", tipo: "PF", email: "joao@email.com", telefone: "(11) 99999-0002", status: "ATIVO", criadoEm: "2024-02-20" },
  { id: "3", nome: "Empresa ABC S.A.", documento: "98.765.432/0001-10", tipo: "PJ", email: "financeiro@abc.com.br", telefone: "(11) 99999-0003", status: "INADIMPLENTE", criadoEm: "2024-01-10" },
  { id: "4", nome: "Maria Santos", documento: "987.654.321-00", tipo: "PF", email: "maria@email.com", telefone: "(11) 99999-0004", status: "SUSPENSO", criadoEm: "2024-03-01" },
  { id: "5", nome: "Digital Corp", documento: "11.222.333/0001-44", tipo: "PJ", email: "admin@digitalcorp.com", telefone: "(11) 99999-0005", status: "ATIVO", criadoEm: "2024-02-15" },
  { id: "6", nome: "StartupXYZ", documento: "55.666.777/0001-88", tipo: "PJ", email: "hello@startupxyz.io", telefone: "(11) 99999-0006", status: "CANCELADO", criadoEm: "2023-12-01" },
  { id: "7", nome: "Pedro Oliveira", documento: "111.222.333-44", tipo: "PF", email: "pedro@email.com", telefone: "(11) 99999-0007", status: "ATIVO", criadoEm: "2024-03-10" },
  { id: "8", nome: "Mega Systems", documento: "22.333.444/0001-55", tipo: "PJ", email: "suporte@megasystems.com.br", telefone: "(11) 99999-0008", status: "ATIVO", criadoEm: "2024-01-25" },
];

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>(mockClientes);
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const { toast } = useToast();

  const columns: Column<Cliente>[] = [
    {
      key: "nome",
      header: "Nome",
      cell: (cliente) => (
        <div>
          <p className="font-medium">{cliente.nome}</p>
          <p className="text-xs text-muted-foreground">{cliente.documento}</p>
        </div>
      ),
    },
    {
      key: "tipo",
      header: "Tipo",
      cell: (cliente) => (
        <span className="text-sm">{cliente.tipo === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"}</span>
      ),
    },
    {
      key: "email",
      header: "Contato",
      cell: (cliente) => (
        <div>
          <p className="text-sm">{cliente.email}</p>
          <p className="text-xs text-muted-foreground">{cliente.telefone}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (cliente) => (
        <StatusBadge status={cliente.status} variant={getStatusVariant(cliente.status)} />
      ),
    },
    {
      key: "criadoEm",
      header: "Criado em",
      cell: (cliente) => (
        <span className="text-sm text-muted-foreground">
          {new Date(cliente.criadoEm).toLocaleDateString("pt-BR")}
        </span>
      ),
    },
  ];

  const actions: Action<Cliente>[] = [
    {
      label: "Editar",
      onClick: (cliente) => {
        setClienteEditando(cliente);
        setModalAberto(true);
      },
    },
    {
      label: "Ver licenças",
      onClick: (cliente) => {
        toast({
          title: "Licenças",
          description: `Visualizando licenças de ${cliente.nome}`,
        });
      },
    },
    {
      label: "Excluir",
      onClick: (cliente) => {
        setClientes(clientes.filter((c) => c.id !== cliente.id));
        toast({
          title: "Cliente excluído",
          description: `${cliente.nome} foi removido com sucesso.`,
        });
      },
      variant: "destructive",
    },
  ];

  const handleSalvar = () => {
    setModalAberto(false);
    setClienteEditando(null);
    toast({
      title: clienteEditando ? "Cliente atualizado" : "Cliente criado",
      description: "Operação realizada com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Gerencie os clientes da plataforma"
        icon={Building2}
        action={{
          label: "Novo Cliente",
          onClick: () => {
            setClienteEditando(null);
            setModalAberto(true);
          },
          icon: Plus,
        }}
      />

      <DataTable
        data={clientes}
        columns={columns}
        actions={actions}
        searchKey="nome"
        searchPlaceholder="Buscar por nome..."
      />

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{clienteEditando ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            <DialogDescription>
              {clienteEditando ? "Atualize as informações do cliente" : "Preencha os dados para cadastrar um novo cliente"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select defaultValue={clienteEditando?.tipo || "PJ"}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PF">Pessoa Física</SelectItem>
                  <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" defaultValue={clienteEditando?.nome} placeholder="Nome completo ou razão social" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documento">CPF/CNPJ</Label>
              <Input id="documento" defaultValue={clienteEditando?.documento} placeholder="000.000.000-00" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" defaultValue={clienteEditando?.email} placeholder="email@exemplo.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" defaultValue={clienteEditando?.telefone} placeholder="(00) 00000-0000" />
            </div>

            {clienteEditando && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue={clienteEditando.status}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVO">Ativo</SelectItem>
                    <SelectItem value="INADIMPLENTE">Inadimplente</SelectItem>
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
              {clienteEditando ? "Salvar" : "Cadastrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
