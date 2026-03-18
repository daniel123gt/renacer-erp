"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "~/components/ui/command";
import { personasService, type Persona } from "~/services/personasService";
import { toast } from "sonner";

interface PersonaComboboxProps {
  value: string;
  onValueChange: (nombre: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function PersonaCombobox({
  value,
  onValueChange,
  placeholder = "Buscar persona...",
  disabled = false,
  className,
}: PersonaComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [personas, setPersonas] = React.useState<Persona[]>([]);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    if (open) {
      personasService.listActivos().then(setPersonas).catch(() => {});
    }
  }, [open]);

  const handleSelect = (nombre: string) => {
    onValueChange(nombre);
    setOpen(false);
    setSearch("");
  };

  const handleCrearNuevo = async () => {
    const nombre = search.trim();
    if (!nombre) return;
    try {
      const nueva = await personasService.crearRapido(nombre);
      setPersonas((prev) => [...prev, nueva].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      onValueChange(nueva.nombre);
      setOpen(false);
      setSearch("");
      toast.success(`"${nueva.nombre}" agregado a personas`);
    } catch {
      toast.error("Error al crear persona");
    }
  };

  const noMatch = search.trim() !== "" && !personas.some(
    (p) => p.nombre.toLowerCase() === search.trim().toLowerCase()
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal h-10 px-3 py-2 text-sm",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        side="bottom"
        sideOffset={4}
        avoidCollisions={false}
      >
        <Command shouldFilter={true}>
          <CommandInput
            placeholder={placeholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              <span className="text-gray-500 text-sm">No se encontró</span>
            </CommandEmpty>
            <CommandGroup>
              {personas.map((p) => (
                <CommandItem
                  key={p.id}
                  value={p.nombre}
                  onSelect={() => handleSelect(p.nombre)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === p.nombre ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {p.nombre}
                </CommandItem>
              ))}
            </CommandGroup>
            {noMatch && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={handleCrearNuevo}
                    className="text-primary-blue font-medium"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar "{search.trim()}"
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
