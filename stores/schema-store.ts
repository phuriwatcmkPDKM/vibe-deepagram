import type {
  Table,
  Relationship,
  CanvasState,
  Column,
  SchemaData,
} from "~/types/schema";

export const useSchemaStore = defineStore("schema", () => {
  const tables = ref<Table[]>([]);
  const relationships = ref<Relationship[]>([]);
  const canvas = reactive<CanvasState>({
    scale: 1,
    panX: 0,
    panY: 0,
    isDragging: false,
    isPanning: false,
    selectedTable: null,
    isGovernmentMode: false,
  });

  const addTable = (
    name: string,
    columns: Column[],
    x = 100,
    y = 100
  ): Table => {
    const table: Table = {
      id: `${Date.now()}-${Math.random()}`,
      name,
      columns,
      x,
      y,
      width: 250,
      height: 40 + columns.length * 32,
    };
    tables.value.push(table);
    return table;
  };

  const updateTablePosition = (tableId: string, x: number, y: number): void => {
    const table = tables.value.find((t) => t.id === tableId);
    if (table) {
      table.x = x;
      table.y = y;
      // Ensure height is updated based on columns
      table.height = 40 + table.columns.length * 32;
    }
  };

  const updateTableHeight = (tableId: string): void => {
    const table = tables.value.find((t) => t.id === tableId);
    if (table) {
      table.height = 40 + table.columns.length * 32;
    }
  };

  const recalculateAllTableHeights = (): void => {
    tables.value.forEach(table => {
      table.height = 40 + table.columns.length * 32;
    });
  };

  const addRelationship = (
    fromTable: string,
    fromColumn: string,
    toTable: string,
    toColumn: string,
    cardinality?: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'
  ): void => {
    // Auto-detect cardinality if not provided
    let detectedCardinality = cardinality;
    if (!detectedCardinality) {
      const fromTableObj = tables.value.find(t => t.name === fromTable);
      const toTableObj = tables.value.find(t => t.name === toTable);
      
      if (fromTableObj && toTableObj) {
        const fromCol = fromTableObj.columns.find(c => c.name === fromColumn);
        const toCol = toTableObj.columns.find(c => c.name === toColumn);
        
        // Simple heuristic: if either column is primary key, it's likely one-to-many
        if (fromCol?.isPrimary && !toCol?.isPrimary) {
          detectedCardinality = 'one-to-many';
        } else if (!fromCol?.isPrimary && toCol?.isPrimary) {
          detectedCardinality = 'many-to-one';
        } else if (fromCol?.isPrimary && toCol?.isPrimary) {
          detectedCardinality = 'one-to-one';
        } else {
          detectedCardinality = 'one-to-many'; // Default
        }
      } else {
        detectedCardinality = 'one-to-many'; // Default
      }
    }

    const relationship: Relationship = {
      id: `${Date.now()}-${Math.random()}`,
      fromTable,
      fromColumn,
      toTable,
      toColumn,
      cardinality: detectedCardinality,
    };
    relationships.value.push(relationship);
  };

  // Canvas manipulation methods
  const updateCanvasPan = (panX: number, panY: number): void => {
    canvas.panX = panX;
    canvas.panY = panY;
  };

  const updateCanvasScale = (scale: number): void => {
    canvas.scale = Math.max(0.1, Math.min(3, scale));
  };

  const updateCanvasState = (updates: Partial<CanvasState>): void => {
    Object.assign(canvas, updates);
  };

  const setSelectedTable = (tableId: string | null): void => {
    canvas.selectedTable = tableId;
  };

  const setDragState = (isDragging: boolean): void => {
    canvas.isDragging = isDragging;
  };

  const setPanState = (isPanning: boolean): void => {
    canvas.isPanning = isPanning;
  };

  const setGovernmentMode = (isGovernmentMode: boolean): void => {
    canvas.isGovernmentMode = isGovernmentMode;
  };

  const clearSchema = (): void => {
    tables.value = [];
    relationships.value = [];
    canvas.scale = 1;
    canvas.panX = 0;
    canvas.panY = 0;
    canvas.selectedTable = null;
    canvas.isDragging = false;
    canvas.isPanning = false;
    canvas.isGovernmentMode = false;
  };

  const parseSchemaData = (schemaText: string): void => {
    clearSchema();

    const schemaData: SchemaData[] = [];
    const lines = schemaText.split("\n").filter((line) => line.trim());

    lines.forEach((line) => {
      const parts = line.split(",");
      if (parts.length >= 8) {
        schemaData.push({
          database: parts[0],
          schema: parts[1],
          table: parts[2],
          column: parts[3],
          position: parseInt(parts[4]),
          datatype: parts[5],
          length: parts[6],
          constraints: parts[7],
          foreignTable: parts[8] || null,
          foreignColumn: parts[9] || null,
        });
      }
    });

    // Group by table
    const tableGroups: Record<string, SchemaData[]> = {};
    schemaData.forEach((row) => {
      if (!tableGroups[row.table]) {
        tableGroups[row.table] = [];
      }
      tableGroups[row.table].push(row);
    });

    // Create tables
    const xOffset = 100;
    const yOffset = 100;
    const tableSpacing = 300;

    Object.keys(tableGroups).forEach((tableName, index) => {
      const columns: Column[] = tableGroups[tableName]
        .sort((a, b) => a.position - b.position)
        .map((col) => ({
          name: col.column,
          type: col.datatype,
          length: col.length,
          isPrimary: col.constraints.toLowerCase().includes("primary key"),
          isForeign: col.constraints.toLowerCase().includes("foreign key"),
          isUnique: col.constraints.toLowerCase().includes("unique"),
          isNotNull: col.constraints.toLowerCase().includes("not null"),
          foreignTable: col.foreignTable || undefined,
          foreignColumn: col.foreignColumn || undefined,
        }));

      const x = xOffset + (index % 3) * tableSpacing;
      const y = yOffset + Math.floor(index / 3) * 280;

      addTable(tableName, columns, x, y);
    });

    // Add relationships
    schemaData.forEach((row) => {
      if (row.foreignTable && row.foreignColumn) {
        addRelationship(
          row.table,
          row.column,
          row.foreignTable,
          row.foreignColumn
        );
      }
    });
  };

  const getSampleData = (): string => {
    return `database,public,countries,id,1,uuid,,PRIMARY KEY,,,
database,public,countries,name,2,varchar,255,NOT NULL,,,
database,public,countries,code,3,varchar,2,UNIQUE,,,
database,public,provinces,id,1,uuid,,PRIMARY KEY,,,
database,public,provinces,name,2,varchar,255,NOT NULL,,,
database,public,provinces,country_id,3,uuid,,FOREIGN KEY,countries,id,
database,public,users,id,1,uuid,,PRIMARY KEY,,,
database,public,users,email,2,varchar,255,UNIQUE,,,
database,public,users,name,3,varchar,255,NOT NULL,,,
database,public,users,province_id,4,uuid,,FOREIGN KEY,provinces,id,
database,public,user_profiles,user_id,1,uuid,,PRIMARY KEY FOREIGN KEY,users,id,
database,public,user_profiles,bio,2,text,,,,,
database,public,user_profiles,avatar_url,3,varchar,500,,,,
database,public,user_profiles,created_at,4,timestamp,,DEFAULT NOW(),,,
database,public,posts,id,1,uuid,,PRIMARY KEY,,,
database,public,posts,title,2,varchar,500,NOT NULL,,,
database,public,posts,content,3,text,,,,,
database,public,posts,author_id,4,uuid,,FOREIGN KEY,users,id,
database,public,posts,created_at,5,timestamp,,DEFAULT NOW(),,,
database,public,categories,id,1,uuid,,PRIMARY KEY,,,
database,public,categories,name,2,varchar,255,NOT NULL,,,
database,public,categories,description,3,text,,,,,
database,public,post_categories,post_id,1,uuid,,FOREIGN KEY,posts,id,
database,public,post_categories,category_id,2,uuid,,FOREIGN KEY,categories,id,
database,public,comments,id,1,uuid,,PRIMARY KEY,,,
database,public,comments,content,2,text,NOT NULL,,,
database,public,comments,post_id,3,uuid,,FOREIGN KEY,posts,id,
database,public,comments,author_id,4,uuid,,FOREIGN KEY,users,id,
database,public,comments,created_at,5,timestamp,,DEFAULT NOW(),,,`;
  };

  const deleteTable = (tableId: string): void => {
    const index = tables.value.findIndex((t) => t.id === tableId);
    if (index !== -1) {
      const tableName = tables.value[index].name;
      tables.value.splice(index, 1);
      // Remove related relationships
      relationships.value = relationships.value.filter(
        (rel) => rel.fromTable !== tableName && rel.toTable !== tableName
      );
    }
  };

  const selectAllTables = (): void => {
    // Implementation for selecting all tables
    console.log("Select all tables");
  };

  const undo = (): void => {
    // Implementation for undo functionality
    console.log("Undo action");
  };

  return {
    tables,
    relationships: readonly(relationships),
    canvas: readonly(canvas),
    addTable,
    updateTablePosition,
    updateTableHeight,
    recalculateAllTableHeights,
    addRelationship,
    updateCanvasPan,
    updateCanvasScale,
    updateCanvasState,
    setSelectedTable,
    setDragState,
    setPanState,
    setGovernmentMode,
    clearSchema,
    parseSchemaData,
    getSampleData,
    deleteTable,
    selectAllTables,
    undo,
  };
});
