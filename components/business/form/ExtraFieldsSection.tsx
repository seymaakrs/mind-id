"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { FormSection } from "@/components/shared";

type ExtraField = {
  key: string;
  value: string;
};

type Props = {
  extraFields: ExtraField[];
  disabled?: boolean;
  onAddField: () => void;
  onRemoveField: (index: number) => void;
  onUpdateField: (index: number, field: "key" | "value", value: string) => void;
};

export function ExtraFieldsSection({
  extraFields,
  disabled = false,
  onAddField,
  onRemoveField,
  onUpdateField,
}: Props) {
  const headerAction = (
    <Button type="button" variant="outline" size="sm" onClick={onAddField} disabled={disabled}>
      <Plus className="w-4 h-4 mr-2" /> Alan Ekle
    </Button>
  );

  return (
    <FormSection
      title="Ekstra Alanlar"
      description="Özel alanlar ekleyebilirsiniz"
      headerAction={headerAction}
    >
      {extraFields.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
          Henüz ekstra alan eklenmedi.
        </p>
      ) : (
        <div className="space-y-3">
          {extraFields.map((field, index) => (
            <div key={index} className="flex gap-3 items-start">
              <Input
                placeholder="Alan adı"
                value={field.key}
                onChange={(e) => onUpdateField(index, "key", e.target.value)}
                disabled={disabled}
                className="w-1/3"
              />
              <Input
                placeholder="Değer"
                value={field.value}
                onChange={(e) => onUpdateField(index, "value", e.target.value)}
                disabled={disabled}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemoveField(index)}
                disabled={disabled}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </FormSection>
  );
}
