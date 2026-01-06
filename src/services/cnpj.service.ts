import axios from "axios";

export interface BrasilAPICNPJ {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  uf: string;
  municipio: string;
  ddd_telefone_1: string;
  ddd_telefone_2: string;
  telefone_1: string;
  telefone_2: string;
  email: string;
}

class CnpjService {
  async buscarCnpj(cnpj: string): Promise<BrasilAPICNPJ> {
    const cleanCnpj = cnpj.replace(/\D/g, "");
    if (cleanCnpj.length !== 14) {
      throw new Error("CNPJ inválido");
    }
    const response = await axios.get<BrasilAPICNPJ>(
      `https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`
    );
    return response.data;
  }
}

const cnpjService = new CnpjService();
export default cnpjService;
