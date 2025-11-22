import type { FamilyEdge } from "./types.ts";

// Mock State
let edges: FamilyEdge[] = [
  { id: "e1", source: "father", target: "child", type: "lineage" },
];

// Mock Function to simulate handlePortMouseUp logic
function onConnect(src: string, tgt: string, type: "lineage" | "spouse") {
  const newEdges = [...edges];
  // Check if edge already exists
  const exists = newEdges.some(
    (edge) =>
      edge.type === type &&
      ((edge.source === src && edge.target === tgt) ||
        (type === "spouse" && edge.source === tgt && edge.target === src))
  );

  if (!exists) {
    newEdges.push({ id: "new-edge", source: src, target: tgt, type });

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

      console.log("Existing parents found:", existingParentIds);

      existingParentIds.forEach((existingParentId) => {
        // Check if they are already spouses
        const areSpouses = newEdges.some(
          (e) =>
            e.type === "spouse" &&
            ((e.source === newParentId && e.target === existingParentId) ||
              (e.source === existingParentId && e.target === newParentId))
        );

        if (!areSpouses) {
          console.log(
            `Auto-connecting spouse: ${newParentId} <-> ${existingParentId}`
          );
          newEdges.push({
            id: "auto-spouse-" + Math.random(),
            source: newParentId,
            target: existingParentId,
            type: "spouse",
          });
        } else {
          console.log(
            `Already spouses: ${newParentId} <-> ${existingParentId}`
          );
        }
      });
    }

    edges = newEdges;
  }
}

// Test Case: Connect 'mother' to 'child'
console.log("Initial Edges:", edges);
console.log("Connecting 'mother' to 'child'...");
onConnect("mother", "child", "lineage");
console.log("Final Edges:", edges);

// Verification
const hasSpouseEdge = edges.some(
  (e) =>
    e.type === "spouse" &&
    ((e.source === "mother" && e.target === "father") ||
      (e.source === "father" && e.target === "mother"))
);
console.log("Has Spouse Edge:", hasSpouseEdge);
