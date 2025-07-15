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
    isClassicMode: false,
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
    tables.value.forEach((table) => {
      table.height = 40 + table.columns.length * 32;
    });
  };

  const addRelationship = (
    fromTable: string,
    fromColumn: string,
    toTable: string,
    toColumn: string,
    cardinality?: "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many"
  ): void => {
    // Auto-detect cardinality if not provided
    let detectedCardinality = cardinality;
    if (!detectedCardinality) {
      const fromTableObj = tables.value.find((t) => t.name === fromTable);
      const toTableObj = tables.value.find((t) => t.name === toTable);

      if (fromTableObj && toTableObj) {
        const fromCol = fromTableObj.columns.find((c) => c.name === fromColumn);
        const toCol = toTableObj.columns.find((c) => c.name === toColumn);

        // Simple heuristic: if either column is primary key, it's likely one-to-many
        if (fromCol?.isPrimary && !toCol?.isPrimary) {
          detectedCardinality = "one-to-many";
        } else if (!fromCol?.isPrimary && toCol?.isPrimary) {
          detectedCardinality = "many-to-one";
        } else if (fromCol?.isPrimary && toCol?.isPrimary) {
          detectedCardinality = "one-to-one";
        } else {
          detectedCardinality = "one-to-many"; // Default
        }
      } else {
        detectedCardinality = "one-to-many"; // Default
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

  const setClassicMode = (isClassicMode: boolean): void => {
    canvas.isClassicMode = isClassicMode;
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
    canvas.isClassicMode = false;
  };

  const parseSchemaData = (schemaText: string): void => {
    clearSchema();

    const schemaData: SchemaData[] = [];
    const lines = schemaText.split("\n").filter((line) => line.trim());

    // Remove header
    const dataLines = lines.filter(
      (line) => !line.toLowerCase().startsWith("dbms,")
    );

    dataLines.forEach((line) => {
      const parts = line.split(",");

      if (parts.length >= 12) {
        schemaData.push({
          database: parts[0],
          catalog: parts[1],
          schema: parts[2],
          table: parts[3],
          column: parts[4],
          position: parseInt(parts[5]),
          datatype: parts[6],
          length: parts[7],
          constraints: parts[8],
          foreignSchema: parts[9] || null,
          foreignTable: parts[10] || null,
          foreignColumn: parts[11] || null,
          relationshipHint: parts[12] || null,
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
    const processedRelationships = new Set<string>();

    schemaData.forEach((row) => {
      if (row.foreignTable && row.foreignColumn) {
        const relationshipKey = `${row.table}-${row.column}-${row.foreignTable}-${row.foreignColumn}`;
        if (processedRelationships.has(relationshipKey)) return;
        processedRelationships.add(relationshipKey);

        let cardinality:
          | "one-to-one"
          | "one-to-many"
          | "many-to-one"
          | "many-to-many" = "many-to-one"; // Default: FK → PK

        // Override from CSV column if available
        if (row.relationshipHint) {
          cardinality =
            row.relationshipHint.toLowerCase() as typeof cardinality;
        } else {
          // Count all FKs in the same table
          const foreignKeysInTable = schemaData.filter(
            (s) => s.table === row.table && s.foreignTable
          );

          const isUniqueOrPrimary =
            row.constraints.toLowerCase().includes("primary key") ||
            row.constraints.toLowerCase().includes("unique");

          const isCompositeJunction =
            foreignKeysInTable.length === 2 &&
            foreignKeysInTable.every((fk) =>
              fk.constraints.toLowerCase().includes("primary key")
            );

          if (isCompositeJunction) {
            cardinality = "many-to-many";
          } else if (isUniqueOrPrimary) {
            cardinality = "one-to-one";
          }
        }

        console.log(
          `Adding relationship: ${row.table}.${row.column} → ${row.foreignTable}.${row.foreignColumn} (${cardinality})`
        );

        addRelationship(
          row.table,
          row.column,
          row.foreignTable,
          row.foreignColumn,
          cardinality
        );
      }
    });
  };

  const getSampleData = (): string => {
    return `dbms,table_catalog,table_schema,table_name,column_name,ordinal_position,data_type,character_maximum_length,constraint_type,foreign_table_schema,foreign_table_name,foreign_column_name
postgresql,database,public,users,id,1,uuid,,PRIMARY KEY,,,
postgresql,database,public,users,name,2,varchar,255,,,,
postgresql,database,public,users,username,3,varchar,255,,,,
postgresql,database,public,users,password,4,varchar,255,,,,
postgresql,database,public,users,age,5,numeric,,,,
postgresql,database,public,users,user_type_id,6,uuid,,FOREIGN KEY,public,user_types,id
postgresql,database,public,users,created_at,7,timestamp,,,,
postgresql,database,public,users,updated_at,8,timestamp,,,,
postgresql,database,public,users,deleted_at,9,timestamp,,,,

postgresql,database,public,user_types,id,1,uuid,,PRIMARY KEY,,,
postgresql,database,public,user_types,code,2,varchar,100,,,,
postgresql,database,public,user_types,name,3,varchar,255,,,,
postgresql,database,public,user_types,created_at,4,timestamp,,,,
postgresql,database,public,user_types,updated_at,5,timestamp,,,,
postgresql,database,public,user_types,deleted_at,6,timestamp,,,,

postgresql,database,public,posts,id,1,uuid,,PRIMARY KEY,,,
postgresql,database,public,posts,user_id,2,uuid,,FOREIGN KEY,public,users,id
postgresql,database,public,posts,title,3,varchar,255,,,,
postgresql,database,public,posts,content,4,text,,,,
postgresql,database,public,posts,is_published,5,boolean,,,,
postgresql,database,public,posts,created_at,6,timestamp,,,,
postgresql,database,public,posts,updated_at,7,timestamp,,,,

postgresql,database,public,comments,id,1,uuid,,PRIMARY KEY,,,
postgresql,database,public,comments,post_id,2,uuid,,FOREIGN KEY,public,posts,id
postgresql,database,public,comments,user_id,3,uuid,,FOREIGN KEY,public,users,id
postgresql,database,public,comments,content,4,text,,,,
postgresql,database,public,comments,created_at,5,timestamp,,,,
postgresql,database,public,comments,updated_at,6,timestamp,,,,

postgresql,database,public,categories,id,1,uuid,,PRIMARY KEY,,,
postgresql,database,public,categories,name,2,varchar,255,,,,
postgresql,database,public,categories,slug,3,varchar,255,,,,
postgresql,database,public,categories,created_at,4,timestamp,,,,
postgresql,database,public,categories,updated_at,5,timestamp,,,,

postgresql,database,public,post_categories,post_id,1,uuid,,FOREIGN KEY,public,posts,id
postgresql,database,public,post_categories,category_id,2,uuid,,FOREIGN KEY,public,categories,id
`;
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
    setClassicMode,
    clearSchema,
    parseSchemaData,
    getSampleData,
    deleteTable,
    selectAllTables,
    undo,
  };
});
