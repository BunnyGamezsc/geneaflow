import { calculateAdvancedRelationships } from "./services/relationshipService";
import { FamilyNode, FamilyEdge } from "./types";

const nodes: FamilyNode[] = [
  { id: "me", name: "Me", gender: "male", x: 0, y: 0 },
  { id: "dad", name: "Dad", gender: "male", x: 0, y: 0 },
  { id: "grandpa", name: "Grandpa", gender: "male", x: 0, y: 0 },
  { id: "great_grandpa", name: "Great Grandpa", gender: "male", x: 0, y: 0 },
  { id: "great_uncle", name: "Great Uncle", gender: "male", x: 0, y: 0 },
  { id: "great_aunt", name: "Great Aunt", gender: "female", x: 0, y: 0 },
  { id: "son", name: "Son", gender: "male", x: 0, y: 0 },
  { id: "grandson", name: "Grandson", gender: "male", x: 0, y: 0 },
  { id: "great_grandson", name: "Great Grandson", gender: "male", x: 0, y: 0 },
];

const edges: FamilyEdge[] = [
  { id: "e1", source: "dad", target: "me", type: "lineage" },
  { id: "e2", source: "grandpa", target: "dad", type: "lineage" },
  { id: "e3", source: "great_grandpa", target: "grandpa", type: "lineage" },
  { id: "e4", source: "great_grandpa", target: "great_uncle", type: "lineage" },
  { id: "e5", source: "great_grandpa", target: "great_aunt", type: "lineage" },
  { id: "e6", source: "me", target: "son", type: "lineage" },
  { id: "e7", source: "son", target: "grandson", type: "lineage" },
  { id: "e8", source: "grandson", target: "great_grandson", type: "lineage" },
];

const relationships = calculateAdvancedRelationships(nodes, edges, "me");

console.log("Great Uncle Relationship:", relationships["great_uncle"]);
console.log("Great Aunt Relationship:", relationships["great_aunt"]);
console.log("Great Grandpa Relationship:", relationships["great_grandpa"]);
console.log("Great Grandson Relationship:", relationships["great_grandson"]);
