import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Plus,
  Users,
  Package,
  ExternalLink,
  Mail,
  Phone,
  FileText,
  MapPin,
  Check,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, Column, Action } from "@/components/DataTable";
import { StatusBadge, getStatusVariant } from "@/components/StatusBadge";
import { ProdutoLogo } from "@/components/ProdutoLogo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import clienteService from "@/services/cliente.service";
import licencaService from "@/services/licenca.service";
import usuarioService from "@/services/usuario.service";
import cnpjService from "@/services/cnpj.service";
import {
  Cliente,
  CreateClienteDTO,
  UpdateClienteDTO,
} from "@/types/cliente.types";
import { Licenca } from "@/types/licenca.types";
import { Usuario } from "@/types/usuario.types";
import { Status } from "@/types/common.types";
import { useApiError } from "@/hooks/use-api-error";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { UserAvatar } from "@/components/UserAvatar";
import { ContatosSection } from "@/components/ContatosSection";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ClienteLogo } from "@/components/ClienteLogo";
import { ClienteLogoUpload } from "@/components/ClienteLogoUpload";
import {
  isValidEmail,
  isValidPhone,
  maskCPF,
  maskCNPJ,
  maskCEP,
} from "@/lib/utils";

export default function Clientes() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const clienteIdParam = queryParams.get("id");

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);

  // Detalhes State
  const [detalhesModalOpen, setDetalhesModalOpen] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(
    null
  );
  const [usuariosVinculados, setUsuariosVinculados] = useState<Usuario[]>([]);
  const [licencasCliente, setLicencasCliente] = useState<Licenca[]>([]);
  const [isLoadingDetalhes, setIsLoadingDetalhes] = useState(false);
  const [logoRefreshKey, setLogoRefreshKey] = useState(0);
  const [criarOutro, setCriarOutro] = useState(false);
  const [isBuscandoCep, setIsBuscandoCep] = useState(false);
  const [isBuscandoCnpj, setIsBuscandoCnpj] = useState(false);

  const { toast } = useToast();
  const { handleError, clearError } = useApiError();

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const [formData, setFormData] = useState<Partial<Cliente>>({
    tipo: "PJ",
    status: "ATIVO",
    contatos: [],
    endereco: {
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      pais: "Brasil",
    },
  });

  const loadClientes = useCallback(async () => {
    setIsLoading(true);
    try {
      if (clienteIdParam) {
        const cliente = await clienteService.getById(clienteIdParam);
        setClientes([cliente]);
      } else {
        const response = await clienteService.getAll({ size: 100 });
        setClientes(response.content);
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de clientes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [clienteIdParam, toast]);

  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  const handleOpenModal = (cliente?: Cliente) => {
    if (cliente) {
      setClienteEditando(cliente);
      setFormData({
        razaoSocial: cliente.razaoSocial,
        nomeFantasia: cliente.nomeFantasia,
        codigoCrm: cliente.codigoCrm,
        documento:
          cliente.tipo === "PJ"
            ? maskCNPJ(cliente.documento)
            : maskCPF(cliente.documento),
        inscricaoEstadual: cliente.inscricaoEstadual,
        inscricaoMunicipal: cliente.inscricaoMunicipal,
        tipo: cliente.tipo,
        contatos: cliente.contatos || [],
        status: cliente.status,
        observacoes: cliente.observacoes,
        endereco: cliente.endereco
          ? {
              ...cliente.endereco,
              cep: maskCEP(cliente.endereco.cep || ""),
            }
          : {
              cep: "",
              logradouro: "",
              numero: "",
              complemento: "",
              bairro: "",
              cidade: "",
              estado: "",
              pais: "Brasil",
            },
      });
    } else {
      setClienteEditando(null);
      setFormData({
        tipo: "PJ",
        status: "ATIVO",
        contatos: [],
        endereco: {
          cep: "",
          logradouro: "",
          numero: "",
          complemento: "",
          bairro: "",
          cidade: "",
          estado: "",
          pais: "Brasil",
        },
      });
    }
    clearError();
    setModalAberto(true);
  };

  const handleBuscarCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setIsBuscandoCep(true);
    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cleanCep}/json/`
      );
      const data = await response.json();

      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          endereco: {
            ...prev.endereco!,
            logradouro: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf,
          },
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setIsBuscandoCep(false);
    }
  };

  const handleBuscarCnpj = async (cnpj: string) => {
    const cleanCnpj = cnpj.replace(/\D/g, "");
    if (cleanCnpj.length !== 14) return;

    setIsBuscandoCnpj(true);
    try {
      const data = await cnpjService.buscarCnpj(cleanCnpj);

      setFormData((prev) => {
        const newContatos = [...(prev.contatos || [])];

        if (data.email) {
          const emailExiste = newContatos.some(
            (c) =>
              c.tipo === "EMAIL" &&
              c.valor.toLowerCase() === data.email.toLowerCase()
          );
          if (!emailExiste) {
            newContatos.push({
              tipo: "EMAIL",
              valor: data.email.toLowerCase(),
              isPrincipal: !newContatos.some((c) => c.tipo === "EMAIL"),
              isWhatsapp: false,
            });
          }
        }

        const ddd = data.ddd_telefone_1 || data.ddd_telefone_2 || "";
        const tel = data.telefone_1 || data.telefone_2 || "";
        const telefone = ddd && tel ? `(${ddd}) ${tel}` : tel || ddd;

        if (telefone) {
          const telExiste = newContatos.some(
            (c) =>
              c.tipo === "TELEFONE" &&
              c.valor.replace(/\D/g, "") === telefone.replace(/\D/g, "")
          );
          if (!telExiste) {
            newContatos.push({
              tipo: "TELEFONE",
              valor: telefone,
              isPrincipal: !newContatos.some((c) => c.tipo === "TELEFONE"),
              isWhatsapp: false,
            });
          }
        }

        return {
          ...prev,
          razaoSocial: data.razao_social,
          nomeFantasia: data.nome_fantasia || data.razao_social,
          endereco: {
            ...prev.endereco!,
            cep: maskCEP(data.cep),
            logradouro: data.logradouro,
            numero: data.numero,
            complemento: data.complemento,
            bairro: data.bairro,
            cidade: data.municipio,
            estado: data.uf,
          },
          contatos: newContatos,
        };
      });

      toast({
        title: "Dados recuperados",
        description:
          "As informações da empresa foram preenchidas automaticamente.",
      });
    } catch (error) {
      console.error("Erro ao buscar CNPJ:", error);
      toast({
        title: "Erro ao buscar CNPJ",
        description: "Não foi possível recuperar os dados para este CNPJ.",
        variant: "destructive",
      });
    } finally {
      setIsBuscandoCnpj(false);
    }
  };

  const handleOpenDetalhes = async (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setDetalhesModalOpen(true);
    setIsLoadingDetalhes(true);
    try {
      const [usuarios, licencas] = await Promise.all([
        clienteService.getUsuarios(cliente.id),
        licencaService.getByCliente(cliente.id),
      ]);
      setUsuariosVinculados(usuarios);
      setLicencasCliente(licencas.content);
    } catch (error) {
      handleError(error, "Não foi possível carregar os detalhes do cliente.");
    } finally {
      setIsLoadingDetalhes(false);
    }
  };

  const handleSalvar = async () => {
    try {
      if (!formData.razaoSocial || !formData.documento) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha razão social e documento.",
          variant: "destructive",
        });
        return;
      }

      // Validação de Contatos
      const contatos = formData.contatos || [];
      const errors: string[] = [];

      if (contatos.length === 0) {
        errors.push("Adicione pelo menos um contato.");
      } else {
        const temEmail = contatos.some((c) => c.tipo === "EMAIL");
        if (!temEmail) {
          errors.push("Pelo menos um e-mail é obrigatório.");
        }

        const tiposExistentes = [...new Set(contatos.map((c) => c.tipo))];
        const tiposComPrincipal = [
          ...new Set(contatos.filter((c) => c.isPrincipal).map((c) => c.tipo)),
        ];

        tiposExistentes.forEach((tipo) => {
          if (!tiposComPrincipal.includes(tipo)) {
            errors.push(`Deve haver um contato principal do tipo ${tipo}.`);
          }
        });

        contatos.forEach((c, i) => {
          if (c.tipo === "EMAIL" && c.valor && !isValidEmail(c.valor)) {
            errors.push(`E-mail inválido no contato ${i + 1}.`);
          }
          if (c.tipo === "TELEFONE" && c.valor && !isValidPhone(c.valor)) {
            errors.push(`Telefone inválido no contato ${i + 1}.`);
          }
          if (!c.valor) {
            errors.push(`Valor obrigatório no contato ${i + 1}.`);
          }
        });
      }

      if (errors.length > 0) {
        toast({
          title: "Erro de validação",
          description: errors[0],
          variant: "destructive",
        });
        return;
      }

      const principalEmail =
        contatos.find((c) => c.tipo === "EMAIL" && c.isPrincipal)?.valor ||
        contatos.find((c) => c.tipo === "EMAIL")?.valor;

      // Remover máscaras antes de enviar
      const dataToSave = {
        ...formData,
        documento: formData.documento?.replace(/\D/g, ""),
        endereco: {
          ...formData.endereco,
          cep: formData.endereco?.cep?.replace(/\D/g, ""),
        },
      };

      if (clienteEditando) {
        await clienteService.update(
          clienteEditando.id,
          dataToSave as UpdateClienteDTO
        );
        toast({
          title: "Sucesso",
          description: "Cliente atualizado com sucesso.",
        });
      } else {
        const { status, ...createData } = dataToSave;
        const novoCliente = await clienteService.create(
          createData as CreateClienteDTO
        );

        // Criar usuário principal automaticamente
        try {
          const senhaPadrao =
            formData.documento?.replace(/\D/g, "") || "123456";

          const novoUsuario = await usuarioService.create({
            nome: novoCliente.razaoSocial,
            email: principalEmail,
            senha: senhaPadrao,
            tipo: "CLIENTE",
            role: "OPERADOR",
          });

          // Criar vínculo global com o cliente (Admin do Cliente)
          await usuarioService.addVinculo(novoUsuario.id, {
            clienteId: novoCliente.id,
            role: "ADMIN",
          });

          toast({
            title: "Sucesso",
            description: "Cliente e usuário principal criados com sucesso.",
          });
        } catch (err) {
          console.error("Erro ao criar usuário automático:", err);
          toast({
            title: "Sucesso",
            description:
              "Cliente criado, mas houve um erro ao criar o usuário automático.",
          });
        }
      }

      if (!criarOutro) {
        setModalAberto(false);
      } else {
        // Resetar form para novo cadastro
        setFormData({
          tipo: "PJ",
          status: "ATIVO",
          contatos: [],
          endereco: {
            cep: "",
            logradouro: "",
            numero: "",
            complemento: "",
            bairro: "",
            cidade: "",
            estado: "",
            pais: "Brasil",
          },
        });
        setClienteEditando(null);
      }
      loadClientes();
    } catch (error) {
      handleError(error, "Não foi possível salvar o cliente.");
    }
  };

  const handleDelete = (cliente: Cliente) => {
    setConfirmModal({
      open: true,
      title: "Excluir Cliente",
      description: `Tem certeza que deseja excluir o cliente "${cliente.razaoSocial}"? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        try {
          await clienteService.delete(cliente.id);
          toast({
            title: "Sucesso",
            description: "Cliente excluído com sucesso.",
          });
          loadClientes();
          setConfirmModal((prev) => ({ ...prev, open: false }));
        } catch (error) {
          handleError(error, "Não foi possível excluir o cliente.");
        }
      },
    });
  };

  const columns: Column<Cliente>[] = [
    {
      key: "codigoCrm",
      header: "CRM",
      cell: (cliente) => (
        <Badge
          variant="outline"
          className="font-mono text-[10px] px-1.5 py-0 h-5 border-primary/30 text-primary bg-primary/5"
        >
          {cliente.codigoCrm}
        </Badge>
      ),
      className: "w-[100px]",
    },
    {
      key: "razaoSocial",
      header: "Cliente / Empresa",
      cell: (cliente) => (
        <div className="flex items-center gap-3">
          <ClienteLogo
            clienteId={cliente.id}
            razaoSocial={cliente.razaoSocial}
            refreshKey={logoRefreshKey}
          />
          <div className="flex flex-col">
            <p className="font-medium">{cliente.razaoSocial}</p>
            {cliente.nomeFantasia && (
              <p className="text-[10px] text-muted-foreground italic">
                {cliente.nomeFantasia}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground">
              {cliente.documento}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "tipo",
      header: "Tipo",
      cell: (cliente) => (
        <Badge variant="secondary" className="font-normal">
          {cliente.tipo === "PJ" ? "PJ" : "PF"}
        </Badge>
      ),
      className: "w-[80px]",
    },
    {
      key: "contatos",
      header: "Contatos Principais",
      cell: (cliente) => {
        const emailPrincipal = cliente.contatos?.find(
          (c) => c.tipo === "EMAIL" && c.isPrincipal
        );
        const telefonePrincipal = cliente.contatos?.find(
          (c) => c.tipo === "TELEFONE" && c.isPrincipal
        );

        if (!emailPrincipal && !telefonePrincipal)
          return (
            <span className="text-xs text-muted-foreground italic">
              Sem contato
            </span>
          );

        return (
          <div className="flex flex-col gap-1.5">
            {emailPrincipal && (
              <div className="flex items-center gap-1.5 text-xs">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span className="truncate max-w-[150px]">
                  {emailPrincipal.valor}
                </span>
                <Badge variant="outline" className="text-[8px] h-3 px-1">
                  Email
                </Badge>
              </div>
            )}
            {telefonePrincipal && (
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 text-xs">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate max-w-[150px]">
                    {telefonePrincipal.valor}
                  </span>
                  <Badge variant="outline" className="text-[8px] h-3 px-1">
                    Tel
                  </Badge>
                </div>
                {telefonePrincipal.isWhatsapp && (
                  <Badge
                    variant="outline"
                    className="w-fit text-[8px] h-3.5 px-1 bg-green-500/5 text-green-600 border-green-200"
                  >
                    WhatsApp
                  </Badge>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (cliente) => (
        <StatusBadge
          status={cliente.status}
          variant={getStatusVariant(cliente.status)}
        />
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
      label: "Detalhes",
      onClick: handleOpenDetalhes,
    },
    {
      label: "Editar",
      onClick: (cliente) => handleOpenModal(cliente),
    },
    {
      label: "Excluir",
      onClick: handleDelete,
      variant: "destructive",
    },
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <PageHeader
        title="Clientes"
        description="Gerencie as empresas e contratos"
        icon={Building2}
        action={{
          label: "Novo Cliente",
          onClick: () => handleOpenModal(),
          icon: Plus,
        }}
      />

      <DataTable
        data={clientes}
        columns={columns}
        actions={actions}
        searchKey={["razaoSocial", "nomeFantasia", "codigoCrm", "documento"]}
        searchPlaceholder="Buscar por razão social, nome fantasia, CRM ou documento..."
      />

      {/* Modal de Criar/Editar Cliente */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] min-h-[600px] flex flex-col p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>
              {clienteEditando ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
            <DialogDescription>
              {clienteEditando
                ? "Atualize as informações do cliente"
                : "Preencha os dados para cadastrar um novo cliente"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-12">
            {/* Logo da Empresa */}
            {clienteEditando && (
              <div className="flex justify-center pb-2">
                <div className="w-full max-w-[200px]">
                  <ClienteLogoUpload
                    clienteId={clienteEditando.id}
                    razaoSocial={clienteEditando.razaoSocial}
                    onUploadSuccess={() =>
                      setLogoRefreshKey((prev) => prev + 1)
                    }
                    onDeleteSuccess={() =>
                      setLogoRefreshKey((prev) => prev + 1)
                    }
                  />
                </div>
              </div>
            )}

            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-3">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Pessoa</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value: "PF" | "PJ") =>
                    setFormData({ ...formData, tipo: value })
                  }
                >
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
                <Label htmlFor="documento">
                  {formData.tipo === "PJ" ? "CNPJ" : "CPF"}
                </Label>
                <div className="relative">
                  <Input
                    id="documento"
                    value={formData.documento || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      const maskedValue =
                        formData.tipo === "PJ"
                          ? maskCNPJ(value)
                          : maskCPF(value);
                      setFormData({ ...formData, documento: maskedValue });

                      if (
                        formData.tipo === "PJ" &&
                        maskedValue.replace(/\D/g, "").length === 14
                      ) {
                        handleBuscarCnpj(maskedValue);
                      }
                    }}
                    placeholder={
                      formData.tipo === "PJ"
                        ? "00.000.000/0000-00"
                        : "000.000.000-00"
                    }
                  />
                  {isBuscandoCnpj && (
                    <div className="absolute right-3 top-2.5">
                      <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 space-y-2">
                <Label htmlFor="razaoSocial">
                  Razão Social / Nome Completo
                </Label>
                <Input
                  id="razaoSocial"
                  value={formData.razaoSocial || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, razaoSocial: e.target.value })
                  }
                  placeholder="Digite a razão social ou nome completo"
                />
              </div>

              <div className="col-span-1 md:col-span-2 space-y-2">
                <Label htmlFor="nomeFantasia">Nome Fantasia (Opcional)</Label>
                <Input
                  id="nomeFantasia"
                  value={formData.nomeFantasia || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, nomeFantasia: e.target.value })
                  }
                  placeholder="Digite o nome fantasia"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
                <Input
                  id="inscricaoEstadual"
                  value={formData.inscricaoEstadual || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      inscricaoEstadual: e.target.value,
                    })
                  }
                  placeholder="Isento ou número"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inscricaoMunicipal">Inscrição Municipal</Label>
                <Input
                  id="inscricaoMunicipal"
                  value={formData.inscricaoMunicipal || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      inscricaoMunicipal: e.target.value,
                    })
                  }
                  placeholder="Número da inscrição"
                />
              </div>

              {clienteEditando && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status as string}
                    onValueChange={(value: Status) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
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

            {/* Endereço */}
            <div className="space-y-4 pt-6 border-t px-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Endereço</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="relative">
                    <Input
                      id="cep"
                      value={formData.endereco?.cep || ""}
                      onChange={(e) => {
                        const masked = maskCEP(e.target.value);
                        setFormData({
                          ...formData,
                          endereco: { ...formData.endereco!, cep: masked },
                        });
                        if (masked.replace(/\D/g, "").length === 8) {
                          handleBuscarCep(masked);
                        }
                      }}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    {isBuscandoCep && (
                      <div className="absolute right-3 top-2.5">
                        <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="logradouro">Logradouro</Label>
                  <Input
                    id="logradouro"
                    value={formData.endereco?.logradouro || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endereco: {
                          ...formData.endereco!,
                          logradouro: e.target.value,
                        },
                      })
                    }
                    placeholder="Rua, Avenida, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={formData.endereco?.numero || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endereco: {
                          ...formData.endereco!,
                          numero: e.target.value,
                        },
                      })
                    }
                    placeholder="123"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    value={formData.endereco?.complemento || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endereco: {
                          ...formData.endereco!,
                          complemento: e.target.value,
                        },
                      })
                    }
                    placeholder="Apto, Sala, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={formData.endereco?.bairro || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endereco: {
                          ...formData.endereco!,
                          bairro: e.target.value,
                        },
                      })
                    }
                    placeholder="Nome do bairro"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.endereco?.cidade || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endereco: {
                          ...formData.endereco!,
                          cidade: e.target.value,
                        },
                      })
                    }
                    placeholder="Cidade"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado (UF)</Label>
                  <Input
                    id="estado"
                    value={formData.endereco?.estado || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endereco: {
                          ...formData.endereco!,
                          estado: e.target.value,
                        },
                      })
                    }
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pais">País</Label>
                  <Input
                    id="pais"
                    value={formData.endereco?.pais || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endereco: {
                          ...formData.endereco!,
                          pais: e.target.value,
                        },
                      })
                    }
                    placeholder="Brasil"
                  />
                </div>
              </div>
            </div>

            {/* Seção de Contatos */}
            <div className="pt-6 border-t px-3">
              <ContatosSection
                contatos={formData.contatos || []}
                onChange={(contatos) => setFormData({ ...formData, contatos })}
              />
            </div>

            {/* Observações */}
            <div className="space-y-2 pt-6 border-t px-3">
              <Label htmlFor="observacoes">Observações</Label>
              <Input
                id="observacoes"
                value={formData.observacoes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, observacoes: e.target.value })
                }
                placeholder="Observações internas sobre o cliente"
              />
            </div>
          </div>

          <DialogFooter className="!p-6 !pt-2 flex items-center justify-between">
            {!clienteEditando && (
              <div className="flex items-center space-x-2 mr-auto">
                <Checkbox
                  id="criarOutro"
                  checked={criarOutro}
                  onCheckedChange={(checked: boolean) =>
                    setCriarOutro(checked === true)
                  }
                />
                <label
                  htmlFor="criarOutro"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Criar outro após salvar
                </label>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setModalAberto(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSalvar} disabled={isLoading}>
                {isLoading
                  ? "Salvando..."
                  : clienteEditando
                  ? "Salvar Alterações"
                  : "Cadastrar Cliente"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes do Cliente */}
      <Dialog open={detalhesModalOpen} onOpenChange={setDetalhesModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <ClienteLogo
                  clienteId={clienteSelecionado?.id || ""}
                  razaoSocial={clienteSelecionado?.razaoSocial || ""}
                  refreshKey={logoRefreshKey}
                  className="h-8 w-8"
                />
                <span>{clienteSelecionado?.razaoSocial}</span>
              </div>
              <Badge
                variant="outline"
                className="font-mono text-xs border-primary/30 text-primary"
              >
                {clienteSelecionado?.codigoCrm}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Informações detalhadas, usuários e licenças vinculadas.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1">
            {isLoadingDetalhes ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Carregando detalhes...
                </p>
              </div>
            ) : (
              <div className="p-6 space-y-8">
                {/* Informações do Cliente */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                      <FileText className="h-4 w-4" />
                      Dados Cadastrais
                    </h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-[10px] uppercase font-bold">
                          Razão Social
                        </p>
                        <p className="font-medium">
                          {clienteSelecionado?.razaoSocial}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-[10px] uppercase font-bold">
                          Nome Fantasia
                        </p>
                        <p className="font-medium">
                          {clienteSelecionado?.nomeFantasia || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-[10px] uppercase font-bold">
                          Documento ({clienteSelecionado?.tipo})
                        </p>
                        <p className="font-medium">
                          {clienteSelecionado?.documento}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-[10px] uppercase font-bold">
                          Código CRM
                        </p>
                        <p className="font-medium">
                          {clienteSelecionado?.codigoCrm}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-[10px] uppercase font-bold">
                          Inscrição Estadual
                        </p>
                        <p className="font-medium">
                          {clienteSelecionado?.inscricaoEstadual || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-[10px] uppercase font-bold">
                          Inscrição Municipal
                        </p>
                        <p className="font-medium">
                          {clienteSelecionado?.inscricaoMunicipal || "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                      <Mail className="h-4 w-4" />
                      Contatos
                    </h3>
                    <div className="space-y-2">
                      {clienteSelecionado?.contatos?.map((contato, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 border rounded-md bg-muted/30"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            {contato.tipo === "EMAIL" ? (
                              <Mail className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <Phone className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span className="text-xs truncate">
                              {contato.valor}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            {contato.isPrincipal && (
                              <Badge className="text-[8px] h-3.5 px-1">P</Badge>
                            )}
                            {contato.isWhatsapp && (
                              <Badge
                                variant="outline"
                                className="text-[8px] h-3.5 px-1 bg-green-500/10 text-green-600 border-green-200"
                              >
                                W
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      {(!clienteSelecionado?.contatos ||
                        clienteSelecionado.contatos.length === 0) && (
                        <p className="text-xs text-muted-foreground italic">
                          Nenhum contato cadastrado.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                      <MapPin className="h-4 w-4" />
                      Endereço
                    </h3>
                    <div className="text-xs space-y-1 bg-muted/30 p-3 border rounded-md">
                      {clienteSelecionado?.endereco ? (
                        <>
                          <p className="font-medium">
                            {clienteSelecionado.endereco.logradouro},{" "}
                            {clienteSelecionado.endereco.numero}
                          </p>
                          {clienteSelecionado.endereco.complemento && (
                            <p className="text-muted-foreground">
                              {clienteSelecionado.endereco.complemento}
                            </p>
                          )}
                          <p className="text-muted-foreground">
                            {clienteSelecionado.endereco.bairro}
                          </p>
                          <p className="text-muted-foreground">
                            {clienteSelecionado.endereco.cidade} -{" "}
                            {clienteSelecionado.endereco.estado}
                          </p>
                          <p className="text-muted-foreground">
                            CEP:{" "}
                            {maskCEP(clienteSelecionado.endereco.cep || "")}
                          </p>
                        </>
                      ) : (
                        <p className="italic text-muted-foreground">
                          Endereço não informado.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Coluna 1: Usuários */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Usuários Vinculados ({usuariosVinculados.length})
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/usuarios")}
                        className="h-7 text-[10px]"
                      >
                        Gerenciar <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {usuariosVinculados.length > 0 ? (
                        usuariosVinculados.map((u) => (
                          <div
                            key={u.id}
                            className="flex items-center justify-between p-3 border rounded-lg bg-card"
                          >
                            <div className="flex items-center gap-3">
                              <UserAvatar
                                userId={u.id}
                                userName={u.nome}
                                className="h-8 w-8"
                              />
                              <div>
                                <p className="text-sm font-medium">{u.nome}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {u.email}
                                </p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-[10px]">
                              {u.vinculos?.find(
                                (v) => v.clienteId === clienteSelecionado?.id
                              )?.role || "OPERADOR"}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground italic py-4 text-center border rounded-lg border-dashed">
                          Nenhum usuário vinculado.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Coluna 2: Licenças e Produtos */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Licenças Ativas ({licencasCliente.length})
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/licencas?clienteId=${clienteSelecionado?.id}`
                          )
                        }
                        className="h-7 text-[10px]"
                      >
                        Ver Todas <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {licencasCliente.length > 0 ? (
                        licencasCliente.map((l) => (
                          <div
                            key={l.id}
                            className="p-3 border rounded-lg bg-card space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <ProdutoLogo
                                  produtoId={l.produtoId}
                                  produtoNome={l.produtoNome}
                                  planoNome={l.planoNome}
                                  className="h-8 w-8"
                                  showTooltip
                                />
                                <p className="text-sm font-bold">
                                  {l.produtoNome}
                                </p>
                              </div>
                              <StatusBadge
                                status={l.status}
                                variant={getStatusVariant(l.status)}
                                className="text-[10px] h-5"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div>
                                <p className="text-muted-foreground">Plano</p>
                                <p className="font-medium">{l.planoNome}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">
                                  Expiração
                                </p>
                                <p className="font-medium">
                                  {new Date(l.dataExpiracao).toLocaleDateString(
                                    "pt-BR"
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="pt-1 border-t flex justify-between items-center">
                              <code className="text-[9px] bg-muted px-1 rounded">
                                {l.chave.substring(0, 12)}...
                              </code>
                              <span className="text-[9px] text-muted-foreground">
                                {l.usuariosAtivos} / {l.limiteUsuarios || "∞"}{" "}
                                usuários
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground italic py-4 text-center border rounded-lg border-dashed">
                          Nenhuma licença encontrada.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="p-6 pt-2">
            <Button onClick={() => setDetalhesModalOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmModal.open}
        onOpenChange={(open) => setConfirmModal((prev) => ({ ...prev, open }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        variant="destructive"
      />
    </div>
  );
}
