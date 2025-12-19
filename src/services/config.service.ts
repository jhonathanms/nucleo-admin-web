import api from "./api";
import { SmtpConfig, EmailTemplate } from "../types/config.types";

class ConfigService {
  async getSmtpConfig(): Promise<SmtpConfig> {
    const response = await api.get("/config/smtp");
    return response.data;
  }

  async updateSmtpConfig(config: SmtpConfig): Promise<void> {
    await api.put("/config/smtp", config);
  }

  async testSmtpConnection(
    config: SmtpConfig
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.post("/config/smtp/test", config);
    return response.data;
  }

  async getTemplates(): Promise<EmailTemplate[]> {
    const response = await api.get("/config/templates");
    return response.data;
  }

  async saveTemplate(template: Partial<EmailTemplate>): Promise<EmailTemplate> {
    if (template.id) {
      const response = await api.put(
        `/config/templates/${template.id}`,
        template
      );
      return response.data;
    } else {
      const response = await api.post("/config/templates", template);
      return response.data;
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    await api.delete(`/config/templates/${id}`);
  }
}

export const configService = new ConfigService();
