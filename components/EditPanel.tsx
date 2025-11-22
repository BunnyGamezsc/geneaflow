import React from 'react';
import { Trash2, RotateCcw, X, Unlink } from 'lucide-react';
import { FamilyNode, FamilyEdge } from '../types';

interface EditPanelProps {
  selectedNode: FamilyNode;
  nodes: FamilyNode[];
  edges: FamilyEdge[];
  rootId: string | null;
  onClose: () => void;
  onSetRoot: (id: string) => void;
  onDeleteNode: (id: string) => void;
  onDeleteEdge: (id: string) => void;
}

const EditPanel: React.FC<EditPanelProps> = ({
  selectedNode,
  nodes,
  edges,
  rootId,
  onClose,
  onSetRoot,
  onDeleteNode,
  onDeleteEdge,
}) => {
  const connections = edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id);
  const isRootNode = selectedNode.id === rootId;

  return (
    <aside className="absolute bottom-4 left-1/2 -translate-x-1/2 w-auto max-w-[90vw] bg-white rounded-xl shadow-2xl border border-slate-200 flex items-center p-4 gap-6 z-50 animate-in slide-in-from-bottom-10">
      <button 
        onClick={onClose} 
        className="absolute -top-2 -right-2 w-7 h-7 bg-slate-600 hover:bg-slate-800 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white transition-transform hover:scale-110"
        aria-label="Close edit panel"
      >
        <X size={16} />
      </button>

      {/* Node Info & Actions */}
      <div className="flex-shrink-0">
        <h3 className="font-semibold text-slate-700 truncate text-lg">
          {selectedNode.name}
        </h3>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onSetRoot(selectedNode.id)}
            disabled={isRootNode}
            className={`flex-1 w-auto text-nowrap px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${isRootNode ? 'bg-green-100 text-green-700 cursor-default' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <RotateCcw size={14} /> {isRootNode ? 'Is Root' : 'Set Root'}
          </button>
          <button
            onClick={() => !isRootNode && onDeleteNode(selectedNode.id)}
            disabled={isRootNode}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
              isRootNode
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}
            title={isRootNode ? "Cannot delete the root node" : "Delete person"}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <div className="w-px h-16 bg-slate-200" />

      {/* Connections List */}
      <div className="min-w-0">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Connections</h4>
        <div className="flex gap-3 overflow-x-auto pb-2 -mb-2">
          {connections.length === 0 ? (
            <div className="flex items-center justify-center h-full w-48">
              <p className="text-xs text-slate-400 italic">No connections yet.</p>
            </div>
          ) : (
            connections.map(edge => {
              const isSource = edge.source === selectedNode.id;
              const otherId = isSource ? edge.target : edge.source;
              const otherNode = nodes.find(n => n.id === otherId);
              if (!otherNode) return null;

              let role = '';
              if (edge.type === 'spouse') role = 'Spouse';
              else if (edge.type === 'lineage') role = isSource ? 'Child' : 'Parent';

              return (
                <div key={edge.id} className="relative flex items-center bg-slate-50 p-2 rounded-lg border border-slate-100 group w-40 flex-shrink-0">
                   <div className="flex items-center gap-2 overflow-hidden">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${edge.type === 'spouse' ? 'bg-pink-400' : 'bg-slate-400'}`}></div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium text-slate-700 truncate">{otherNode.name}</span>
                        <span className="text-[10px] text-slate-400 uppercase">{role}</span>
                      </div>
                    </div>
                  <button
                    onClick={() => onDeleteEdge(edge.id)}
                    className="absolute top-1 right-1 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-opacity opacity-0 group-hover:opacity-100"
                    title="Unlink"
                    aria-label={`Unlink from ${otherNode.name}`}
                  >
                    <Unlink size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
};

export default EditPanel;