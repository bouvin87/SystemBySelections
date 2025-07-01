import React, { useEffect, useState, useRef } from "react";
import {
  Menu,
  ShoppingBag,
  Layers,
  Calendar,
  CheckSquare,
  Plus,
  Edit,
  Trash,
  Eye,
} from "lucide-react";

const mainItems = [
  { icon: Menu, bg: "#ffb457", submenu: [] },
  {
    icon: ShoppingBag,
    bg: "#ff96bd",
    submenu: [Plus, Edit, Trash],
  },
  {
    icon: Layers,
    bg: "#9999fb",
    submenu: [Eye, Edit, Trash],
  },
  { icon: Calendar, bg: "#ffe797", submenu: [] },
  {
    icon: CheckSquare,
    bg: "#cffff1",
    submenu: [Plus, Edit],
  },
];

export default function AnimatedMenu() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);
  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.backgroundColor =
      mainItems[activeIndex ?? 0].bg || "#fff";
  }, [activeIndex]);

  // Stäng undermeny vid klick utanför
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setOpenSubmenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="h-screen w-screen flex items-end justify-center pb-6 transition-colors duration-700 relative">
      <div
        ref={menuRef}
        className="relative flex items-center justify-center px-8 py-4 bg-[#1d1d27] rounded-full text-[1.5rem] w-[32em] max-w-full"
      >
        {mainItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeIndex === index;
          const hasSubmenu = item.submenu.length > 0;

          return (
            <div key={index} className="relative flex flex-col items-center">
              {/* Undermeny */}
              {openSubmenu === index && hasSubmenu && (
                <div className="absolute bottom-[4.5rem] flex gap-3 bg-white shadow-lg p-3 rounded-xl z-10">
                  {item.submenu.map((SubIcon, i) => (
                    <button
                      key={i}
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                    >
                      <SubIcon className="w-5 h-5 text-gray-800" />
                    </button>
                  ))}
                </div>
              )}

              {/* Huvudknapp */}
              <button
                onClick={() => {
                  setActiveIndex(index);
                  if (hasSubmenu) {
                    setOpenSubmenu((prev) =>
                      prev === index ? null : index
                    );
                  } else {
                    setOpenSubmenu(null);
                  }
                }}
                className={`relative w-16 h-16 flex items-center justify-center transition-transform duration-300 ${
                  isActive ? "-translate-y-3" : ""
                }`}
              >
                <div
                  className={`absolute w-16 h-16 rounded-full transition-transform duration-500 z-[-1]`}
                  style={{
                    backgroundColor: item.bg,
                    transform: isActive ? "scale(1)" : "scale(0)",
                  }}
                />
                <Icon className="w-7 h-7 text-white" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
