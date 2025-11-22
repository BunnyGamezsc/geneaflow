export type Gender = 'male' | 'female' | 'neutral';

export interface FamilyNode {
  id: string;
  name: string;
  gender: Gender;
  x: number;
  y: number;
}

export type EdgeType = 'lineage' | 'spouse';

export interface FamilyEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
}

export type Adjacency = {
  parentsByChild: Map<string, string[]>;
  childrenByParent: Map<string, string[]>;
  spousesById: Map<string, string[]>;
};

export type RelationshipMap = { [key: string]: string };

export type Point = { x: number; y: number };

export type ConnectionStart = {
  nodeId: string;
  port: 'top' | 'bottom' | 'left' | 'right';
  x: number;
  y: number;
} | null;
