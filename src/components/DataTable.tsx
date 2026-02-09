import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  cell: (item: T) => React.ReactNode;
  className?: string;
}

export interface Action<T> {
  label: string | ((item: T) => string);
  onClick: (item: T) => void;
  variant?: "default" | "destructive";
  icon?: React.ElementType;
  hide?: (item: T) => boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  searchPlaceholder?: string;
  searchKey?: keyof T | (keyof T)[];
  emptyMessage?: string;
  className?: string;
  itemsPerPage?: number;
  getRowClassName?: (item: T) => string;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  actions,
  searchPlaceholder = "Buscar...",
  searchKey,
  emptyMessage = "Nenhum registro encontrado",
  className,
  itemsPerPage = 10,
  getRowClassName,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(itemsPerPage);

  // Reset page size if prop changes
  useEffect(() => {
    setPageSize(itemsPerPage);
  }, [itemsPerPage]);

  const filteredData = searchKey
    ? data.filter((item) => {
        const searchTerms = Array.isArray(searchKey) ? searchKey : [searchKey];
        return searchTerms.some((key) =>
          String(item[key] || "")
            .toLowerCase()
            .includes(search.toLowerCase())
        );
      })
    : data;

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className={cn("flex flex-col flex-1 min-h-0 space-y-4", className)}>
      {searchKey && (
        <div className="relative max-w-sm shrink-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="dt_search_input"
            id="dt_search_input"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
            autoComplete="off"
          />
        </div>
      )}

      <div className="flex-1 rounded-lg border border-border overflow-hidden relative flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full caption-bottom text-sm bg-card">
            <TableHeader className="sticky top-0 z-10 bg-card shadow-sm">
              <TableRow className="bg-muted/50 hover:bg-muted/50 border-b transition-colors">
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn("font-semibold", column.className)}
                  >
                    {column.header}
                  </TableHead>
                ))}
                {actions && actions.length > 0 && (
                  <TableHead className="w-12"></TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (actions ? 1 : 0)}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item) => (
                  <TableRow
                    key={item.id}
                    className={cn("hover:bg-muted/30", getRowClassName?.(item))}
                  >
                    {columns.map((column) => (
                      <TableCell key={column.key} className={column.className}>
                        {column.cell(item)}
                      </TableCell>
                    ))}
                    {actions && actions.length > 0 && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {actions
                              .filter(
                                (action) => !action.hide || !action.hide(item)
                              )
                              .map((action, index) => (
                                <DropdownMenuItem
                                  key={index}
                                  onClick={() => action.onClick(item)}
                                  className={
                                    action.variant === "destructive"
                                      ? "text-destructive"
                                      : ""
                                  }
                                >
                                  {action.icon && (
                                    <action.icon className="mr-2 h-4 w-4" />
                                  )}
                                  {typeof action.label === "function"
                                    ? action.label(item)
                                    : action.label}
                                </DropdownMenuItem>
                              ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </table>
        </div>
      </div>

      {/* Paginação Fixa com Efeito Glassmorphism */}
      <div className="shrink-0 z-10 -mx-1 px-1 pb-1">
        <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-background/60 backdrop-blur-md shadow-lg ring-1 ring-black/5">
          <div className="flex items-center gap-6">
            <p className="text-xs font-medium text-muted-foreground">
              Mostrando{" "}
              <span className="text-foreground">
                {(currentPage - 1) * pageSize + 1}
              </span>{" "}
              a{" "}
              <span className="text-foreground">
                {Math.min(currentPage * pageSize, filteredData.length)}
              </span>{" "}
              de <span className="text-foreground">{filteredData.length}</span>{" "}
              registros
            </p>

            <div className="h-4 w-[1px] bg-border/50" />

            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                Itens por página:
              </p>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-7 w-[65px] text-xs bg-transparent border-muted-foreground/20">
                  <SelectValue placeholder={pageSize.toString()} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 50, 100].map((size) => (
                    <SelectItem
                      key={size}
                      value={size.toString()}
                      className="text-xs"
                    >
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 mr-2">
              <span className="text-xs font-medium text-muted-foreground">
                Página
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                {currentPage}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                de {totalPages}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg bg-transparent border-muted-foreground/20 hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg bg-transparent border-muted-foreground/20 hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
