"use client";

import { PopoverTrigger } from "@radix-ui/react-popover";
import { Popover, PopoverContent } from "./popover-dialog";
import { ChevronsUpDown } from "lucide-react";
import _ from "lodash";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { Dispatch, SetStateAction } from "react";
import { Button } from "./button";

interface IMultiselect<T = any> {
  data: T[];
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  modal: boolean;
  optionKey: keyof T;
  optionValue: keyof T;
  onSelect: (value: T) => void;
  onRemove: (data: T) => void;
  optionLabel: keyof T;
  optionSubLabel?: keyof T;
  selectedOptions: T[];
  buttonPlaceholder: string;
  filterPlaceholder: string;
}

export function Multiselect<T>({
  data,
  open,
  onOpenChange,
  modal,
  optionKey,
  optionValue,
  onSelect,
  onRemove,
  optionLabel,
  optionSubLabel,
  selectedOptions,
  buttonPlaceholder,
  filterPlaceholder,
}: IMultiselect<T>) {
  return (
    <div className="min-w-[300px]">
      <Popover open={open} onOpenChange={onOpenChange} modal={modal}>
        <PopoverTrigger asChild>
          <div>
            <Button
              role="combobox"
              aria-expanded={open}
              variant={"outline"}
              className="w-full justify-between rounded-none rounded-t-xl"
            >
              <span className="text-base font-semibold">
                {buttonPlaceholder}
              </span>
              <ChevronsUpDown className="opacity-50" />
            </Button>

            <div className="flex flex-wrap gap-2 border rounded-b-xl p-2 min-w-[300px]">
              {selectedOptions.length === 0 ? (
                <p className="text-sm italic text-gray-500">
                  Nenhuma opção selecionada
                </p>
              ) : (
                selectedOptions.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-full border border-blue-600 px-3 py-1"
                  >
                    <span>{_.get(item, optionLabel as string)}</span>
                    <Button
                      variant="ghost"
                      className="rounded-full w-6 h-6 p-0"
                      onClick={() => onRemove(item)}
                    >
                      <IoIosCloseCircleOutline
                        color="black"
                        className="w-6 h-6"
                      />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </PopoverTrigger>

        <PopoverContent
          className="w-[300px] max-w-xl p-0 bg-white shadow-lg border z-50"
          side="bottom"
          align="start"
        >
          <Command>
            <CommandInput placeholder={filterPlaceholder} className="h-9" />

            <CommandList>
              <CommandEmpty>Resultados não encontrados.</CommandEmpty>
              <CommandGroup>
                {data.map((element) => (
                  <CommandItem
                    key={element[optionKey] as React.Key}
                    value={element[optionValue] as string}
                    onSelect={() => onSelect(element)}
                    className="hover:bg-gray-100 focus:bg-gray-100"
                  >
                    <div className="flex flex-col p-2 w-full gap-y-1">
                      <p className="text-md font-semibold">
                        {_.get(element, optionLabel as string)}
                      </p>
                      {optionSubLabel && (
                        <p className="text-sm font-light">
                          {_.get(element, optionSubLabel as string)}
                        </p>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
