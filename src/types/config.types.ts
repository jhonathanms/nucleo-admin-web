export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

export interface EmailTemplate {
  id: string;
  nome: string;
  assunto: string;
  corpo: string;
  tipo: "COBRANCA" | "BOLETO" | "COMPROVANTE" | "GERAL";
}

export interface SystemConfig {
  smtp: SmtpConfig;
  templates: EmailTemplate[];
}
