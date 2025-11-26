import React, { useMemo } from "react";
import Node from "./Node";
import {
  FamilyNode,
  FamilyEdge,
  Point,
  ConnectionStart,
  RelationshipMap,
} from "../types";
import { NODE_WIDTH, NODE_HEIGHT } from "../constants";

interface WorkspaceProps {
  nodes: FamilyNode[];
  edges: FamilyEdge[];
  zoom: number;
  offset: Point;
  isConnecting: boolean;
  connStart: ConnectionStart;
  mousePos: Point;
  selectedNodeId: string | null;
  rootId: string | null;
  relationships: RelationshipMap;
  showRelationships: boolean;
  onCanvasMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
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
  onCanvasTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onNodeTouchStart: (e: React.TouchEvent, nodeId: string) => void;
}

const Workspace: React.FC<WorkspaceProps> = ({
  nodes,
  edges,
  zoom,
  offset,
  isConnecting,
  connStart,
  mousePos,
  selectedNodeId,
  rootId,
  relationships,
  showRelationships,
  onCanvasMouseDown,
  onMouseMove,
  onMouseUp,
  onNodeMouseDown,
  onUpdateNode,
  onPortMouseDown,
  onPortMouseUp,
  onCanvasTouchStart,
  onTouchMove,
  onNodeTouchStart,
}) => {
  // Group edges for rendering
  const { lineageGroups, otherEdges } = useMemo(() => {
    const lineage = edges.filter((e) => e.type === "lineage");
    const others = edges.filter((e) => e.type !== "lineage");

    // 1. Group children by their parent(s) to identify family units
    const childToParents = new Map<string, string[]>();
    lineage.forEach((e) => {
      if (!childToParents.has(e.target)) childToParents.set(e.target, []);
      childToParents.get(e.target)!.push(e.source);
    });

    // 2. Create render groups: Key="sortedParentIds" -> Value=[childIds]
    const groups = new Map<string, string[]>();
    childToParents.forEach((parents, childId) => {
      parents.sort();
      const key = parents.join(",");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(childId);
    });

    return { lineageGroups: groups, otherEdges: others };
  }, [edges]);

  const LINE_COLOR = "#1e293b"; // Slate 800

  return (
    <div
      id="canvas-bg"
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{
        backgroundImage: "radial-gradient(#e2e8f0 1px, transparent 1px)",
        backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
        backgroundPosition: `${offset.x}px ${offset.y}px`,
        touchAction: "none",
      }}
      onMouseDown={onCanvasMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onCanvasTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onMouseUp}
      onTouchCancel={onMouseUp}
    >
      <div
        className="absolute origin-top-left"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
        }}
      >
        <svg
          className="overflow-visible pointer-events-none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "1px",
            height: "1px",
          }}
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={LINE_COLOR} />
            </marker>
          </defs>

          {/* Render Standard Edges (Spouses, etc.) - Now solid lines connecting centers */}
          {otherEdges.map((edge) => {
            const s = nodes.find((n) => n.id === edge.source);
            const t = nodes.find((n) => n.id === edge.target);
            if (!s || !t) return null;
            const sx = s.x + NODE_WIDTH / 2,
              sy = s.y + NODE_HEIGHT / 2;
            const tx = t.x + NODE_WIDTH / 2,
              ty = t.y + NODE_HEIGHT / 2;
            return (
              <line
                key={edge.id}
                x1={sx}
                y1={sy}
                x2={tx}
                y2={ty}
                stroke={LINE_COLOR}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="5,5"
              />
            );
          })}

          {/* Render Orthogonal Lineage Groups */}
          {Array.from(lineageGroups.entries()).map(([key, childIds]) => {
            const parentIds = key.split(",");
            const parentNodes = parentIds
              .map((id) => nodes.find((n) => n.id === id))
              .filter(Boolean) as FamilyNode[];
            const childNodes = childIds
              .map((id) => nodes.find((n) => n.id === id))
              .filter(Boolean) as FamilyNode[];

            if (parentNodes.length === 0 || childNodes.length === 0)
              return null;

            // Calculate Parent Centers & Range
            const parentCentersX = parentNodes.map((n) => n.x + NODE_WIDTH / 2);
            const minParentX = Math.min(...parentCentersX);
            const maxParentX = Math.max(...parentCentersX);
            const avgPx = (minParentX + maxParentX) / 2;

            // Connect from below the parents
            // This creates a bridge effect between spouses, or drops correctly from a single parent
            const parentBottomY = Math.max(
              ...parentNodes.map((n) => n.y + NODE_HEIGHT)
            );
            const parentCenterY = parentBottomY + 15; // Drop 15px below parents

            // Start Y for calculation of drop distance (using bottom of nodes)
            const maxPy = Math.max(
              ...parentNodes.map((n) => n.y + NODE_HEIGHT)
            );

            // Calculate Bus Y-Position (Between Parents and Children)
            const minCy = Math.min(...childNodes.map((n) => n.y));

            // Ideally halfway between parent bottom and child top
            let busY = maxPy + (minCy - maxPy) / 2;

            // Smart Bus Positioning constraints to ensure clearance
            if (busY < maxPy + 25) busY = maxPy + 25;
            if (busY > minCy - 25) busY = minCy - 25;
            // Fallback if overlap
            if (minCy <= maxPy + 10) busY = maxPy + 40;

            // Calculate Bus Horizontal Range (cover all children + central stem)
            const childXs = childNodes.map((n) => n.x + NODE_WIDTH / 2);
            const minChildX = Math.min(...childXs);
            const maxChildX = Math.max(...childXs);

            // Bus must extend to at least the stem coming from parents
            const busMinX = Math.min(minChildX, avgPx);
            const busMaxX = Math.max(maxChildX, avgPx);

            return (
              <g key={key}>
                {/* 1. Vertical Drops from Each Parent to Parent-Bar */}
                {parentNodes.map((p) => (
                  <line
                    key={p.id}
                    x1={p.x + NODE_WIDTH / 2}
                    y1={p.y + NODE_HEIGHT}
                    x2={p.x + NODE_WIDTH / 2}
                    y2={parentCenterY}
                    stroke={LINE_COLOR}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                ))}

                {/* 2. Horizontal Connector Between Parents (if multiple) */}
                {parentNodes.length > 1 && (
                  <line
                    x1={minParentX}
                    y1={parentCenterY}
                    x2={maxParentX}
                    y2={parentCenterY}
                    stroke={LINE_COLOR}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                )}

                {/* 2. Vertical Stem from Parent Center (or Link Center) to Bus */}
                <line
                  x1={avgPx}
                  y1={parentCenterY}
                  x2={avgPx}
                  y2={busY}
                  stroke={LINE_COLOR}
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* 3. Horizontal Bus Line */}
                <line
                  x1={busMinX}
                  y1={busY}
                  x2={busMaxX}
                  y2={busY}
                  stroke={LINE_COLOR}
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* 4. Vertical Drops to Each Child */}
                {childNodes.map((child) => {
                  const cx = child.x + NODE_WIDTH / 2;
                  const cy = child.y;
                  return (
                    <path
                      key={child.id}
                      d={`M ${cx} ${busY} L ${cx} ${cy}`}
                      stroke={LINE_COLOR}
                      strokeWidth="2"
                      markerEnd="url(#arrow)"
                      fill="none"
                      strokeLinecap="round"
                    />
                  );
                })}
              </g>
            );
          })}

          {isConnecting && connStart && (
            <line
              x1={connStart.x}
              y1={connStart.y}
              x2={mousePos.x}
              y2={mousePos.y}
              stroke="#6366f1"
              strokeWidth="3"
              strokeDasharray="4"
              strokeLinecap="round"
            />
          )}
        </svg>

        {nodes.map((node) => (
          <Node
            key={node.id}
            node={node}
            isRoot={rootId === node.id}
            isSelected={selectedNodeId === node.id}
            isConnecting={isConnecting}
            relationships={relationships}
            showRelationships={showRelationships}
            onNodeMouseDown={onNodeMouseDown}
            onUpdateNode={onUpdateNode}
            onPortMouseDown={onPortMouseDown}
            onPortMouseUp={onPortMouseUp}
            onNodeTouchStart={onNodeTouchStart}
          />
        ))}
      </div>
    </div>
  );
};

export default Workspace;
