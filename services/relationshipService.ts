import type {
  FamilyNode,
  FamilyEdge,
  Adjacency,
  RelationshipMap,
  Gender,
} from "../types.ts";

// --- 1. Graph Traversal & Adjacency ---
export function buildAdjacency(
  nodes: FamilyNode[],
  edges: FamilyEdge[]
): Adjacency {
  const parentsByChild = new Map<string, string[]>();
  const childrenByParent = new Map<string, string[]>();
  const spousesById = new Map<string, string[]>();

  edges.forEach((edge) => {
    if (edge.type === "lineage") {
      // source = parent, target = child
      if (!parentsByChild.has(edge.target)) parentsByChild.set(edge.target, []);
      parentsByChild.get(edge.target)!.push(edge.source);

      if (!childrenByParent.has(edge.source))
        childrenByParent.set(edge.source, []);
      childrenByParent.get(edge.source)!.push(edge.target);
    } else if (edge.type === "spouse") {
      if (!spousesById.has(edge.source)) spousesById.set(edge.source, []);
      if (!spousesById.has(edge.target)) spousesById.set(edge.target, []);
      spousesById.get(edge.source)!.push(edge.target);
      spousesById.get(edge.target)!.push(edge.source);
    }
  });

  return { parentsByChild, childrenByParent, spousesById };
}

// --- 2. Path Normalization ---
function normalizePathViaSiblings(
  pathSteps: string[],
  pathNodes: string[]
): string[] {
  if (pathSteps.length <= 1) return pathSteps;

  const normalized = [];
  let i = 0;

  while (i < pathSteps.length) {
    if (
      i + 1 < pathSteps.length &&
      pathSteps[i] === "U" &&
      pathSteps[i + 1] === "D"
    ) {
      if (pathNodes[i] !== pathNodes[i + 2]) {
        normalized.push("S");
        i += 2;
        continue;
      }
    }
    normalized.push(pathSteps[i]);
    i++;
  }
  return normalized;
}

// --- 3. Label Generation Logic ---
function greats(n: number): string {
  return "Great-".repeat(n);
}

function cousinLabel(degree: number, removed: number): string {
  const ordMap: { [key: number]: string } = {
    1: "1st Cousin",
    2: "2nd Cousin",
    3: "3rd Cousin",
  };
  const base = ordMap[degree] || `${degree}th Cousin`;
  if (removed === 0) return base;
  return `${base} ${removed}x Removed`;
}

function getGenderedTerm(base: string, gender: Gender): string {
  const isMale = gender === "male";
  const isFemale = gender === "female";

  const map: { [key: string]: string } = {
    Parent: isMale ? "Father" : isFemale ? "Mother" : "Parent",
    Grandparent: isMale
      ? "Grandfather"
      : isFemale
      ? "Grandmother"
      : "Grandparent",
    Sibling: isMale ? "Brother" : isFemale ? "Sister" : "Sibling",
    Child: isMale ? "Son" : isFemale ? "Daughter" : "Child",
    Grandchild: isMale ? "Grandson" : isFemale ? "Granddaughter" : "Grandchild",
    "Niece/Nephew": isMale ? "Nephew" : isFemale ? "Niece" : "Nibling",
    "Grand-niece/nephew": isMale
      ? "Grandnephew"
      : isFemale
      ? "Grandniece"
      : "Grandnibling",
    "Aunt/Uncle": isMale ? "Uncle" : isFemale ? "Aunt" : "Pibling",
    "Great-aunt/uncle": isMale
      ? "Great-Uncle"
      : isFemale
      ? "Great-Aunt"
      : "Great-Pibling",
    Spouse: isMale ? "Husband" : isFemale ? "Wife" : "Spouse",
    "Parent-in-law": isMale
      ? "Father-in-law"
      : isFemale
      ? "Mother-in-law"
      : "Parent-in-law",
    "Sibling-in-law": isMale
      ? "Brother-in-law"
      : isFemale
      ? "Sister-in-law"
      : "Sibling-in-law",
    "Child-in-law": isMale
      ? "Son-in-law"
      : isFemale
      ? "Daughter-in-law"
      : "Child-in-law",
  };

  if (base.startsWith("Great-")) {
    if (base.includes("Grandparent"))
      return base.replace("Grandparent", map["Grandparent"]);
    if (base.includes("Aunt/Uncle"))
      return base.replace("Aunt/Uncle", map["Aunt/Uncle"]);
    if (base.includes("Grandchild"))
      return base.replace("Grandchild", map["Grandchild"]);
    if (base.includes("Grand-niece/nephew"))
      return base.replace("Grand-niece/nephew", map["Grand-niece/nephew"]);
  }

  return map[base] || base;
}

function labelForPath(
  steps: string[],
  nodesInPath: string[],
  gender: Gender,
  customMap: RelationshipMap
): string {
  if (steps.length === 0) return customMap["me"] || "Me";
  const norm = normalizePathViaSiblings(steps, nodesInPath);
  const g = (term: string) => getGenderedTerm(term, gender);

  if (norm.length === 1 && norm[0] === "H") return g("Spouse");

  if (norm[0] === "H") {
    const rest = norm.slice(1);
    if (rest.every((s) => s === "U")) {
      const n = rest.length;
      if (n === 1) return g("Parent-in-law");
      if (n === 2) return g("Grandparent-in-law");
      return g(`${greats(n - 2)}Grandparent-in-law`);
    }
    if (rest[0] === "S") {
      if (rest.length === 1) return g("Sibling-in-law");
      if (rest.slice(1).every((s) => s === "D")) {
        const downs = rest.length - 1;
        if (downs === 1) return g("Niece/Nephew-in-law");
        return g(`${greats(downs - 1)}Grand-niece/nephew-in-law`);
      }
    }
  }

  if (norm.every((s) => s === "U")) {
    const n = norm.length;
    if (n === 1) return g("Parent");
    if (n === 2) return g("Grandparent");
    return g(`${greats(n - 2)}Grandparent`);
  }

  if (norm.every((s) => s === "D")) {
    const n = norm.length;
    if (n === 1) return g("Child");
    if (n === 2) return g("Grandchild");
    return g(`${greats(n - 2)}Grandchild`);
  }

  if (norm[0] === "S" && norm.slice(1).every((s) => s === "D")) {
    const downs = norm.length - 1;
    if (downs === 0) return g("Sibling");
    if (downs === 1) return g("Niece/Nephew");
    return g(`${greats(downs - 1)}Grand-niece/nephew`);
  }

  const firstS = norm.indexOf("S");
  if (
    firstS > 0 &&
    norm.slice(0, firstS).every((s) => s === "U") &&
    norm.slice(firstS + 1).every((s) => s === "D")
  ) {
    const ups = firstS;
    const downs = norm.length - firstS - 1;
    if (downs === 0) {
      if (ups === 1) return g("Aunt/Uncle");
      return g(`${greats(ups - 1)}Aunt/Uncle`);
    }
    const degree = Math.min(ups, downs);
    const removed = Math.abs(ups - downs);
    return cousinLabel(degree, removed);
  }

  if (norm.length === 2 && norm[0] === "D" && norm[1] === "H")
    return g("Child-in-law");

  return "Relative";
}

// --- 4. Main Calculator Function ---
export const calculateAdvancedRelationships = (
  nodes: FamilyNode[],
  edges: FamilyEdge[],
  rootId: string,
  customMap: RelationshipMap = {}
): RelationshipMap => {
  const { parentsByChild, childrenByParent, spousesById } = buildAdjacency(
    nodes,
    edges
  );

  const relationships: RelationshipMap = { [rootId]: customMap["me"] || "Me" };
  const visited = new Set([rootId]);
  const queue: { id: string; steps: string[]; nodes: string[] }[] = [
    { id: rootId, steps: [], nodes: [rootId] },
  ];

  const getNode = (id: string) => nodes.find((n) => n.id === id);

  while (queue.length > 0) {
    const { id, steps, nodes: pathNodes } = queue.shift()!;

    const tryVisit = (neighborId: string, stepType: string) => {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        const newSteps = [...steps, stepType];
        const newPathNodes = [...pathNodes, neighborId];

        const gender = getNode(neighborId)?.gender || "neutral";
        relationships[neighborId] = labelForPath(
          newSteps,
          newPathNodes,
          gender,
          customMap
        );

        queue.push({ id: neighborId, steps: newSteps, nodes: newPathNodes });
      }
    };

    (parentsByChild.get(id) || []).forEach((pId) => tryVisit(pId, "U"));
    (childrenByParent.get(id) || []).forEach((cId) => tryVisit(cId, "D"));
    (spousesById.get(id) || []).forEach((sId) => tryVisit(sId, "H"));
  }

  return relationships;
};
