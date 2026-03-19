"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
} from "~/components/ui/command";

export interface ComboboxOption {
  value: string;
  label: string;
  /** URL de imagen para mostrar miniatura (ej. productos) */
  imageUrl?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Opción especial para "ninguno" o "seleccionar" (ej. value: "__none__", label: "Ninguno") */
  emptyOption?: ComboboxOption;
  id?: string;
  className?: string;
  /** Texto cuando no hay resultados al filtrar */
  emptySearchText?: string;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Buscar...",
  disabled = false,
  emptyOption,
  id,
  className,
  emptySearchText = "Sin resultados.",
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const allOptions = React.useMemo(() => {
    if (emptyOption) return [emptyOption, ...options];
    return options;
  }, [emptyOption, options]);

  const selectedOption = React.useMemo(() => {
    if (!value) return null;
    return allOptions.find((o) => o.value === value) ?? null;
  }, [value, allOptions]);

  const handleSelect = (val: string) => {
    onValueChange(val);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal h-10 px-3 py-2 text-sm",
            !selectedOption && "text-muted-foreground",
            className
          )}
        >
          <span className="flex items-center gap-2 truncate min-w-0">
            {selectedOption?.imageUrl && (
              <img
                src={selectedOption.imageUrl}
                alt=""
                className="w-6 h-6 object-cover rounded shrink-0"
              />
            )}
            <span className="truncate">{selectedOption?.label ?? placeholder}</span>
          </span>
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
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>{emptySearchText}</CommandEmpty>
            <CommandGroup>
              {allOptions.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  onSelect={() => handleSelect(opt.value)}
                  className="flex items-center gap-2"
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      value === opt.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {opt.imageUrl ? (
                    <img
                      src={opt.imageUrl}
                      alt=""
                      className="w-8 h-8 object-cover rounded shrink-0"
                    />
                  ) : null}
                  <span className="truncate">{opt.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
