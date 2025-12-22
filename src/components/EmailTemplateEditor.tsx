import { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Type,
  LayoutTemplate,
  Variable,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EmailTemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  tipo: string;
}

const VARIAVEIS = {
  GERAL: [
    { label: "Nome da Empresa", value: "{{empresa_nome}}" },
    { label: "Email de Suporte", value: "{{suporte_email}}" },
    { label: "Data Atual", value: "{{data_atual}}" },
  ],
  CLIENTE: [
    { label: "Nome do Cliente", value: "{{nome}}" },
    { label: "Email do Cliente", value: "{{email}}" },
    { label: "Documento (CPF/CNPJ)", value: "{{documento}}" },
  ],
  FINANCEIRO: [
    { label: "Valor do Título", value: "{{valor}}" },
    { label: "Data de Vencimento", value: "{{vencimento}}" },
    { label: "Número do Título", value: "{{numero}}" },
    { label: "Link do Boleto", value: "{{link_boleto}}" },
    { label: "Linha Digitável", value: "{{linha_digitavel}}" },
    { label: "Descrição", value: "{{descricao}}" },
  ],
};

const TEMPLATES_PREDEFINIDOS = {
  COBRANCA_MODERNA: `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb;">
  <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Aviso de Cobrança</h1>
    <p style="color: #e0e7ff; margin-top: 10px; font-size: 16px;">Importante: Seu título vence em breve</p>
  </div>
  <div style="padding: 40px; color: #374151;">
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Olá, <strong style="color: #111827;">{{nome}}</strong>.</p>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Esperamos que esteja tudo bem. Gostaríamos de lembrar que o seu título referente a <strong>{{descricao}}</strong> está próximo do vencimento.</p>
    
    <div style="background-color: #f3f4f6; padding: 24px; border-radius: 12px; margin: 32px 0; border-left: 4px solid #4f46e5;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <span style="color: #6b7280; font-size: 14px;">Valor a Pagar</span>
        <span style="color: #111827; font-weight: 700; font-size: 18px;">{{valor}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <span style="color: #6b7280; font-size: 14px;">Vencimento</span>
        <span style="color: #ef4444; font-weight: 700; font-size: 16px;">{{vencimento}}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #6b7280; font-size: 14px;">Título Nº</span>
        <span style="color: #374151; font-family: monospace; font-size: 14px;">{{numero}}</span>
      </div>
    </div>

    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 32px;">Para sua comodidade, você pode acessar a fatura detalhada e realizar o pagamento clicando no botão abaixo:</p>
    
    <div style="text-align: center; margin-bottom: 32px;">
      <a href="{{link_boleto}}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.2s; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);">
        Visualizar Fatura
      </a>
    </div>

    <p style="font-size: 14px; color: #6b7280; text-align: center;">Caso já tenha efetuado o pagamento, por favor desconsidere este aviso.</p>
  </div>
  <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="margin: 0; font-size: 12px; color: #9ca3af;">Enviado automaticamente por <strong>{{empresa_nome}}</strong></p>
    <p style="margin: 8px 0 0; font-size: 12px; color: #9ca3af;">Dúvidas? Entre em contato: <a href="mailto:{{suporte_email}}" style="color: #4f46e5; text-decoration: none;">{{suporte_email}}</a></p>
  </div>
</div>
  `,
  BOLETO_CLEAN: `
<div style="font-family: Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
  <div style="padding: 30px; border-bottom: 1px solid #e2e8f0;">
    <h2 style="margin: 0; color: #1e293b;">Olá, {{nome}}</h2>
    <p style="color: #64748b; margin-top: 8px;">Segue o seu boleto para pagamento.</p>
  </div>
  <div style="padding: 30px; background-color: #f8fafc;">
    <div style="background: #fff; padding: 20px; border-radius: 6px; border: 1px solid #e2e8f0; text-align: center;">
      <p style="font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 5px;">Valor do Documento</p>
      <p style="font-size: 32px; font-weight: bold; color: #0f172a; margin: 0;">{{valor}}</p>
      <p style="font-size: 14px; color: #ef4444; margin-top: 10px;">Vence em: {{vencimento}}</p>
    </div>
    
    <div style="margin-top: 20px;">
      <p style="font-size: 14px; color: #334155; margin-bottom: 8px;">Linha Digitável:</p>
      <div style="background: #e2e8f0; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 14px; color: #334155; word-break: break-all;">
        {{linha_digitavel}}
      </div>
    </div>
  </div>
  <div style="padding: 30px; text-align: center;">
    <a href="{{link_boleto}}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Baixar Boleto PDF</a>
  </div>
</div>
  `,
  SIMPLES: `
<div style="font-family: sans-serif; padding: 20px; color: #333;">
  <p>Prezado(a) {{nome}},</p>
  <p>Informamos que o título <strong>{{numero}}</strong> no valor de <strong>{{valor}}</strong> vence no dia <strong>{{vencimento}}</strong>.</p>
  <p>Atenciosamente,<br>{{empresa_nome}}</p>
</div>
  `,
};

export function EmailTemplateEditor({
  value,
  onChange,
  tipo,
}: EmailTemplateEditorProps) {
  const [editorElement, setEditorElement] = useState<HTMLDivElement | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("visual");

  // Sincronizar o editor visual quando o valor muda ou quando a aba visual se torna ativa
  useEffect(() => {
    if (activeTab === "visual" && editorElement) {
      // Só atualizamos se o conteúdo for realmente diferente para evitar perda de foco/cursor
      if (editorElement.innerHTML !== value) {
        editorElement.innerHTML = value || "";
      }
    }
  }, [activeTab, value, editorElement]);

  const execCommand = (
    command: string,
    value: string | undefined = undefined
  ) => {
    document.execCommand(command, false, value);
    if (editorElement) {
      onChange(editorElement.innerHTML);
    }
  };

  const insertVariable = (variable: string) => {
    if (activeTab === "visual") {
      execCommand("insertText", variable);
    } else {
      // Inserir no textarea (modo código)
      const textarea = document.getElementById(
        "html-editor"
      ) as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const newText =
          text.substring(0, start) + variable + text.substring(end);
        onChange(newText);
      }
    }
  };

  const loadTemplate = (templateKey: keyof typeof TEMPLATES_PREDEFINIDOS) => {
    const template = TEMPLATES_PREDEFINIDOS[templateKey];
    onChange(template);
    if (editorElement) {
      editorElement.innerHTML = template;
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-background shadow-sm">
      <div className="border-b bg-muted/30 p-2 flex flex-wrap items-center gap-1">
        {/* Toolbar de Formatação */}
        <div className="flex items-center gap-1 mr-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => execCommand("bold")}
                >
                  <Bold className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Negrito</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand("italic")}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand("underline")}
          >
            <Underline className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <div className="flex items-center gap-1 mr-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand("justifyLeft")}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand("justifyCenter")}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand("justifyRight")}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Menu de Templates */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 h-8">
              <LayoutTemplate className="h-4 w-4" />
              Modelos
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Escolha um modelo</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => loadTemplate("COBRANCA_MODERNA")}>
              <div className="flex flex-col">
                <span className="font-medium">Cobrança Moderna</span>
                <span className="text-xs text-muted-foreground">
                  Design premium com gradiente
                </span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => loadTemplate("BOLETO_CLEAN")}>
              <div className="flex flex-col">
                <span className="font-medium">Boleto Clean</span>
                <span className="text-xs text-muted-foreground">
                  Minimalista e direto
                </span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => loadTemplate("SIMPLES")}>
              <div className="flex flex-col">
                <span className="font-medium">Texto Simples</span>
                <span className="text-xs text-muted-foreground">
                  Apenas texto básico
                </span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Menu de Variáveis */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="gap-2 h-8 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 border"
            >
              <Variable className="h-4 w-4" />
              Inserir Variável
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-64 max-h-[300px] overflow-y-auto"
          >
            <DropdownMenuLabel>Geral</DropdownMenuLabel>
            {VARIAVEIS.GERAL.map((v) => (
              <DropdownMenuItem
                key={v.value}
                onClick={() => insertVariable(v.value)}
                className="justify-between group"
              >
                <span>{v.label}</span>
                <code className="text-xs bg-muted px-1 rounded text-muted-foreground group-hover:text-foreground">
                  {v.value}
                </code>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Cliente</DropdownMenuLabel>
            {VARIAVEIS.CLIENTE.map((v) => (
              <DropdownMenuItem
                key={v.value}
                onClick={() => insertVariable(v.value)}
                className="justify-between group"
              >
                <span>{v.label}</span>
                <code className="text-xs bg-muted px-1 rounded text-muted-foreground group-hover:text-foreground">
                  {v.value}
                </code>
              </DropdownMenuItem>
            ))}

            {(tipo === "COBRANCA" || tipo === "BOLETO") && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Financeiro</DropdownMenuLabel>
                {VARIAVEIS.FINANCEIRO.map((v) => (
                  <DropdownMenuItem
                    key={v.value}
                    onClick={() => insertVariable(v.value)}
                    className="justify-between group"
                  >
                    <span>{v.label}</span>
                    <code className="text-xs bg-muted px-1 rounded text-muted-foreground group-hover:text-foreground">
                      {v.value}
                    </code>
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-2 bg-muted/30 border-b flex justify-end">
          <TabsList className="h-8 bg-transparent p-0">
            <TabsTrigger
              value="visual"
              className="h-8 text-xs data-[state=active]:bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none"
            >
              Visual
            </TabsTrigger>
            <TabsTrigger
              value="codigo"
              className="h-8 text-xs data-[state=active]:bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none"
            >
              Código HTML
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="visual" className="m-0 p-0">
          <div
            ref={setEditorElement}
            contentEditable
            onInput={(e) => onChange(e.currentTarget.innerHTML)}
            className="min-h-[400px] p-6 outline-none prose max-w-none bg-white"
            style={{ fontFamily: "initial" }} // Reset font family to allow template styles to take over
          />
        </TabsContent>

        <TabsContent value="codigo" className="m-0 p-0">
          <textarea
            id="html-editor"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full min-h-[400px] p-4 font-mono text-sm bg-slate-950 text-slate-50 resize-none focus:outline-none"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
