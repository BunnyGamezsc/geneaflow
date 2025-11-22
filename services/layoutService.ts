import type { FamilyNode, FamilyEdge, Point } from "../types.ts";
import {
  NODE_WIDTH,
  NODE_HEIGHT,
  LEVEL_HEIGHT,
  SIBLING_GAP,
} from "../constants.ts";
import { buildAdjacency } from "./relationshipService.ts";

export function calculateLayout(
  nodes: FamilyNode[],
  edges: FamilyEdge[],
  rootId: string
): Record<string, Point> {
  const { parentsByChild, childrenByParent, spousesById } = buildAdjacency(
    nodes,
    edges
  );

  // 1. Calculate Levels (BFS)
  const levels: Record<string, number> = { [rootId]: 0 };
  const queue = [rootId];
  const visited = new Set([rootId]);

  while (queue.length) {
    const curr = queue.shift()!;
    const l = levels[curr];

    // Spouses: Same Level
    (spousesById.get(curr) || []).forEach((s) => {
      if (!visited.has(s)) {
        visited.add(s);
        levels[s] = l;
        queue.push(s);
      }
    });
    // Parents: Level - 1
    (parentsByChild.get(curr) || []).forEach((p) => {
      if (!visited.has(p)) {
        visited.add(p);
        levels[p] = l - 1;
        queue.push(p);
      }
    });
    // Children: Level + 1
    (childrenByParent.get(curr) || []).forEach((c) => {
      if (!visited.has(c)) {
        visited.add(c);
        levels[c] = l + 1;
        queue.push(c);
      }
    });
  }

  // Group by levels
  const rows: Record<number, string[]> = {};
  nodes.forEach((n) => {
    const l = levels[n.id] ?? 0;
    if (!rows[l]) rows[l] = [];
    rows[l].push(n.id);
  });

  const sortedLevels = Object.keys(rows)
    .map(Number)
    .sort((a, b) => a - b);
  const newPositions: Record<string, number> = {};

  // 2. Layout Level by Level (Top-Down)
  sortedLevels.forEach((lvl) => {
    const rowNodes = rows[lvl];

    // A. Group by Spouses AND Co-Parents (Clusters)
    const visitedInRow = new Set<string>();
    const clusters: {
      ids: string[];
      desiredCenter: number;
      currentCenter: number;
    }[] = [];

    rowNodes.forEach((nodeId) => {
      if (visitedInRow.has(nodeId)) return;

      // BFS to find all connected spouses AND co-parents in this level
      const clusterIds: string[] = [nodeId];
      const q = [nodeId];
      visitedInRow.add(nodeId);

      while (q.length) {
        const curr = q.shift()!;

        // 1. Direct Spouses
        const spouses = spousesById.get(curr) || [];

        // 2. Co-Parents (people who share a child with curr)
        const children = childrenByParent.get(curr) || [];
        const coParents = new Set<string>();
        children.forEach((childId) => {
          const parents = parentsByChild.get(childId) || [];
          parents.forEach((p) => {
            if (p !== curr && rowNodes.includes(p)) coParents.add(p);
          });
        });

        const partners = new Set([...spouses, ...coParents]);

        partners.forEach((s) => {
          if (rowNodes.includes(s) && !visitedInRow.has(s)) {
            visitedInRow.add(s);
            clusterIds.push(s);
            q.push(s);
          }
        });
      }

      // Internal Cluster Sort: Sort spouses based on their CURRENT X position.
      clusterIds.sort((a, b) => {
        const ax = nodes.find((n) => n.id === a)?.x ?? 0;
        const bx = nodes.find((n) => n.id === b)?.x ?? 0;
        return ax - bx;
      });

      // Calculate "Desired Center" for the cluster based on parents of ALL members
      let totalDesiredX = 0;
      let parentCount = 0;
      let totalCurrentX = 0;

      clusterIds.forEach((id) => {
        const n = nodes.find((node) => node.id === id);
        totalCurrentX += n?.x ?? 0;

        const parents = (parentsByChild.get(id) || []).filter(
          (p) => levels[p] < lvl
        );
        if (parents.length > 0) {
          // Center under parents (parents are already placed because we go top-down)
          const parentXs = parents.map(
            (p) => newPositions[p] ?? nodes.find((n) => n.id === p)?.x ?? 0
          );
          const pCenter =
            parentXs.reduce((sum, x) => sum + x, 0) / parentXs.length;
          totalDesiredX += pCenter;
          parentCount++;
        }
      });

      // Average Current X (used for stable tie-breaking)
      const currentCenter = totalCurrentX / clusterIds.length;

      let desiredCenter = 0;
      if (parentCount > 0) {
        desiredCenter = totalDesiredX / parentCount;
      } else {
        // If no parents, keep relative to current position or root
        if (clusterIds.includes(rootId)) {
          desiredCenter = 0;
        } else {
          desiredCenter = currentCenter;
        }
      }
      clusters.push({ ids: clusterIds, desiredCenter, currentCenter });
    });

    // B. Sort clusters
    clusters.sort((a, b) => {
      if (Math.abs(a.desiredCenter - b.desiredCenter) > 1) {
        return a.desiredCenter - b.desiredCenter;
      }
      return a.currentCenter - b.currentCenter;
    });

    // Flatten to nodes list for Block Merge
    const nodesWithDesired: { id: string; desiredX: number }[] = [];
    clusters.forEach((c) => {
      c.ids.forEach((id) =>
        nodesWithDesired.push({ id, desiredX: c.desiredCenter })
      );
    });

    // C. Resolve Overlaps (Block Merge Algorithm)
    interface Block {
      nodes: string[];
      totalDesired: number;
      width: number;
    }

    const blocks: Block[] = [];

    nodesWithDesired.forEach((item) => {
      let currentBlock: Block = {
        nodes: [item.id],
        totalDesired: item.desiredX,
        width: 0,
      };

      // Merge loop
      while (blocks.length > 0) {
        const prevBlock = blocks[blocks.length - 1];

        const prevCenter = prevBlock.totalDesired / prevBlock.nodes.length;
        const currCenter =
          currentBlock.totalDesired / currentBlock.nodes.length;

        const prevRightEdge = prevCenter + prevBlock.width / 2;
        const currLeftEdge = currCenter - currentBlock.width / 2;

        // Check for overlap with spacing
        if (prevRightEdge + SIBLING_GAP > currLeftEdge + 0.1) {
          // Merge
          blocks.pop();
          const mergedNodes = [...prevBlock.nodes, ...currentBlock.nodes];
          const newWidth = (mergedNodes.length - 1) * SIBLING_GAP;

          currentBlock = {
            nodes: mergedNodes,
            totalDesired: prevBlock.totalDesired + currentBlock.totalDesired,
            width: newWidth,
          };
        } else {
          break;
        }
      }
      blocks.push(currentBlock);
    });

    // D. Assign Final Positions from Blocks
    blocks.forEach((block) => {
      const center = block.totalDesired / block.nodes.length;
      const startX = center - block.width / 2;
      block.nodes.forEach((id, i) => {
        newPositions[id] = startX + i * SIBLING_GAP;
      });
    });
  });

  // 3. Return final positions
  const finalPositions: Record<string, Point> = {};
  nodes.forEach((n) => {
    const l = levels[n.id] ?? 0;
    finalPositions[n.id] = {
      x: newPositions[n.id] ?? n.x,
      y: l * LEVEL_HEIGHT,
    };
  });

  return finalPositions;
}
