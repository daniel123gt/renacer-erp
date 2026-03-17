import { useState } from "react";

interface PainScaleSelectorProps {
  value?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
}

const painLevels = [
  { value: 0, label: "Sin Dolor", color: "bg-green-500", face: "😊", range: "0-1" },
  { value: 2, label: "Poco Dolor", color: "bg-green-400", face: "🙂", range: "2-3" },
  { value: 4, label: "Dolor Moderado", color: "bg-yellow-400", face: "😐", range: "4-5" },
  { value: 6, label: "Dolor Fuerte", color: "bg-orange-400", face: "😟", range: "6-7" },
  { value: 8, label: "Dolor Muy Fuerte", color: "bg-orange-600", face: "😣", range: "8-9" },
  { value: 10, label: "Dolor Extremo", color: "bg-red-600", face: "😫", range: "10" },
];

export function PainScaleSelector({ value, onChange, disabled = false }: PainScaleSelectorProps) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);

  const getPainLevel = (val: number | undefined) => {
    if (val === undefined || val === null) return null;
    if (val <= 1) return painLevels[0];
    if (val <= 3) return painLevels[1];
    if (val <= 5) return painLevels[2];
    if (val <= 7) return painLevels[3];
    if (val <= 9) return painLevels[4];
    return painLevels[5];
  };

  const currentLevel = getPainLevel(value);
  const displayValue = hoveredValue !== null ? hoveredValue : value;

  const handleClick = (val: number) => {
    if (!disabled && onChange) {
      onChange(val);
    }
  };

  const handleMouseEnter = (val: number) => {
    if (!disabled) {
      setHoveredValue(val);
    }
  };

  const handleMouseLeave = () => {
    setHoveredValue(null);
  };

  return (
    <div className="space-y-4">
      {/* Barra numérica con gradiente de color */}
      <div className="relative">
        <div className="flex h-12 rounded-lg overflow-hidden border-2 border-gray-300">
          {Array.from({ length: 11 }, (_, i) => {
            const level = getPainLevel(i);
            const isSelected = value === i;
            const isHovered = hoveredValue === i;
            
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleClick(i)}
                onMouseEnter={() => handleMouseEnter(i)}
                onMouseLeave={handleMouseLeave}
                disabled={disabled}
                className={`
                  flex-1 flex items-center justify-center text-sm font-semibold
                  transition-all duration-200
                  ${level?.color || 'bg-gray-200'}
                  ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 scale-105' : ''}
                  ${isHovered && !disabled ? 'brightness-110 scale-105' : ''}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:brightness-110'}
                `}
              >
                <span className={`${isSelected || isHovered ? 'text-white' : 'text-gray-700'}`}>
                  {i}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Caras y descripciones */}
      <div className="grid grid-cols-6 gap-2">
        {painLevels.map((level) => {
          const isActive = currentLevel?.value === level.value || 
                          (displayValue !== undefined && displayValue !== null && 
                           ((level.value === 0 && displayValue <= 1) ||
                            (level.value === 2 && displayValue >= 2 && displayValue <= 3) ||
                            (level.value === 4 && displayValue >= 4 && displayValue <= 5) ||
                            (level.value === 6 && displayValue >= 6 && displayValue <= 7) ||
                            (level.value === 8 && displayValue >= 8 && displayValue <= 9) ||
                            (level.value === 10 && displayValue === 10)));
          
          return (
            <button
              key={level.value}
              type="button"
              onClick={() => handleClick(level.value)}
              onMouseEnter={() => handleMouseEnter(level.value)}
              onMouseLeave={handleMouseLeave}
              disabled={disabled}
              className={`
                flex flex-col items-center justify-center p-3 rounded-lg border-2
                transition-all duration-200
                ${isActive 
                  ? `${level.color} border-gray-700 scale-105` 
                  : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span className="text-3xl mb-1">{level.face}</span>
              <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-gray-700'}`}>
                {level.label}
              </span>
              <span className={`text-xs ${isActive ? 'text-white' : 'text-gray-500'}`}>
                {level.range}
              </span>
            </button>
          );
        })}
      </div>

      {/* Valor seleccionado */}
      {currentLevel && (
        <div className={`text-center p-3 rounded-lg ${currentLevel.color} text-white`}>
          <p className="font-semibold">
            Dolor: {value} - {currentLevel.label}
          </p>
        </div>
      )}
    </div>
  );
}

