import api from "./api";

export interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: "INFO" | "AVISO" | "ERRO" | "SUCESSO";
  lida: boolean;
  dataCriacao: string;
  link?: string;
}

class NotificacaoService {
  private readonly baseURL = "/notificacoes";

  async getAll(): Promise<Notificacao[]> {
    try {
      const response = await api.get<Notificacao[]>(this.baseURL);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.warn("Notificações não implementadas no back, usando mock.");
      return this.getMocks();
    }
  }

  async marcarComoLida(id: string): Promise<void> {
    await api.patch(`${this.baseURL}/${id}/ler`);
  }

  async excluir(id: string): Promise<void> {
    await api.delete(`${this.baseURL}/${id}`);
  }

  private getMocks(): Notificacao[] {
    const now = new Date();
    return [
      {
        id: "1",
        titulo: "Licença Vencendo",
        mensagem: "A licença do cliente Jhonathan Martins vence hoje.",
        tipo: "AVISO",
        lida: false,
        dataCriacao: now.toISOString(),
        link: "/licencas",
      },
      {
        id: "2",
        titulo: "Título em Atraso",
        mensagem: "Existem 3 títulos vencidos que precisam de atenção.",
        tipo: "ERRO",
        lida: false,
        dataCriacao: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
        link: "/financeiro",
      },
    ];
  }
}

export default new NotificacaoService();
