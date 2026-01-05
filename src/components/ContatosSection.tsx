import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Mail, Phone } from "lucide-react";
import { ClienteContato } from "@/types/cliente.types";
import { Badge } from "@/components/ui/badge";
import { isValidEmail, isValidPhone, cn } from "@/lib/utils";

interface ContatosSectionProps {
  contatos: ClienteContato[];
  onChange: (contatos: ClienteContato[]) => void;
}

export function ContatosSection({ contatos, onChange }: ContatosSectionProps) {
  const contatosList = contatos || [];

  const addContato = () => {
    const tipo: "EMAIL" | "TELEFONE" = "EMAIL";
    const novoContato: ClienteContato = {
      tipo,
      valor: "",
      isWhatsapp: false,
      isPrincipal: !contatosList.some((c) => c.tipo === tipo),
    };
    onChange([...contatosList, novoContato]);
  };

  const removeContato = (index: number) => {
    const removedContato = contatosList[index];
    const newList = contatosList.filter((_, i) => i !== index);

    // Se removeu o principal de um tipo, marca o próximo do mesmo tipo como principal
    if (removedContato.isPrincipal) {
      const nextOfType = newList.find((c) => c.tipo === removedContato.tipo);
      if (nextOfType) {
        nextOfType.isPrincipal = true;
      }
    }
    onChange(newList);
  };

  const updateContato = (
    index: number,
    field: keyof ClienteContato,
    value: any
  ) => {
    const newList = contatosList.map((c, i) =>
      i === index ? { ...c, [field]: value } : { ...c }
    );
    const currentContato = newList[index];

    if (field === "isPrincipal" && value === true) {
      // Garante apenas um principal para este TIPO
      newList.forEach((c, i) => {
        if (i !== index && c.tipo === currentContato.tipo) {
          c.isPrincipal = false;
        }
      });
    }

    if (field === "tipo") {
      // Se mudar o tipo, garante que as regras de principal e whatsapp sejam mantidas
      if (currentContato.isPrincipal) {
        newList.forEach((c, i) => {
          if (i !== index && c.tipo === value) {
            c.isPrincipal = false;
          }
        });
      } else {
        // Se não era principal, mas é o único do novo tipo, torna-o principal
        const hasPrincipalOfNewType = newList.some(
          (c, i) => i !== index && c.tipo === value && c.isPrincipal
        );
        if (!hasPrincipalOfNewType) {
          currentContato.isPrincipal = true;
        }
      }

      if (value === "EMAIL") {
        currentContato.isWhatsapp = false;
      }
    }

    onChange(newList);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Contatos</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addContato}
          className="h-8 gap-1"
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </div>

      {contatosList.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">
            Nenhum contato adicionado.
          </p>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={addContato}
            className="mt-1"
          >
            Adicionar o primeiro contato
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {contatosList.map((contato, index) => (
            <div
              key={index}
              className="flex flex-col p-4 border rounded-lg bg-card gap-4"
            >
              <div className="flex items-center gap-2">
                <div className="w-32">
                  <Select
                    value={contato.tipo}
                    onValueChange={(value: "EMAIL" | "TELEFONE") =>
                      updateContato(index, "tipo", value)
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMAIL">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          <span>E-mail</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="TELEFONE">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          <span>Telefone</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 space-y-1">
                  <Input
                    className={cn(
                      "h-9",
                      contato.valor &&
                        ((contato.tipo === "EMAIL" &&
                          !isValidEmail(contato.valor)) ||
                          (contato.tipo === "TELEFONE" &&
                            !isValidPhone(contato.valor))) &&
                        "border-destructive focus-visible:ring-destructive"
                    )}
                    value={contato.valor}
                    onChange={(e) =>
                      updateContato(index, "valor", e.target.value)
                    }
                    placeholder={
                      contato.tipo === "EMAIL"
                        ? "email@exemplo.com"
                        : "(00) 00000-0000"
                    }
                  />
                  {contato.valor &&
                    contato.tipo === "EMAIL" &&
                    !isValidEmail(contato.valor) && (
                      <p className="text-[10px] text-destructive">
                        E-mail inválido
                      </p>
                    )}
                  {contato.valor &&
                    contato.tipo === "TELEFONE" &&
                    !isValidPhone(contato.valor) && (
                      <p className="text-[10px] text-destructive">
                        Telefone inválido
                      </p>
                    )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => removeContato(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-6 px-1">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`principal-${index}`}
                    checked={contato.isPrincipal}
                    onCheckedChange={(checked) =>
                      updateContato(index, "isPrincipal", checked === true)
                    }
                  />
                  <label
                    htmlFor={`principal-${index}`}
                    className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Contato Principal
                  </label>
                </div>

                {contato.tipo === "TELEFONE" && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`whatsapp-${index}`}
                      checked={contato.isWhatsapp}
                      onCheckedChange={(checked) =>
                        updateContato(index, "isWhatsapp", checked === true)
                      }
                    />
                    <label
                      htmlFor={`whatsapp-${index}`}
                      className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      WhatsApp
                    </label>
                  </div>
                )}

                {contato.isPrincipal && (
                  <Badge
                    variant="secondary"
                    className="ml-auto text-[10px] h-5"
                  >
                    Principal
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
