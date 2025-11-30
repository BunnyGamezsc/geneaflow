import React from "react";
import { X } from "lucide-react";
import { useColors, DEFAULT_COLOR_SCHEME } from "../context/ColorContext";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const { colors, updateColors, resetToDefaults } = useColors();

  if (!isOpen) return null;

  const handleGenderChange = (
    gender: "male" | "female" | "neutral",
    key: "primary" | "light",
    value: string
  ) => {
    updateColors({
      [gender]: {
        ...colors[gender],
        [key]: value,
      },
    } as any);
  };

  const handleConnectionChange = (
    type: "parent" | "child" | "spouse",
    key: "border" | "background",
    value: string
  ) => {
    updateColors({
      connections: {
        ...colors.connections,
        [type]: {
          ...colors.connections[type],
          [key]: value,
        },
      },
    });
  };

  const handleReset = () => {
    resetToDefaults();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 p-4 relative">
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 w-7 h-7 bg-slate-600 hover:bg-slate-800 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white transition-transform hover:scale-110"
          aria-label="Close settings"
        >
          <X size={16} />
        </button>

        <h2 className="text-lg font-semibold text-slate-800 mb-1">Settings</h2>
        <p className="text-xs text-slate-400 mb-4">
          Customize colors for nodes and connection badges. Changes are saved locally in your browser.
        </p>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <section>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
              Node Gender Colors
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {(["male", "female", "neutral"] as const).map((g) => (
                <div
                  key={g}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-2 py-2"
                >
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-600 capitalize">
                      {g}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <label className="flex items-center gap-1 text-[11px] text-slate-500">
                        <span className="w-14">Dot</span>
                        <input
                          type="color"
                          value={colors[g].primary}
                          onChange={(e) =>
                            handleGenderChange(g, "primary", e.target.value)
                          }
                          className="w-8 h-4 border border-slate-200 rounded cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center gap-1 text-[11px] text-slate-500">
                        <span className="w-16 text-center">Header</span>
                        <input
                          type="color"
                          value={colors[g].light}
                          onChange={(e) =>
                            handleGenderChange(g, "light", e.target.value)
                          }
                          className="w-8 h-4 border border-slate-200 rounded cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
              Connection Badge Colors (Edit Panel)
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {(["parent", "child", "spouse"] as const).map((t) => (
                <div
                  key={t}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-2 py-2"
                >
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-600 capitalize">
                      {t}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <label className="flex items-center gap-1 text-[11px] text-slate-500">
                        <span className="w-14">Border</span>
                        <input
                          type="color"
                          value={colors.connections[t].border}
                          onChange={(e) =>
                            handleConnectionChange(t, "border", e.target.value)
                          }
                          className="w-8 h-4 border border-slate-200 rounded cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center gap-1 text-[11px] text-slate-500">
                        <span className="w-16">Background</span>
                        <input
                          type="color"
                          value={colors.connections[t].background}
                          onChange={(e) =>
                            handleConnectionChange(
                              t,
                              "background",
                              e.target.value
                            )
                          }
                          className="w-8 h-4 border border-slate-200 rounded cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Reset to defaults
          </button>
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
