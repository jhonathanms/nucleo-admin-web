import api from "./api";
import { ContextoLicenca } from "@/types/sessao.types";

class SessaoService {
  private readonly baseURL = "/auth";

  /**
   * Valida a sessão específica do produto
   */
  async validarSessao(): Promise<void> {
    await api.post(`${this.baseURL}/validar-sessao`);
  }

  /**
   * Mantém a sessão ativa
   */
  async heartbeat(): Promise<void> {
    await api.post(`${this.baseURL}/heartbeat`);
  }

  /**
   * Obtém o contexto da licença baseado no produto atual
   */
  async obterContextoLicenca(): Promise<ContextoLicenca> {
    const response = await api.get<ContextoLicenca>("/licencas/contexto");
    return response.data;
  }
}

export default new SessaoService();
