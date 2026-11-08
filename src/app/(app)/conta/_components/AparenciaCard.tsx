"use client";

import { useEffect, useState } from "react";
import { SegmentedControl } from "@/components/ui";

type ThemeOption = "claro" | "escuro" | "sistema";

export function AparenciaCard() {
  const [theme, setTheme] = useState<ThemeOption>("sistema");

  const applyTheme = (selected: ThemeOption) => {
    if (selected === "escuro") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else if (selected === "claro") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("theme") as ThemeOption | null;
    const initial = saved === "claro" || saved === "escuro" || saved === "sistema" ? saved : "sistema";
    setTheme(initial);
    applyTheme(initial);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const current = localStorage.getItem("theme") as ThemeOption | null;
      if (current === "sistema" || !current) {
        applyTheme("sistema");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handleChange = (newTheme: ThemeOption) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  return (
    <section className="cc-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2 className="title">Aparência</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="cc-field__label">Tema</span>
        <SegmentedControl
          label="Tema da interface"
          options={[
            { value: "claro", label: "Claro" },
            { value: "escuro", label: "Escuro" },
            { value: "sistema", label: "Sistema" },
          ]}
          value={theme}
          onChange={(val) => handleChange(val as ThemeOption)}
        />
        <span className="caption cc-muted">
          Escolha entre tema claro, escuro ou siga a preferência do sistema.
        </span>
      </div>
    </section>
  );
}
