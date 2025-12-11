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
    <header className="bg-white border-b border-slate-200 px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between shadow-sm z-20 flex-shrink-0">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="bg-indigo-600 text-white p-1.5 sm:p-2 rounded-lg shadow-sm">
          <Link size={18} className="sm:w-5 sm:h-5" />
        </div>
        <div>
          <h1 className="text-base sm:text-lg font-bold">GeneaFlow</h1>
          <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">
            v0.4 by BunnyGamez
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
        <button
          onClick={onAddNode}
          className="flex items-center gap-2 px-2 sm:px-3 py-1.5 bg-white hover:bg-indigo-50 text-slate-700 text-sm font-medium rounded-lg shadow-sm border border-slate-200"
          title="Add Node"
        >
          <Plus size={16} /> <span className="hidden sm:inline">Add</span>
        </button>
        <button
          onClick={onSnapLayout}
          className="flex items-center gap-2 px-2 sm:px-3 py-1.5 hover:bg-white hover:shadow-sm text-slate-600 text-sm font-medium rounded-lg"
          title="Align Layout"
        >
          <LayoutGrid size={16} />{" "}
          <span className="hidden sm:inline">Align</span>
        </button>
        <button
          onClick={onToggleRelationships}
          className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 text-sm font-medium rounded-lg ${
            showRelationships
              ? "bg-indigo-100 text-indigo-700"
              : "hover:bg-white hover:shadow-sm text-slate-600"
          }`}
          title="Toggle Roles"
        >
          <User size={16} /> <span className="hidden sm:inline">Roles</span>
        </button>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <div className="flex items-center bg-slate-100 rounded-lg p-1 mr-1 sm:mr-2">
          <button
            onClick={onZoomOut}
            className="p-1 sm:p-1.5 hover:bg-white rounded-md text-slate-500"
            aria-label="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
          <span
            className="text-[10px] sm:text-xs font-mono w-6 sm:w-8 text-center"
            aria-live="polite"
          >
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={onZoomIn}
            className="p-1 sm:p-1.5 hover:bg-white rounded-md text-slate-500"
            aria-label="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
        </div>
        <button
          onClick={onOpenSettings}
          className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg text-slate-600 ml-0 sm:ml-1"
          aria-label="Open settings"
        >
          <SettingsIcon size={16} className="sm:w-[18px] sm:h-[18px]" />
        </button>
        <button
          onClick={onExport}
          className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg text-slate-600"
          aria-label="Export tree"
        >
          <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
        </button>
        <label
          className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
          aria-label="Import tree"
        >
          <Upload size={16} className="sm:w-[18px] sm:h-[18px]" />
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
