import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useSchemaStore } from "~/stores/schema-store";

describe("useSchemaStore - Additional Functions", () => {
  let store: ReturnType<typeof useSchemaStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useSchemaStore();
  });

  describe("addTable", () => {
    it("should add a table with correct properties", () => {
      const columns = [
        {
          name: "id",
          type: "uuid",
          length: "",
          isPrimary: true,
          isForeign: false,
          isUnique: false,
          isNotNull: false,
        },
      ];

      const table = store.addTable("test_table", columns, 200, 300);

      expect(store.tables).toHaveLength(1);
      expect(table).toMatchObject({
        name: "test_table",
        columns,
        x: 200,
        y: 300,
        width: 250,
        height: 72, // 40 + 1 * 32
      });
      expect(table.id).toMatch(/^\d+-\d+\.?\d*$/); // timestamp-random format
    });

    it("should use default position when not provided", () => {
      const table = store.addTable("default_table", []);

      expect(table.x).toBe(100);
      expect(table.y).toBe(100);
    });
  });

  describe("updateTablePosition", () => {
    it("should update table position correctly", () => {
      const table = store.addTable("movable_table", []);
      const originalId = table.id;

      store.updateTablePosition(originalId, 500, 600);

      const updatedTable = store.tables.find((t) => t.id === originalId);
      expect(updatedTable?.x).toBe(500);
      expect(updatedTable?.y).toBe(600);
    });

    it("should not crash when table ID does not exist", () => {
      expect(() => {
        store.updateTablePosition("non-existent-id", 100, 200);
      }).not.toThrow();
    });
  });

  describe("addRelationship", () => {
    it("should add relationship with correct properties", () => {
      store.addRelationship("users", "id", "posts", "user_id");

      expect(store.relationships).toHaveLength(1);
      expect(store.relationships[0]).toMatchObject({
        fromTable: "users",
        fromColumn: "id",
        toTable: "posts",
        toColumn: "user_id",
      });
      expect(store.relationships[0].id).toMatch(/^\d+-\d+\.?\d*$/);
    });
  });

  describe("canvas operations", () => {
    it("should update canvas pan", () => {
      store.updateCanvasPan(150, 250);

      expect(store.canvas.panX).toBe(150);
      expect(store.canvas.panY).toBe(250);
    });

    it("should update canvas scale within limits", () => {
      store.updateCanvasScale(2.5);
      expect(store.canvas.scale).toBe(2.5);

      // Test upper limit
      store.updateCanvasScale(5);
      expect(store.canvas.scale).toBe(3); // max is 3

      // Test lower limit
      store.updateCanvasScale(0.05);
      expect(store.canvas.scale).toBe(0.1); // min is 0.1
    });

    it("should update canvas state partially", () => {
      store.updateCanvasState({
        isDragging: true,
        selectedTable: "table-123",
      });

      expect(store.canvas.isDragging).toBe(true);
      expect(store.canvas.selectedTable).toBe("table-123");
      expect(store.canvas.scale).toBe(1); // unchanged
    });
  });

  describe("deleteTable", () => {
    it("should delete table and related relationships", () => {
      // Add tables and relationships
      store.addTable("users", []);
      store.addTable("posts", []);
      store.addRelationship("users", "id", "posts", "user_id");

      const usersTable = store.tables.find((t) => t.name === "users")!;

      expect(store.tables).toHaveLength(2);
      expect(store.relationships).toHaveLength(1);

      store.deleteTable(usersTable.id);

      expect(store.tables).toHaveLength(1);
      expect(store.relationships).toHaveLength(0); // relationship removed
      expect(store.tables[0].name).toBe("posts");
    });

    it("should not crash when deleting non-existent table", () => {
      expect(() => {
        store.deleteTable("non-existent-id");
      }).not.toThrow();
    });
  });

  describe("getSampleData", () => {
    it("should return valid schema text", () => {
      const sampleData = store.getSampleData();

      expect(typeof sampleData).toBe("string");
      expect(sampleData).toContain("users");
      expect(sampleData).toContain("PRIMARY KEY");
      expect(sampleData).toContain("FOREIGN KEY");

      // Should be parsable
      expect(() => {
        store.parseSchemaData(sampleData);
      }).not.toThrow();
    });
  });
});

// Integration test - test the full workflow
describe("useSchemaStore - Integration", () => {
  let store: ReturnType<typeof useSchemaStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useSchemaStore();
  });

  it("should handle complete workflow: parse -> modify -> delete", () => {
    // 1. Parse sample data
    const sampleData = store.getSampleData();
    store.parseSchemaData(sampleData);

    expect(store.tables).toHaveLength(6);
    expect(store.relationships).toHaveLength(6);

    // 2. Add a new table
    const newTable = store.addTable("tags", [
      {
        name: "id",
        type: "uuid",
        length: "",
        isPrimary: true,
        isForeign: false,
        isUnique: false,
        isNotNull: false,
      },
      {
        name: "name",
        type: "varchar",
        length: "100",
        isPrimary: false,
        isForeign: false,
        isUnique: true,
        isNotNull: true,
      },
    ]);

    expect(store.tables).toHaveLength(7);
    expect(store.relationships).toHaveLength(6);

    // 3. Move a table
    store.updateTablePosition(newTable.id, 800, 400);
    const movedTable = store.tables.find((t) => t.id === newTable.id);
    expect(movedTable?.x).toBe(800);
    expect(movedTable?.y).toBe(400);

    // 4. Delete a table
    store.deleteTable(newTable.id);
    expect(store.tables).toHaveLength(6);
    expect(store.relationships).toHaveLength(6); // back to original count

    // 5. Clear everything
    store.clearSchema();
    expect(store.tables).toHaveLength(0);
    expect(store.relationships).toHaveLength(0);
    expect(store.canvas.scale).toBe(1);
  });
});
