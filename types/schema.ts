export interface Column {
  name: string;
  type: string;
  length?: string;
  isPrimary: boolean;
  isForeign: boolean;
  isUnique: boolean;
  isNotNull: boolean;
  foreignTable?: string;
  foreignColumn?: string;
}

export interface Table {
  id: string;
  name: string;
  columns: Column[];
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Relationship {
  id: string;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  cardinality?: "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many";
}

export interface CanvasState {
  scale: number;
  panX: number;
  panY: number;
  isDragging: boolean;
  isPanning: boolean;
  selectedTable: string | null;
  isClassicMode: boolean;
}

export interface SchemaData {
  database: string;
  schema: string;
  table: string;
  column: string;
  position: number;
  datatype: string;
  length: string;
  constraints: string;
  foreignTable: string | null;
  foreignColumn: string | null;
}

export interface DragMoveEvent {
  tableId: string;
  x: number;
  y: number;
}

export type DatabaseType = "postgresql" | "mysql" | "sqlite";
