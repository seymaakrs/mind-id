"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
  headerAction?: ReactNode;
  className?: string;
};

export function FormSection({
  title,
  description,
  children,
  headerAction,
  className = "",
}: Props) {
  return (
    <Card className={className}>
      <CardHeader>
        {headerAction ? (
          <div className="flex items-center justify-between">
            <CardTitle>{title}</CardTitle>
            {headerAction}
          </div>
        ) : (
          <CardTitle>{title}</CardTitle>
        )}
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
