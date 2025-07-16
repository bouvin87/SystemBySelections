import { useEffect, useRef } from "react";
import clsx from "clsx";

export type ContextMenuEntry =
  | {
      id: string;
      label: string;
      icon?: JSX.Element;
      onClick?: () => void;
      submenu?: ContextMenuEntry[];
    }
  | {
      id: string;
      type: "divider";
    };

interface Props {
  x: number;
  y: number;
  entries: ContextMenuEntry[];
  onClose: () => void;
}

// Type guard för att skilja menyobjekt från divider
function isMenuItem(entry: ContextMenuEntry): entry is Exclude<ContextMenuEntry, { type: "divider" }> {
  return !("type" in entry && entry.type === "divider");
}

export default function ContextMenu({ x, y, entries, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-background border border-border rounded-xl shadow-xl p-2"
      style={{ top: y, left: x }}
    >
      {entries.map((entry) => {
        if (!isMenuItem(entry)) {
          return <div key={entry.id} className="border-t my-1 opacity-50" />;
        }

        return (
          <div key={entry.id} className="group relative">
            <button
              className={clsx(
                "flex w-full text-left px-3 py-2 items-center justify-between rounded-md hover:bg-accent transition-colors"
              )}
              onClick={() => {
                entry.onClick?.();
                if (!entry.submenu) onClose();
              }}
            >
              <div className="flex items-center gap-2">
                {entry.icon && <span>{entry.icon}</span>}
                <span>{entry.label}</span>
              </div>
              {entry.submenu && (
                <span className="text-xs text-muted-foreground pl-2">▶</span>
              )}
            </button>

            {entry.submenu && (
              <div className="absolute left-full top-0 ml-1 hidden group-hover:block z-50 min-w-[180px] bg-white border border-border rounded-xl shadow-xl py-2 px-1">
                {entry.submenu.map((subEntry) =>
                  isMenuItem(subEntry) ? (
                    <button
                      key={subEntry.id}
                      className="flex w-full text-left px-3 py-2 items-center gap-2 rounded-md hover:bg-muted transition-colors"
                      onClick={() => {
                        subEntry.onClick?.();
                        onClose();
                      }}
                    >
                      {subEntry.icon && <span>{subEntry.icon}</span>}
                      <span>{subEntry.label}</span>
                    </button>
                  ) : (
                    <div
                      key={subEntry.id}
                      className="border-t my-1 opacity-50"
                    />
                  )
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
