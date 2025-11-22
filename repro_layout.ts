import { calculateLayout } from "./services/layoutService.ts";
import type { FamilyNode, FamilyEdge } from "./types.ts";

// --- Test Case ---

const nodes: FamilyNode[] = [
  { id: "root", name: "Grandpa", gender: "male", x: 500, y: 0 },
  { id: "father", name: "Father", gender: "male", x: 400, y: 100 },
  { id: "uncle", name: "Uncle", gender: "male", x: 500, y: 100 },
  { id: "mother", name: "Mother", gender: "female", x: 600, y: 100 },
  { id: "child", name: "Child", gender: "male", x: 500, y: 200 },
];

const edges: FamilyEdge[] = [
  { id: "e1", source: "root", target: "father", type: "lineage" },
  { id: "e2", source: "root", target: "uncle", type: "lineage" },
  { id: "e3", source: "father", target: "child", type: "lineage" },
  { id: "e4", source: "mother", target: "child", type: "lineage" },
  // NO spouse edge between father and mother
];

const positions = calculateLayout(nodes, edges, "root");

console.log("Positions:", positions);

// Check order
const level1 = ["father", "uncle", "mother"].sort(
  (a, b) => positions[a].x - positions[b].x
);
console.log("Level 1 Order:", level1);
