export interface ContextoLicenca {
  licencaId: string;
  chave: string;
  dataExpiracao: string;
  limiteUsuarios: number;
  usuariosAtivos: number;
  plano: {
    id: string;
    nome: string;
    descricao: string;
    valor: number;
    limiteUsuarios: number;
    recursos: string[];
  };
  modulos: string[];
  permissoes: string[];
}
