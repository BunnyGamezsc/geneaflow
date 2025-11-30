import React from "react";
import {
  Plus,
  LayoutGrid,
  User,
  ZoomIn,
  ZoomOut,
  Download,
  Upload,
  Link,
  Settings as SettingsIcon,
} from "lucide-react";

interface HeaderProps {
  onAddNode: () => void;
  onSnapLayout: () => void;
  showRelationships: boolean;
  onToggleRelationships: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onAddNode,
  onSnapLayout,
  showRelationships,
  onToggleRelationships,
  zoom,
  onZoomIn,
  onZoomOut,
  onExport,
  onImport,
  onOpenSettings,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm z-20 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-600 text-white p-2 rounded-lg shadow-sm">
          <Link size={20} />
        </div>
        <div>
          <h1 className="text-lg font-bold">GeneaFlow</h1>
          <p className="text-xs text-slate-400">v0.4 by BunnyGamez</p>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
        <button
          onClick={onAddNode}
          className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-indigo-50 text-slate-700 text-sm font-medium rounded-lg shadow-sm border border-slate-200"
        >
          <Plus size={16} /> Add
        </button>
        <button
          onClick={onSnapLayout}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-white hover:shadow-sm text-slate-600 text-sm font-medium rounded-lg"
        >
          <LayoutGrid size={16} /> Align
        </button>
        <button
          onClick={onToggleRelationships}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg ${
            showRelationships
              ? "bg-indigo-100 text-indigo-700"
              : "hover:bg-white hover:shadow-sm text-slate-600"
          }`}
        >
          <User size={16} /> Roles
        </button>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-slate-100 rounded-lg p-1 mr-2">
          <button
            onClick={onZoomOut}
            className="p-1.5 hover:bg-white rounded-md text-slate-500"
            aria-label="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
          <span
            className="text-xs font-mono w-8 text-center"
            aria-live="polite"
          >
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={onZoomIn}
            className="p-1.5 hover:bg-white rounded-md text-slate-500"
            aria-label="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
        </div>
        <button
          onClick={onOpenSettings}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 ml-1"
          aria-label="Open settings"
        >
          <SettingsIcon size={18} />
        </button>
        <button
          onClick={onExport}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
          aria-label="Export tree"
        >
          <Download size={18} />
        </button>
        <label
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
          aria-label="Import tree"
        >
          <Upload size={18} />
          <input
            type="file"
            accept=".json"
            onChange={onImport}
            className="hidden"
          />
        </label>
      </div>
    </header>
  );
};

export default Header;
