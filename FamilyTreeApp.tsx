import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FamilyNode,
  FamilyEdge,
  RelationshipMap,
  Point,
  ConnectionStart,
} from "./types";
import {
  INITIAL_NODE,
  NODE_WIDTH,
  NODE_HEIGHT,
  LEVEL_HEIGHT,
  SIBLING_GAP,
} from "./constants";
import { calculateAdvancedRelationships } from "./services/relationshipService";
import { calculateLayout } from "./services/layoutService";
import Header from "./components/Header";
import Workspace from "./components/Workspace";
import EditPanel from "./components/EditPanel";

export default function FamilyTreeApp() {
  // --- Core Data State ---
  const [nodes, setNodes] = useState<FamilyNode[]>([INITIAL_NODE]);
  const [edges, setEdges] = useState<FamilyEdge[]>([]);
  const [rootId, setRootId] = useState<string | null>("1");
  const [relationshipMap, setRelationshipMap] = useState<RelationshipMap>({});

  // --- View State ---
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({
    x: window.innerWidth / 2 - NODE_WIDTH / 2,
    y: window.innerHeight / 2 - NODE_HEIGHT / 2,
  });
  const [showRelationships, setShowRelationships] = useState(true);

  // --- Interaction State ---
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connStart, setConnStart] = useState<ConnectionStart>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });

  // --- Persistence ---
  useEffect(() => {
    const savedData = localStorage.getItem("familyTreeData");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setNodes(parsed.nodes || [INITIAL_NODE]);
        setEdges(parsed.edges || []);
        setRootId(parsed.rootId || "1");
        setRelationshipMap(parsed.relationshipMap || {});
      } catch (e) {
        console.error("Failed to load data from localStorage", e);
      }
    }
  }, []);

  useEffect(() => {
    const data = JSON.stringify({ nodes, edges, rootId, relationshipMap });
    localStorage.setItem("familyTreeData", data);
  }, [nodes, edges, rootId, relationshipMap]);

  // --- Computed State ---
  const relationships = useMemo(
    () =>
      rootId
        ? calculateAdvancedRelationships(nodes, edges, rootId, relationshipMap)
        : {},
    [nodes, edges, rootId, relationshipMap]
  );
  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId]
  );

  // --- Helper: Screen to Canvas Coordinates ---
  const screenToCanvas = useCallback(
    (sx: number, sy: number): Point => {
      return {
        x: (sx - offset.x) / zoom,
        y: (sy - offset.y) / zoom,
      };
    },
    [offset, zoom]
  );

  // --- Node & Edge Actions ---
  const addNode = () => {
    const id = Date.now().toString();
    const center = screenToCanvas(
      window.innerWidth / 2,
      window.innerHeight / 2
    );
    setNodes([
      ...nodes,
      {
        id,
        name: "New Person",
        gender: "neutral",
        x: center.x - NODE_WIDTH / 2,
        y: center.y - NODE_HEIGHT / 2,
      },
    ]);
    setSelectedNodeId(id);
  };

  const deleteNode = (id: string) => {
    if (id === rootId) {
      console.warn(
        "Attempted to delete the root node. This action is blocked."
      );
      return;
    }
    setNodes(nodes.filter((n) => n.id !== id));
    setEdges(edges.filter((e) => e.source !== id && e.target !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const deleteEdge = (edgeId: string) => {
    setEdges(edges.filter((e) => e.id !== edgeId));
  };

  const updateNode = (id: string, updates: Partial<FamilyNode>) => {
    setNodes(nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)));
  };

  const autoCreateNode = (
    sourceId: string,
    portType: "top" | "bottom" | "left" | "right"
  ) => {
    const sourceNode = nodes.find((n) => n.id === sourceId);
    if (!sourceNode) return;

    const newNodeId = Date.now().toString();
    let newNodePos: Point = { x: sourceNode.x, y: sourceNode.y };
    let newEdge: FamilyEdge | null = null;

    if (portType === "top") {
      newNodePos.y -= LEVEL_HEIGHT;
      newEdge = {
        id: `e-${newNodeId}`,
        source: newNodeId,
        target: sourceId,
        type: "lineage",
      };
    } else if (portType === "bottom") {
      newNodePos.y += LEVEL_HEIGHT;
      newEdge = {
        id: `e-${newNodeId}`,
        source: sourceId,
        target: newNodeId,
        type: "lineage",
      };
    } else if (portType === "left") {
      newNodePos.x -= SIBLING_GAP;
      newEdge = {
        id: `e-${newNodeId}`,
        source: newNodeId,
        target: sourceId,
        type: "spouse",
      };
    } else if (portType === "right") {
      newNodePos.x += SIBLING_GAP;
      newEdge = {
        id: `e-${newNodeId}`,
        source: sourceId,
        target: newNodeId,
        type: "spouse",
      };
    }

    setNodes((prev) => [
      ...prev,
      { id: newNodeId, name: "New Person", gender: "neutral", ...newNodePos },
    ]);

    if (newEdge) {
      setEdges((prev) => {
        const edges = [...prev, newEdge!];

        // Auto-connect spouses if we just added a second parent (Top Port)
        if (portType === "top") {
          const childId = sourceId;
          const newParentId = newNodeId;

          // Find existing parents of this child
          const existingParentIds = prev
            .filter(
              (e) =>
                e.type === "lineage" &&
                e.target === childId &&
                e.source !== newParentId
            )
            .map((e) => e.source);

          existingParentIds.forEach((existingParentId) => {
            // Check if they are already spouses
            const areSpouses = prev.some(
              (e) =>
                e.type === "spouse" &&
                ((e.source === newParentId && e.target === existingParentId) ||
                  (e.source === existingParentId && e.target === newParentId))
            );

            if (!areSpouses) {
              edges.push({
                id:
                  Date.now().toString() +
                  "-" +
                  Math.random().toString(36).substr(2, 9),
                source: newParentId,
                target: existingParentId,
                type: "spouse",
              });
            }
          });
        }
        return edges;
      });
    }
    setSelectedNodeId(newNodeId);
  };

  // --- Layout & File Actions ---
  const handleSnapLayout = () => {
    if (!rootId) return;
    const newPositions = calculateLayout(nodes, edges, rootId);

    // 3. Update State
    setNodes((prev) =>
      prev.map((n) => {
        if (newPositions[n.id]) {
          return { ...n, ...newPositions[n.id] };
        }
        return n;
      })
    );

    // Center View on Root
    if (newPositions[rootId]) {
      setOffset({
        x:
          window.innerWidth / 2 -
          newPositions[rootId].x * zoom -
          (NODE_WIDTH / 2) * zoom,
        y:
          window.innerHeight / 2 -
          newPositions[rootId].y * zoom -
          (NODE_HEIGHT / 2) * zoom,
      });
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(
      { nodes, edges, rootId, relationshipMap },
      null,
      2
    );
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `family_tree_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed.nodes) {
          setNodes(parsed.nodes);
          setEdges(parsed.edges || []);
          setRootId(parsed.rootId || parsed.nodes[0]?.id || null);
          setRelationshipMap(parsed.relationshipMap || {});
        } else {
          console.error("Invalid file format");
        }
      } catch (err) {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset input
  };

  // --- Mouse & Interaction Handlers ---
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (
      e.target instanceof HTMLElement &&
      (e.target.id === "canvas-bg" || e.target.tagName === "svg")
    ) {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      setSelectedNodeId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isConnecting) setMousePos(screenToCanvas(e.clientX, e.clientY));
    if (isDraggingCanvas) {
      setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    } else if (draggedNode) {
      setNodes((ns) =>
        ns.map((n) =>
          n.id === draggedNode
            ? { ...n, x: n.x + e.movementX / zoom, y: n.y + e.movementY / zoom }
            : n
        )
      );
    }
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
    setDraggedNode(null);
    setIsConnecting(false);
    setConnStart(null);
  };

  const handlePortMouseDown = (
    e: React.MouseEvent,
    nodeId: string,
    portType: "top" | "bottom" | "left" | "right"
  ) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    let sx = node.x,
      sy = node.y;
    if (portType === "top") sx += NODE_WIDTH / 2;
    if (portType === "bottom") {
      sx += NODE_WIDTH / 2;
      sy += NODE_HEIGHT;
    }
    if (portType === "left") sy += NODE_HEIGHT / 2;
    if (portType === "right") {
      sx += NODE_WIDTH;
      sy += NODE_HEIGHT / 2;
    }

    const startPos = { nodeId, port: portType, x: sx, y: sy };
    setConnStart(startPos);
    setMousePos({ x: sx, y: sy });
    setIsConnecting(true);
  };

  const handlePortMouseUp = (
    e: React.MouseEvent,
    targetId: string,
    targetPort: "top" | "bottom" | "left" | "right"
  ) => {
    e.stopPropagation();
    if (!isConnecting || !connStart) return;

    if (connStart.nodeId === targetId && connStart.port === targetPort) {
      autoCreateNode(targetId, targetPort);
    } else if (connStart.nodeId !== targetId) {
      let type: "lineage" | "spouse" | null = null;
      let src = connStart.nodeId,
        tgt = targetId;
      const isSide = (p: string) => p === "left" || p === "right";

      if (isSide(connStart.port) && isSide(targetPort)) type = "spouse";
      else if (connStart.port === "bottom" && targetPort === "top")
        type = "lineage";
      else if (connStart.port === "top" && targetPort === "bottom") {
        type = "lineage";
        src = targetId;
        tgt = connStart.nodeId;
      }

      if (type) {
        setEdges((currentEdges) => {
          // Check if edge already exists
          const exists = currentEdges.some(
            (edge) =>
              edge.type === type &&
              ((edge.source === src && edge.target === tgt) ||
                (type === "spouse" &&
                  edge.source === tgt &&
                  edge.target === src))
          );

          if (exists) return currentEdges;

          const newEdges = [...currentEdges];
          newEdges.push({
            id: Date.now().toString(),
            source: src,
            target: tgt,
            type,
          });

          // Auto-connect spouses if this is a lineage connection (Parent -> Child)
          if (type === "lineage") {
            const childId = tgt;
            const newParentId = src;

            // Find existing parents of this child
            const existingParentIds = newEdges
              .filter(
                (e) =>
                  e.type === "lineage" &&
                  e.target === childId &&
                  e.source !== newParentId
              )
              .map((e) => e.source);

            existingParentIds.forEach((existingParentId) => {
              // Check if they are already spouses
              const areSpouses = newEdges.some(
                (e) =>
                  e.type === "spouse" &&
                  ((e.source === newParentId &&
                    e.target === existingParentId) ||
                    (e.source === existingParentId && e.target === newParentId))
              );

              if (!areSpouses) {
                newEdges.push({
                  id:
                    Date.now().toString() +
                    "-" +
                    Math.random().toString(36).substr(2, 9),
                  source: newParentId,
                  target: existingParentId,
                  type: "spouse",
                });
              }
            });
          }
          return newEdges;
        });
      }
    }

    setIsConnecting(false);
    setConnStart(null);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setDraggedNode(nodeId);
    setSelectedNodeId(nodeId);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 overflow-hidden text-slate-800 font-sans">
      <Header
        onAddNode={addNode}
        onSnapLayout={handleSnapLayout}
        showRelationships={showRelationships}
        onToggleRelationships={() => setShowRelationships(!showRelationships)}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(3, z + 0.2))}
        onZoomOut={() => setZoom((z) => Math.max(0.1, z - 0.2))}
        onExport={handleExport}
        onImport={handleImport}
      />

      <main className="flex-1 relative overflow-hidden">
        {isConnecting && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg z-40 text-sm font-medium animate-pulse pointer-events-none">
            Drag to a port or release to create a new person
          </div>
        )}
        <Workspace
          nodes={nodes}
          edges={edges}
          zoom={zoom}
          offset={offset}
          isConnecting={isConnecting}
          connStart={connStart}
          mousePos={mousePos}
          selectedNodeId={selectedNodeId}
          rootId={rootId}
          relationships={relationships}
          showRelationships={showRelationships}
          onCanvasMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onNodeMouseDown={handleNodeMouseDown}
          onUpdateNode={updateNode}
          onPortMouseDown={handlePortMouseDown}
          onPortMouseUp={handlePortMouseUp}
        />

        {selectedNode && (
          <EditPanel
            key={selectedNode.id} // Re-mount on selection change
            selectedNode={selectedNode}
            nodes={nodes}
            edges={edges}
            rootId={rootId}
            onClose={() => setSelectedNodeId(null)}
            onSetRoot={setRootId}
            onDeleteNode={deleteNode}
            onDeleteEdge={deleteEdge}
          />
        )}
      </main>
    </div>
  );
}
