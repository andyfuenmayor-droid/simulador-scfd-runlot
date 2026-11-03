"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles, X } from "lucide-react";

export interface TourStep {
  id: string;
  targetId: string;
  title: string;
  icon?: string;
  badge?: string;
  content: string;
  legalCitation?: string;
  actionHint?: string;
}

interface GuidedTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourTitle: string;
  tourSubtitle?: string;
  steps: TourStep[];
  initialStepIndex?: number;
}

export const GuidedTourModal: React.FC<GuidedTourModalProps> = ({
  isOpen,
  onClose,
  tourTitle,
  tourSubtitle,
  steps,
  initialStepIndex = 0,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(initialStepIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(initialStepIndex);
    }
  }, [isOpen, initialStepIndex]);

  // Manejo de foco, scroll y resaltado del elemento objetivo
  useEffect(() => {
    if (!isOpen || steps.length === 0) {
      // Limpiar resaltados previos
      document.querySelectorAll(".tour-highlight-active").forEach((el) => {
        el.classList.remove(
          "tour-highlight-active",
          "ring-4",
          "ring-emerald-400",
          "ring-offset-4",
          "ring-offset-slate-950",
          "shadow-[0_0_35px_rgba(16,185,129,0.6)]"
        );
      });
      return;
    }

    const currentStep = steps[currentStepIndex];
    if (!currentStep) return;

    // Limpiar resaltados previos
    document.querySelectorAll(".tour-highlight-active").forEach((el) => {
      el.classList.remove(
        "tour-highlight-active",
        "ring-4",
        "ring-emerald-400",
        "ring-offset-4",
        "ring-offset-slate-950",
        "shadow-[0_0_35px_rgba(16,185,129,0.6)]"
      );
    });

    // Encontrar y resaltar el nuevo objetivo
    const targetEl = document.getElementById(currentStep.targetId);
    if (targetEl) {
      targetEl.classList.add(
        "tour-highlight-active",
        "ring-4",
        "ring-emerald-400",
        "ring-offset-4",
        "ring-offset-slate-950",
        "shadow-[0_0_35px_rgba(16,185,129,0.6)]",
        "transition-all",
        "duration-500"
      );

      // Scroll suave centrado
      targetEl.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }

    return () => {
      if (targetEl) {
        targetEl.classList.remove(
          "tour-highlight-active",
          "ring-4",
          "ring-emerald-400",
          "ring-offset-4",
          "ring-offset-slate-950",
          "shadow-[0_0_35px_rgba(16,185,129,0.6)]"
        );
      }
    };
  }, [isOpen, currentStepIndex, steps]);

  if (!isOpen || steps.length === 0) return null;

  const currentStep = steps[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (!isLast) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-end sm:justify-start items-center sm:items-end p-4 sm:p-6 sm:pt-24">
      {/* Sombra sutil de fondo para resaltar el elemento enfocado */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-[1px] pointer-events-auto transition-opacity"
        onClick={onClose}
      />

      {/* Tarjeta Flotante del Tour Demo (Diseño exacto al mockup del usuario) */}
      <div className="relative z-50 pointer-events-auto w-full max-w-lg bg-slate-950/95 border-2 border-emerald-500/80 rounded-2xl p-5 shadow-2xl shadow-emerald-950/70 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera del Paso */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl select-none" role="img" aria-label="Icon">
              {currentStep.icon || "💡"}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-extrabold text-white tracking-tight leading-snug">
                  {currentStep.title}
                </h4>
              </div>
              {currentStep.badge && (
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                  {currentStep.badge}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Texto Explicativo Principal */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
          {currentStep.content}
        </p>

        {/* Cita Legal o Tip de Acción */}
        {(currentStep.legalCitation || currentStep.actionHint) && (
          <div className="mb-4 space-y-1.5">
            {currentStep.legalCitation && (
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-700/50 px-2.5 py-1 rounded-lg">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span><strong>Sustento Legal:</strong> {currentStep.legalCitation}</span>
              </div>
            )}
            {currentStep.actionHint && (
              <div className="text-[11px] font-mono text-amber-300 bg-amber-950/30 border border-amber-600/40 px-2.5 py-1 rounded-lg">
                👉 <em>{currentStep.actionHint}</em>
              </div>
            )}
          </div>
        )}

        {/* Footer con Paginación y Botones (1 de X, Anterior, Siguiente) */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          {/* Indicador de paso: "1 de X" */}
          <div className="px-3 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold select-none">
            {currentStepIndex + 1} de {steps.length}
          </div>

          {/* Botones de Navegación */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Anterior
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg ${
                isLast
                  ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/80"
                  : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/80"
              }`}
            >
              {isLast ? (
                <>
                  Finalizar Tour
                  <Check className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  Siguiente
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

