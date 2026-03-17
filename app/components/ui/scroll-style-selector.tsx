import { useState } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Settings, Eye, EyeOff, Palette, Sparkles, Minus } from "lucide-react";

type ScrollStyle = "hidden" | "ondemand" | "scrollonly" | "visible" | "gradient" | "minimal" | "animated";

interface ScrollStyleOption {
  id: ScrollStyle;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  className: string;
}

const scrollStyles: ScrollStyleOption[] = [
  {
    id: "hidden",
    name: "Oculto",
    description: "Scroll completamente invisible",
    icon: EyeOff,
    className: "custom-scrollbar"
  },
  {
    id: "ondemand",
    name: "On-Demand",
    description: "Scroll que aparece solo al hacer hover",
    icon: Eye,
    className: "custom-scrollbar-ondemand"
  },
  {
    id: "scrollonly",
    name: "Solo Scroll",
    description: "Scroll que aparece solo al hacer scroll",
    icon: Minus,
    className: "custom-scrollbar-scrollonly"
  },
  {
    id: "visible",
    name: "Visible",
    description: "Scroll simple y elegante",
    icon: Eye,
    className: "custom-scrollbar-visible"
  },
  {
    id: "gradient",
    name: "Gradiente",
    description: "Scroll con gradientes y efectos",
    icon: Palette,
    className: "custom-scrollbar-gradient"
  },
  {
    id: "minimal",
    name: "Minimalista",
    description: "Scroll sutil y discreto",
    icon: Minus,
    className: "custom-scrollbar-minimal"
  },
  {
    id: "animated",
    name: "Animado",
    description: "Scroll con animaciones",
    icon: Sparkles,
    className: "custom-scrollbar-animated"
  }
];

export function ScrollStyleSelector() {
  const [selectedStyle, setSelectedStyle] = useState<ScrollStyle>("ondemand");
  const [isOpen, setIsOpen] = useState(false);

  const handleStyleChange = (style: ScrollStyle) => {
    setSelectedStyle(style);
    
    // Aplicar la clase al sidebar
    const sidebarMenu = document.querySelector('.custom-scrollbar-ondemand, .custom-scrollbar, .custom-scrollbar-visible, .custom-scrollbar-gradient, .custom-scrollbar-minimal, .custom-scrollbar-animated, .custom-scrollbar-scrollonly');
    if (sidebarMenu) {
      // Remover todas las clases de scroll
      scrollStyles.forEach(s => {
        sidebarMenu.classList.remove(s.className);
      });
      
      // Agregar la nueva clase
      const newStyle = scrollStyles.find(s => s.id === style);
      if (newStyle) {
        sidebarMenu.classList.add(newStyle.className);
      }
    }
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="sm"
        className="text-white hover:bg-white/10"
      >
        <Settings className="w-4 h-4 mr-2" />
        Scroll
      </Button>

      {isOpen && (
        <Card className="absolute top-full left-0 mt-2 w-80 z-50 bg-white shadow-lg border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-900">
              Personalizar Scroll del Sidebar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {scrollStyles.map((style) => (
              <div
                key={style.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedStyle === style.id
                    ? "border-accent-blue bg-accent-blue/10"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => handleStyleChange(style.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded ${
                    selectedStyle === style.id
                      ? "bg-accent-blue text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    <style.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{style.name}</h4>
                    <p className="text-xs text-gray-500">{style.description}</p>
                  </div>
                  {selectedStyle === style.id && (
                    <div className="w-2 h-2 rounded-full bg-accent-blue"></div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
