import { useState } from "react";
import { UserCircle, Plus, Shield } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, Column, Action } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
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

interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: "SUPER_ADMIN" | "SUPORTE" | "MASTER_CLIENT" | "USER_CLIENT";
  clienteId: string | null;
  clienteNome: string | null;
  ativo: boolean;
  ultimoAcesso: string | null;
  criadoEm: string;
}

const mockUsuarios: Usuario[] = [
  { id: "1", nome: "Admin Sistema", email: "admin@sistema.com", perfil: "SUPER_ADMIN", clienteId: null, clienteNome: null, ativo: true, ultimoAcesso: "2024-03-15T10:30:00", criadoEm: "2023-01-01" },
  { id: "2", nome: "Suporte Técnico", email: "suporte@sistema.com", perfil: "SUPORTE", clienteId: null, clienteNome: null, ativo: true, ultimoAcesso: "2024-03-15T09:15:00", criadoEm: "2023-02-15" },
  { id: "3", nome: "Carlos Silva", email: "carlos@techsolutions.com", perfil: "MASTER_CLIENT", clienteId: "1", clienteNome: "Tech Solutions Ltda", ativo: true, ultimoAcesso: "2024-03-15T08:00:00", criadoEm: "2024-01-15" },
  { id: "4", nome: "Ana Souza", email: "ana@techsolutions.com", perfil: "USER_CLIENT", clienteId: "1", clienteNome: "Tech Solutions Ltda", ativo: true, ultimoAcesso: "2024-03-14T16:45:00", criadoEm: "2024-01-20" },
  { id: "5", nome: "Roberto Mendes", email: "roberto@abc.com.br", perfil: "MASTER_CLIENT", clienteId: "3", clienteNome: "Empresa ABC S.A.", ativo: false, ultimoAcesso: "2024-02-28T14:00:00", criadoEm: "2024-01-10" },
  { id: "6", nome: "Fernanda Lima", email: "fernanda@digitalcorp.com", perfil: "MASTER_CLIENT", clienteId: "5", clienteNome: "Digital Corp", ativo: true, ultimoAcesso: "2024-03-15T11:00:00", criadoEm: "2024-02-15" },
  { id: "7", nome: "Pedro Santos", email: "pedro@digitalcorp.com", perfil: "USER_CLIENT", clienteId: "5", clienteNome: "Digital Corp", ativo: true, ultimoAcesso: "2024-03-15T07:30:00", criadoEm: "2024-02-20" },
  { id: "8", nome: "Mariana Costa", email: "mariana@digitalcorp.com", perfil: "USER_CLIENT", clienteId: "5", clienteNome: "Digital Corp", ativo: true, ultimoAcesso: null, criadoEm: "2024-03-10" },
];

const perfilLabels: Record<string, { label: string; variant: "default" | "destructive" | "warning" | "success" }> = {
  SUPER_ADMIN: { label: "Super Admin", variant: "destructive" },
  SUPORTE: { label: "Suporte", variant: "warning" },
  MASTER_CLIENT: { label: "Master", variant: "success" },
  USER_CLIENT: { label: "Usuário", variant: "default" },
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>(mockUsuarios);
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const { toast } = useToast();

  const columns: Column<Usuario>[] = [
    {
      key: "nome",
      header: "Usuário",
      cell: (usuario) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <span className="text-sm font-medium text-primary">
              {usuario.nome.split(" ").map(n => n[0]).join("").substring(0, 2)}
            </span>
          </div>
          <div>
            <p className="font-medium">{usuario.nome}</p>
            <p className="text-xs text-muted-foreground">{usuario.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "perfil",
      header: "Perfil",
      cell: (usuario) => (
        <StatusBadge
          status={perfilLabels[usuario.perfil].label}
          variant={perfilLabels[usuario.perfil].variant}
          icon={Shield}
        />
      ),
    },
    {
      key: "cliente",
      header: "Cliente",
      cell: (usuario) => (
        <span className="text-sm">
          {usuario.clienteNome || <span className="text-muted-foreground">—</span>}
        </span>
      ),
    },
    {
      key: "ativo",
      header: "Status",
      cell: (usuario) => (
        <StatusBadge
          status={usuario.ativo ? "Ativo" : "Inativo"}
          variant={usuario.ativo ? "success" : "muted"}
        />
      ),
    },
    {
      key: "ultimoAcesso",
      header: "Último Acesso",
      cell: (usuario) => (
        <span className="text-sm text-muted-foreground">
          {usuario.ultimoAcesso
            ? new Date(usuario.ultimoAcesso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
            : "Nunca acessou"}
        </span>
      ),
    },
  ];

  const actions: Action<Usuario>[] = [
    {
      label: "Editar",
      onClick: (usuario) => {
        setUsuarioEditando(usuario);
        setModalAberto(true);
      },
    },
    {
      label: "Resetar senha",
      onClick: (usuario) => {
        toast({
          title: "Senha resetada",
          description: `Uma nova senha foi enviada para ${usuario.email}`,
        });
      },
    },
    {
      label: "Alterar status",
      onClick: (usuario) => {
        setUsuarios(usuarios.map(u => 
          u.id === usuario.id ? { ...u, ativo: !u.ativo } : u
        ));
        toast({
          title: usuario.ativo ? "Usuário desativado" : "Usuário ativado",
          description: `${usuario.nome} foi ${usuario.ativo ? "desativado" : "ativado"}.`,
        });
      },
    },
  ];

  const handleSalvar = () => {
    setModalAberto(false);
    setUsuarioEditando(null);
    toast({
      title: usuarioEditando ? "Usuário atualizado" : "Usuário criado",
      description: "Operação realizada com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários"
        description="Gerencie os usuários do sistema"
        icon={UserCircle}
        action={{
          label: "Novo Usuário",
          onClick: () => {
            setUsuarioEditando(null);
            setModalAberto(true);
          },
          icon: Plus,
        }}
      />

      <DataTable
        data={usuarios}
        columns={columns}
        actions={actions}
        searchKey="nome"
        searchPlaceholder="Buscar por nome..."
      />

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{usuarioEditando ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
            <DialogDescription>
              {usuarioEditando ? "Atualize as informações do usuário" : "Cadastre um novo usuário no sistema"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" defaultValue={usuarioEditando?.nome} placeholder="Nome completo" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" defaultValue={usuarioEditando?.email} placeholder="email@exemplo.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="perfil">Perfil</Label>
              <Select defaultValue={usuarioEditando?.perfil || "USER_CLIENT"}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="SUPORTE">Suporte</SelectItem>
                  <SelectItem value="MASTER_CLIENT">Master Client</SelectItem>
                  <SelectItem value="USER_CLIENT">User Client</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente (para perfis de cliente)</Label>
              <Select defaultValue={usuarioEditando?.clienteId || undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum (usuário interno)</SelectItem>
                  <SelectItem value="1">Tech Solutions Ltda</SelectItem>
                  <SelectItem value="3">Empresa ABC S.A.</SelectItem>
                  <SelectItem value="5">Digital Corp</SelectItem>
                  <SelectItem value="8">Mega Systems</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!usuarioEditando && (
              <div className="space-y-2">
                <Label htmlFor="senha">Senha Provisória</Label>
                <Input id="senha" type="password" placeholder="Senha inicial" />
                <p className="text-xs text-muted-foreground">
                  O usuário receberá um e-mail para definir uma nova senha.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar}>
              {usuarioEditando ? "Salvar" : "Cadastrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
