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
import Settings from "./components/Settings";

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
  const [lastTouch, setLastTouch] = useState<Point | null>(null);
  const [showSettings, setShowSettings] = useState(false);

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

  const finalizeConnection = (
    sourceId: string,
    sourcePort: "top" | "bottom" | "left" | "right",
    targetId: string,
    targetPort: "top" | "bottom" | "left" | "right"
  ) => {
    if (sourceId === targetId && sourcePort === targetPort) {
      autoCreateNode(targetId, targetPort);
      return;
    }

    if (sourceId === targetId) return;

    let type: "lineage" | "spouse" | null = null;
    let src = sourceId,
      tgt = targetId;
    const isSide = (p: string) => p === "left" || p === "right";

    if (isSide(sourcePort) && isSide(targetPort)) type = "spouse";
    else if (sourcePort === "bottom" && targetPort === "top") type = "lineage";
    else if (sourcePort === "top" && targetPort === "bottom") {
      type = "lineage";
      src = targetId;
      tgt = sourceId;
    }

    if (type) {
      setEdges((currentEdges) => {
        // Check if edge already exists
        const exists = currentEdges.some(
          (edge) =>
            edge.type === type &&
            ((edge.source === src && edge.target === tgt) ||
              (type === "spouse" && edge.source === tgt && edge.target === src))
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
                ((e.source === newParentId && e.target === existingParentId) ||
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
    setLastTouch(null);
  };

  // --- Native Wheel Listener for Non-Passive Prevention ---
  useEffect(() => {
    const container = document.getElementById("app-container");
    if (!container) return;

    const handleNativeWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();

        const zoomSensitivity = 0.01;
        const delta = -e.deltaY * zoomSensitivity;
        setZoom((z) => Math.min(3, Math.max(0.1, z + delta)));
      } else {
        // For panning, we might want to prevent default too if it triggers browser navigation
        // But usually standard scroll is fine.
        // However, if we want "canvas pan" instead of "scroll", we should prevent default.
        e.preventDefault();
        setOffset((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    };

    // Prevent native gesture zooming (Mac trackpad)
    const handleGestureStart = (e: Event) => {
      e.preventDefault();
      document.body.style.zoom = "100%"; // Reset any accidental browser zoom
    };

    const handleGestureChange = (e: any) => {
      e.preventDefault();
      // e.scale gives the relative scale change since gesture start
      // We can use this for smoother zooming if we want, but for now let's just prevent default
      // and rely on the wheel event which usually fires alongside it on Chrome/Edge.
      // If this is Safari, wheel might not fire with ctrlKey.
      // Let's try to use e.scale if available.
      if (typeof e.scale === "number") {
        const delta = e.scale - 1;
        // Scale is cumulative, but this event fires repeatedly.
        // Actually, relying on wheel is safer for cross-browser if wheel fires.
        // But if wheel doesn't fire (Safari?), we might need this.
        // For now, JUST preventDefault is the critical part to stop browser zoom.
      }
    };

    const handleGestureEnd = (e: Event) => {
      e.preventDefault();
    };

    container.addEventListener("wheel", handleNativeWheel, { passive: false });
    // Note: gesture events are non-standard but supported on WebKit (Safari/Chrome on Mac)
    container.addEventListener(
      "gesturestart",
      handleGestureStart as EventListener
    );
    container.addEventListener(
      "gesturechange",
      handleGestureChange as EventListener
    );
    container.addEventListener("gestureend", handleGestureEnd as EventListener);

    return () => {
      container.removeEventListener("wheel", handleNativeWheel);
      container.removeEventListener(
        "gesturestart",
        handleGestureStart as EventListener
      );
      container.removeEventListener(
        "gesturechange",
        handleGestureChange as EventListener
      );
      container.removeEventListener(
        "gestureend",
        handleGestureEnd as EventListener
      );
    };
  }, []);

  const [initialPinchDist, setInitialPinchDist] = useState<number | null>(null);
  const [initialZoom, setInitialZoom] = useState<number>(1);

  const getDistance = (t1: React.Touch, t2: React.Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleCanvasTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Start Pinch
      const dist = getDistance(e.touches[0], e.touches[1]);
      setInitialPinchDist(dist);
      setInitialZoom(zoom);
      return;
    }

    if (
      e.target instanceof HTMLElement &&
      (e.target.id === "canvas-bg" || e.target.tagName === "svg")
    ) {
      // e.preventDefault(); // Removed to allow some default behaviors if needed, but usually good to keep for canvas
      const touch = e.touches[0];
      setIsDraggingCanvas(true);
      setDragStart({
        x: touch.clientX - offset.x,
        y: touch.clientY - offset.y,
      });
      setLastTouch({ x: touch.clientX, y: touch.clientY });
      setSelectedNodeId(null);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDist) {
      // Pinch Zoom
      const dist = getDistance(e.touches[0], e.touches[1]);
      const scale = dist / initialPinchDist;
      setZoom(Math.min(3, Math.max(0.1, initialZoom * scale)));
      return;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (isConnecting) {
        setMousePos(screenToCanvas(touch.clientX, touch.clientY));
      }
      if (isDraggingCanvas) {
        setOffset({
          x: touch.clientX - dragStart.x,
          y: touch.clientY - dragStart.y,
        });
      } else if (draggedNode && lastTouch) {
        const dx = touch.clientX - lastTouch.x;
        const dy = touch.clientY - lastTouch.y;
        setNodes((ns) =>
          ns.map((n) =>
            n.id === draggedNode
              ? { ...n, x: n.x + dx / zoom, y: n.y + dy / zoom }
              : n
          )
        );
      }
      setLastTouch({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setInitialPinchDist(null);
    setIsDraggingCanvas(false);
    setDraggedNode(null);

    if (isConnecting && connStart) {
      // Handle Drop for Connection
      const touch = e.changedTouches[0];
      const targetElement = document.elementFromPoint(
        touch.clientX,
        touch.clientY
      );

      // Find closest port or node
      const portElement = targetElement?.closest("[data-port-type]");

      if (portElement instanceof HTMLElement) {
        const targetId = portElement.dataset.nodeId;
        const targetPort = portElement.dataset.portType as
          | "top"
          | "bottom"
          | "left"
          | "right";

        if (targetId && targetPort) {
          finalizeConnection(
            connStart.nodeId,
            connStart.port,
            targetId,
            targetPort
          );
        }
      } else {
        // If dropped on empty space, maybe auto-create?
        // Current mouse behavior: Dragging to empty space does nothing.
        // Clicking port auto-creates.
        // Let's stick to mouse behavior: Drag to connect, Click (Tap) to auto-create.
        // Since we are in 'isConnecting' state, it means we started a drag.
        // If we just tapped, handlePortTouchStart would have set isConnecting, and now we release.
        // If movement was minimal, treat as tap?
        // For now, let's just reset. The user can tap-and-release quickly to trigger click?
        // Actually, touchstart on port -> setConnecting. touchend -> if on same port, auto-create.

        // Check if we are still on the same element
        const startElement = document.elementFromPoint(
          touch.clientX,
          touch.clientY
        );
        const startPort = startElement?.closest("[data-port-type]");
        if (startPort && startPort instanceof HTMLElement) {
          const tId = startPort.dataset.nodeId;
          const tPort = startPort.dataset.portType as
            | "top"
            | "bottom"
            | "left"
            | "right";
          if (tId === connStart.nodeId && tPort === connStart.port) {
            autoCreateNode(tId, tPort);
          }
        }
      }
    }

    setIsConnecting(false);
    setConnStart(null);
    setLastTouch(null);
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

  const handlePortTouchStart = (
    e: React.TouchEvent,
    nodeId: string,
    portType: "top" | "bottom" | "left" | "right"
  ) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const touch = e.touches[0];

    // Calculate port position for visual line start
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
    setMousePos(screenToCanvas(touch.clientX, touch.clientY));
    setIsConnecting(true);
  };

  const handlePortMouseUp = (
    e: React.MouseEvent,
    targetId: string,
    targetPort: "top" | "bottom" | "left" | "right"
  ) => {
    e.stopPropagation();
    if (!isConnecting || !connStart) return;
    finalizeConnection(connStart.nodeId, connStart.port, targetId, targetPort);
    setIsConnecting(false);
    setConnStart(null);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setDraggedNode(nodeId);
    setSelectedNodeId(nodeId);
  };

  const handleNodeTouchStart = (e: React.TouchEvent, nodeId: string) => {
    e.stopPropagation();
    const touch = e.touches[0];
    setDraggedNode(nodeId);
    setSelectedNodeId(nodeId);
    setLastTouch({ x: touch.clientX, y: touch.clientY });
  };

  return (
    <div
      id="app-container"
      className="flex flex-col h-[100dvh] w-full bg-slate-50 overflow-hidden text-slate-800 font-sans"
    >
      <Header
        onAddNode={addNode}
        onSnapLayout={handleSnapLayout}
        showRelationships={showRelationships}
        onToggleRelationships={() => setShowRelationships(!showRelationships)}
        zoom={zoom}
        onZoomIn={() => {
          setZoom((z) => {
            const currentPercent = Math.round(z * 100);
            const nextPercent = Math.floor(currentPercent / 5) * 5 + 5;
            return Math.min(3, nextPercent / 100);
          });
        }}
        onZoomOut={() => {
          setZoom((z) => {
            const currentPercent = Math.round(z * 100);
            const nextPercent = Math.ceil(currentPercent / 5) * 5 - 5;
            return Math.max(0.1, nextPercent / 100);
          });
        }}
        onExport={handleExport}
        onImport={handleImport}
        onOpenSettings={() => setShowSettings(true)}
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
          onCanvasTouchStart={handleCanvasTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onNodeTouchStart={handleNodeTouchStart}
          onPortTouchStart={handlePortTouchStart}
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
        <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
      </main>
    </div>
  );
}
