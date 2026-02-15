export interface Memory {
  id: number;
  content_hash: string;
  content: string;
  tags: string[];
  memory_type: string | null;
  metadata: Record<string, unknown> | null;
  created_at: number;
  updated_at: number;
  created_at_iso: string;
  updated_at_iso: string;
}

export interface MemoryListResponse {
  data: Memory[];
  total: number;
  limit: number;
  offset: number;
}

export interface MemorySearchResponse {
  data: Memory[];
}

export interface AccessedMemory {
  content_hash: string;
  content: string;
  memory_type: string | null;
  access_count: number;
}

export interface AccessStats {
  totalAccesses: number;
  avgAccesses: number;
  topAccessed: AccessedMemory[];
}

export interface MemoryStats {
  total: number;
  byType: Record<string, number>;
  byTag: Record<string, number>;
  accessStats?: AccessStats;
}

export interface GraphEdge {
  source_hash: string;
  target_hash: string;
  similarity: number;
  connection_types: string;
  metadata: string | null;
  created_at: number;
  relationship_type: string;
}

export interface GraphResponse {
  data: GraphEdge[];
}

export interface TagsResponse {
  data: string[];
}

export interface GraphNode {
  id: string;
  content: string;
  memory_type: string | null;
  tags: string[];
}

export interface GraphLink {
  source: string;
  target: string;
  similarity: number;
  relationship_type: string;
}

export interface FullGraphResponse {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface MemoryFilters {
  type?: string;
  tags?: string[];
  from?: string;
  to?: string;
  quality_min?: number;
  quality_max?: number;
}

export interface DuplicateGroup {
  similarity: number;
  memories: Memory[];
}

export interface DuplicatesResponse {
  groups: DuplicateGroup[];
  total_groups: number;
}

export interface TimelineGroup {
  date: string;
  count: number;
  memories: Memory[];
}

export interface TimelineResponse {
  groups: TimelineGroup[];
  total: number;
}

export interface ProjectionPoint {
  content_hash: string;
  x: number;
  y: number;
  content: string;
  memory_type: string | null;
  tags: string[];
  created_at_iso: string;
}

export interface ProjectionResponse {
  points: ProjectionPoint[];
  total: number;
  params: { n_neighbors: number; min_dist: number };
}
