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

    // Add relationships with explicit cardinalities
    const processedRelationships = new Set<string>();

    schemaData.forEach((row) => {
      if (row.foreignTable && row.foreignColumn) {
        const relationshipKey = `${row.table}-${row.column}-${row.foreignTable}-${row.foreignColumn}`;

        if (processedRelationships.has(relationshipKey)) {
          return; // Skip duplicates
        }
        processedRelationships.add(relationshipKey);

        let cardinality:
          | "one-to-one"
          | "one-to-many"
          | "many-to-one"
          | "many-to-many" = "one-to-many";

        // Check if this is a junction table (has multiple foreign keys)
        const tableForeignKeys = schemaData.filter(
          (s) =>
            s.table === row.table && s.foreignTable && s.foreignTable.trim()
        );

        if (tableForeignKeys.length >= 2) {
          // Junction table with multiple foreign keys = many-to-many
          cardinality = "many-to-many";
        } else if (
          row.constraints.toLowerCase().includes("unique") ||
          row.constraints.toLowerCase().includes("primary key")
        ) {
          // Unique or primary key constraint = one-to-one
          cardinality = "one-to-one";
        } else {
          // Default = one-to-many
          cardinality = "one-to-many";
        }

        console.log(
          `Adding relationship: ${row.table}.${row.column} -> ${row.foreignTable}.${row.foreignColumn} (${cardinality})`
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
    return `database,public,users,id,1,uuid,,PRIMARY KEY,,,
database,public,users,email,2,varchar,255,UNIQUE NOT NULL,,,
database,public,users,name,3,varchar,255,NOT NULL,,,
database,public,users,manager_id,4,uuid,,FOREIGN KEY,users,id,
database,public,user_profiles,user_id,1,uuid,,PRIMARY KEY FOREIGN KEY,users,id,
database,public,user_profiles,bio,2,text,,,,,
database,public,user_profiles,avatar_url,3,varchar,500,,,,
database,public,companies,id,1,uuid,,PRIMARY KEY,,,
database,public,companies,name,2,varchar,255,NOT NULL,,,
database,public,companies,ceo_user_id,3,uuid,,UNIQUE FOREIGN KEY,users,id,
database,public,departments,id,1,uuid,,PRIMARY KEY,,,
database,public,departments,name,2,varchar,255,NOT NULL,,,
database,public,departments,company_id,3,uuid,,NOT NULL FOREIGN KEY,companies,id,
database,public,employees,id,1,uuid,,PRIMARY KEY,,,
database,public,employees,name,2,varchar,255,NOT NULL,,,
database,public,employees,department_id,3,uuid,,NOT NULL FOREIGN KEY,departments,id,
database,public,employees,supervisor_id,4,uuid,,FOREIGN KEY,employees,id,
database,public,projects,id,1,uuid,,PRIMARY KEY,,,
database,public,projects,name,2,varchar,255,NOT NULL,,,
database,public,projects,description,3,text,,,,,
database,public,project_assignments,id,1,uuid,,PRIMARY KEY,,,
database,public,project_assignments,employee_id,2,uuid,,NOT NULL FOREIGN KEY,employees,id,
database,public,project_assignments,project_id,3,uuid,,NOT NULL FOREIGN KEY,projects,id,
database,public,project_assignments,role,4,varchar,100,,,,
database,public,skills,id,1,uuid,,PRIMARY KEY,,,
database,public,skills,name,2,varchar,255,NOT NULL,,,
database,public,employee_skills,id,1,uuid,,PRIMARY KEY,,,
database,public,employee_skills,employee_id,2,uuid,,NOT NULL FOREIGN KEY,employees,id,
database,public,employee_skills,skill_id,3,uuid,,NOT NULL FOREIGN KEY,skills,id,
database,public,employee_skills,proficiency,4,varchar,50,,,,`;
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
