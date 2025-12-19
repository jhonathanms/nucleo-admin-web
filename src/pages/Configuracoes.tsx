import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { configService } from "@/services/config.service";
import { SmtpConfig, EmailTemplate } from "@/types/config.types";
import {
  Mail,
  Settings,
  FileText,
  Plus,
  Trash2,
  Edit,
  Save,
  Send,
} from "lucide-react";
import { DataTable } from "@/components/DataTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Configuracoes() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [smtp, setSmtp] = useState<SmtpConfig>({
    host: "",
    port: 587,
    secure: false,
    user: "",
    pass: "",
    from: "",
  });

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [modalTemplateAberto, setModalTemplateAberto] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<Partial<EmailTemplate> | null>(null);

  useEffect(() => {
    loadSmtp();
    loadTemplates();
  }, []);

  const loadSmtp = async () => {
    try {
      const data = await configService.getSmtpConfig();
      if (data) setSmtp(data);
    } catch (error) {
      console.error("Erro ao carregar SMTP:", error);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await configService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Erro ao carregar templates:", error);
    }
  };

  const handleSaveSmtp = async () => {
    setIsLoading(true);
    try {
      await configService.updateSmtpConfig(smtp);
      toast({
        title: "Sucesso",
        description: "Configurações SMTP salvas com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar as configurações SMTP.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSmtp = async () => {
    setIsLoading(true);
    try {
      const result = await configService.testSmtpConnection(smtp);
      if (result.success) {
        toast({
          title: "Conexão OK",
          description: result.message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Falha na Conexão",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao testar conexão SMTP.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (
      !selectedTemplate?.nome ||
      !selectedTemplate?.assunto ||
      !selectedTemplate?.corpo
    ) {
      toast({
        variant: "destructive",
        title: "Atenção",
        description: "Preencha todos os campos obrigatórios.",
      });
      return;
    }

    setIsLoading(true);
    try {
      await configService.saveTemplate(selectedTemplate);
      toast({
        title: "Sucesso",
        description: "Template salvo com sucesso.",
      });
      setModalTemplateAberto(false);
      loadTemplates();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar o template.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este template?")) return;

    try {
      await configService.deleteTemplate(id);
      toast({
        title: "Sucesso",
        description: "Template excluído com sucesso.",
      });
      loadTemplates();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o template.",
      });
    }
  };

  const templateColumns = [
    {
      key: "nome",
      header: "Nome",
      cell: (item: EmailTemplate) => item.nome,
    },
    {
      key: "tipo",
      header: "Tipo",
      cell: (item: EmailTemplate) => item.tipo,
    },
    {
      key: "assunto",
      header: "Assunto",
      cell: (item: EmailTemplate) => item.assunto,
    },
  ];

  const templateActions = [
    {
      label: "Editar",
      icon: Edit,
      onClick: (template: EmailTemplate) => {
        setSelectedTemplate(template);
        setModalTemplateAberto(true);
      },
    },
    {
      label: "Excluir",
      icon: Trash2,
      variant: "destructive" as const,
      onClick: (template: EmailTemplate) => handleDeleteTemplate(template.id),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Gerencie as configurações globais do sistema."
      />

      <Tabs defaultValue="smtp" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="smtp" className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> E-mail (SMTP)
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="smtp" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Servidor SMTP</CardTitle>
              <CardDescription>
                Configure os detalhes do servidor de e-mail para envio de
                notificações e cobranças.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="host">Host SMTP</Label>
                  <Input
                    id="host"
                    placeholder="smtp.exemplo.com"
                    value={smtp.host}
                    onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Porta</Label>
                  <Input
                    id="port"
                    type="number"
                    placeholder="587"
                    value={smtp.port}
                    onChange={(e) =>
                      setSmtp({ ...smtp, port: parseInt(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user">Usuário / E-mail</Label>
                  <Input
                    id="user"
                    placeholder="contato@exemplo.com"
                    value={smtp.user}
                    onChange={(e) => setSmtp({ ...smtp, user: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pass">Senha</Label>
                  <Input
                    id="pass"
                    type="password"
                    placeholder="******"
                    value={smtp.pass}
                    onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from">E-mail de Envio (From)</Label>
                  <Input
                    id="from"
                    placeholder="Nucleo Admin <contato@exemplo.com>"
                    value={smtp.from}
                    onChange={(e) => setSmtp({ ...smtp, from: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="secure"
                    checked={smtp.secure}
                    onCheckedChange={(checked) =>
                      setSmtp({ ...smtp, secure: checked })
                    }
                  />
                  <Label htmlFor="secure">Usar SSL/TLS Seguro</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleTestSmtp}
                  disabled={isLoading}
                >
                  <Send className="mr-2 h-4 w-4" /> Testar Conexão
                </Button>
                <Button onClick={handleSaveSmtp} disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" /> Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => {
                setSelectedTemplate({ tipo: "COBRANCA" });
                setModalTemplateAberto(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Novo Template
            </Button>
          </div>

          <DataTable
            columns={templateColumns}
            data={templates}
            actions={templateActions}
          />
        </TabsContent>
      </Tabs>

      {/* Modal de Template */}
      <Dialog open={modalTemplateAberto} onOpenChange={setModalTemplateAberto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate?.id ? "Editar Template" : "Novo Template"}
            </DialogTitle>
            <DialogDescription>
              Configure o conteúdo do e-mail. Use variáveis como {"{{nome}}"},{" "}
              {"{{valor}}"}, {"{{vencimento}}"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Template</Label>
                <Input
                  value={selectedTemplate?.nome || ""}
                  onChange={(e) =>
                    setSelectedTemplate({
                      ...selectedTemplate,
                      nome: e.target.value,
                    })
                  }
                  placeholder="Ex: Cobrança Padrão"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={selectedTemplate?.tipo}
                  onValueChange={(value: any) =>
                    setSelectedTemplate({ ...selectedTemplate, tipo: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COBRANCA">Cobrança</SelectItem>
                    <SelectItem value="BOLETO">Boleto</SelectItem>
                    <SelectItem value="COMPROVANTE">Comprovante</SelectItem>
                    <SelectItem value="GERAL">Geral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assunto do E-mail</Label>
              <Input
                value={selectedTemplate?.assunto || ""}
                onChange={(e) =>
                  setSelectedTemplate({
                    ...selectedTemplate,
                    assunto: e.target.value,
                  })
                }
                placeholder="Ex: Lembrete de Vencimento - {{nome}}"
              />
            </div>
            <div className="space-y-2">
              <Label>Corpo do E-mail (HTML/Texto)</Label>
              <Textarea
                className="min-h-[200px]"
                value={selectedTemplate?.corpo || ""}
                onChange={(e) =>
                  setSelectedTemplate({
                    ...selectedTemplate,
                    corpo: e.target.value,
                  })
                }
                placeholder="Olá {{nome}}, seu título no valor de {{valor}} vence em {{vencimento}}..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalTemplateAberto(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveTemplate} disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
