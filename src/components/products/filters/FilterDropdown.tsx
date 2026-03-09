"use client";

import { useEffect, useRef } from "react";
import { ChevronDownIcon } from "@/components/icons";

interface FilterDropdownProps {
  label: string;
  badgeCount?: number;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
  align?: "left" | "right";
}

export function FilterDropdown({
  label,
  badgeCount,
  isOpen,
  onToggle,
  onClose,
  children,
  align = "left",
}: FilterDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const hasActive = badgeCount !== undefined && badgeCount > 0;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={onToggle}
        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
          hasActive
            ? "border-primary-500 bg-primary-50 text-primary-700"
            : isOpen
              ? "border-gray-400 text-gray-900 bg-gray-50"
              : "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
        }`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span>{label}</span>
        {hasActive && (
          <span className="flex items-center justify-center w-5 h-5 text-xs bg-primary-500 text-white rounded-full">
            {badgeCount}
          </span>
        )}
        <ChevronDownIcon
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-3 px-4 z-40 min-w-[220px] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
