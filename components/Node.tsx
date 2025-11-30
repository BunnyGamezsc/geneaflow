import React from 'react';
import { Plus } from 'lucide-react';
import { FamilyNode, Gender, RelationshipMap } from '../types';
import { NODE_WIDTH, NODE_HEIGHT } from '../constants';
import { useColors } from "../context/ColorContext";

interface NodeProps {
  node: FamilyNode;
  isRoot: boolean;
  isSelected: boolean;
  isConnecting: boolean;
  relationships: RelationshipMap;
  showRelationships: boolean;
  onNodeMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onUpdateNode: (id: string, updates: Partial<FamilyNode>) => void;
  onPortMouseDown: (
    e: React.MouseEvent,
    nodeId: string,
    portType: "top" | "bottom" | "left" | "right"
  ) => void;
  onPortMouseUp: (
    e: React.MouseEvent,
    nodeId: string,
    portType: "top" | "bottom" | "left" | "right"
  ) => void;
  onPortTouchStart: (
    e: React.TouchEvent,
    nodeId: string,
    portType: "top" | "bottom" | "left" | "right"
  ) => void;
}

const Port: React.FC<{
  type: 'top' | 'bottom' | 'left' | 'right';
  style: React.CSSProperties;
  nodeId: string;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
}> = ({ type, style, nodeId, onMouseDown, onMouseUp, onTouchStart }) => (
  <div
    className="absolute w-6 h-6 bg-white border border-slate-300 text-slate-400 rounded-full flex items-center justify-center hover:bg-indigo-600 hover:text-white cursor-crosshair shadow-sm z-30 scale-75 hover:scale-100 transition-transform"
    style={style}
    onMouseDown={onMouseDown}
    onMouseUp={onMouseUp}
    onTouchStart={onTouchStart}
    data-port-type={type}
    data-node-id={nodeId}
    aria-label={`Add ${
      type === "top" ? "parent" : type === "bottom" ? "child" : "spouse"
    }`}
  >
    <Plus size={12} strokeWidth={3} />
  </div>
);

const Node: React.FC<NodeProps> = ({
  node,
  isRoot,
  isSelected,
  isConnecting,
  relationships,
  showRelationships,
  onNodeMouseDown,
  onUpdateNode,
  onPortMouseDown,
  onPortMouseUp,
  onNodeTouchStart,
  onPortTouchStart,
}) => {
  const toggleGender = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newGender: Gender =
      node.gender === "male"
        ? "female"
        : node.gender === "female"
        ? "neutral"
        : "male";
    onUpdateNode(id, { gender: newGender });
  };

  const { colors } = useColors();
  const genderTextMap: Record<Gender, string> = {
    male: "M",
    female: "F",
    neutral: "N",
  };
  const text = genderTextMap[node.gender];

  return (
    <div
      onMouseDown={(e) => onNodeMouseDown(e, node.id)}
      onTouchStart={(e) => onNodeTouchStart(e, node.id)}
      style={{
        left: node.x,
        top: node.y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      }}
      className={`absolute flex flex-col shadow-sm rounded-xl border-2 bg-white cursor-pointer group select-none transition-all duration-150
        ${
          isSelected
            ? "border-indigo-500 ring-2 ring-indigo-200 shadow-lg z-20"
            : "border-slate-200 hover:border-indigo-300 z-10"
        }
        ${isRoot ? "ring-4 ring-yellow-100 border-yellow-400" : ""}`}
    >
      <button
        onMouseDown={(e) => toggleGender(e, node.id)}
        className="absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 border-white shadow-sm z-40 flex items-center justify-center"
        style={{ backgroundColor: colors[node.gender].primary }}
        aria-label={`Change gender, current is ${node.gender}`}
      >
        <span className="text-white text-[10px] font-bold">{text}</span>
      </button>

      <div
        className={`opacity-0 group-hover:opacity-100 ${
          isSelected || isConnecting ? "opacity-100" : ""
        } transition-opacity duration-200`}
      >
        <Port
          type="top"
          nodeId={node.id}
          style={{ top: -12, left: "50%", transform: "translateX(-50%)" }}
          onMouseDown={(e) => onPortMouseDown(e, node.id, "top")}
          onMouseUp={(e) => onPortMouseUp(e, node.id, "top")}
          onTouchStart={(e) => onPortTouchStart(e, node.id, "top")}
        />
        <Port
          type="bottom"
          nodeId={node.id}
          style={{ bottom: -12, left: "50%", transform: "translateX(-50%)" }}
          onMouseDown={(e) => onPortMouseDown(e, node.id, "bottom")}
          onMouseUp={(e) => onPortMouseUp(e, node.id, "bottom")}
          onTouchStart={(e) => onPortTouchStart(e, node.id, "bottom")}
        />
        <Port
          type="left"
          nodeId={node.id}
          style={{ top: "50%", left: -12, transform: "translateY(-50%)" }}
          onMouseDown={(e) => onPortMouseDown(e, node.id, "left")}
          onMouseUp={(e) => onPortMouseUp(e, node.id, "left")}
          onTouchStart={(e) => onPortTouchStart(e, node.id, "left")}
        />
        <Port
          type="right"
          nodeId={node.id}
          style={{ top: "50%", right: -12, transform: "translateY(-50%)" }}
          onMouseDown={(e) => onPortMouseDown(e, node.id, "right")}
          onMouseUp={(e) => onPortMouseUp(e, node.id, "right")}
          onTouchStart={(e) => onPortTouchStart(e, node.id, "right")}
        />
      </div>

      <div
        className="h-1.5 w-full rounded-t-lg"
        style={{ backgroundColor: colors[node.gender].light }}
      ></div>

      <div className="flex-1 p-2 flex flex-col justify-center items-center text-center overflow-hidden">
        <input
          value={node.name}
          onChange={(e) => onUpdateNode(node.id, { name: e.target.value })}
          onClick={(e) => e.currentTarget.select()}
          className="font-bold text-slate-800 w-full text-center bg-transparent focus:bg-slate-50 focus:outline-none rounded px-1 truncate text-sm mb-1"
          placeholder="Name"
          aria-label={`Name of person: ${node.name}`}
        />
        {showRelationships && (
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium truncate max-w-full uppercase tracking-wide ${
              isRoot
                ? "bg-yellow-100 text-yellow-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {isRoot ? "Me" : relationships[node.id] || "Relative"}
          </span>
        )}
      </div>
    </div>
  );
};

export default React.memo(Node);
