"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import type * as React from "react";

import { Button } from "@/components/ui/button";

function ThemeToggle({ className, ...props }: React.ComponentProps<typeof Button>) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-label="Toggle between light and dark mode"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      {...props}
    >
      <Sun className="dark:hidden" />
      <Moon className="hidden dark:block" />
    </Button>
  );
}

export { ThemeToggle };
