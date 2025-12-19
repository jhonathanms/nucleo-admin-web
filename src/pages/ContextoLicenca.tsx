import { useState, useEffect } from "react";
import { Shield, Key, Calendar, Users, Box, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import sessaoService from "@/services/sessao.service";
import { ContextoLicenca } from "@/types/sessao.types";
import { useToast } from "@/hooks/use-toast";

export default function ContextoLicencaPage() {
  const [contexto, setContexto] = useState<ContextoLicenca | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadContexto = async () => {
      try {
        const data = await sessaoService.obterContextoLicenca();
        setContexto(data);
      } catch (error) {
        console.error("Erro ao carregar contexto da licença:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as informações da licença.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadContexto();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!contexto) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contexto da Licença"
        description="Informações detalhadas da licença ativa para este produto"
        icon={Shield}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Informações Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Licença
            </CardTitle>
            <CardDescription>Dados básicos do contrato</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Chave</p>
              <p className="font-mono text-sm bg-muted p-2 rounded mt-1">
                {contexto.chave}
              </p>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Expira em</span>
              </div>
              <span className="font-medium">
                {new Date(contexto.dataExpiracao).toLocaleDateString("pt-BR")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Plano e Limites */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Box className="h-5 w-5 text-primary" />
              Plano: {contexto.plano.nome}
            </CardTitle>
            <CardDescription>{contexto.plano.descricao}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Usuários</span>
              </div>
              <span className="font-medium">
                {contexto.usuariosAtivos} / {contexto.limiteUsuarios}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Recursos inclusos
              </p>
              <div className="flex flex-wrap gap-2">
                {contexto.plano.recursos.map((recurso) => (
                  <Badge key={recurso} variant="secondary">
                    {recurso}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Módulos e Permissões */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Acessos
            </CardTitle>
            <CardDescription>Módulos e permissões liberadas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Módulos</p>
              <div className="flex flex-wrap gap-2">
                {contexto.modulos.map((modulo) => (
                  <Badge
                    key={modulo}
                    variant="outline"
                    className="border-primary/50 text-primary"
                  >
                    {modulo}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Permissões</p>
              <div className="grid grid-cols-2 gap-2">
                {contexto.permissoes.map((permissao) => (
                  <div
                    key={permissao}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {permissao}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
