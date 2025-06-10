import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useSchemaStore } from "~/stores/schema-store";

describe("useSchemaStore - parseSchemaData", () => {
  let store: ReturnType<typeof useSchemaStore>;

  beforeEach(() => {
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia());
    store = useSchemaStore();
  });

  const sampleSchemaText = `database,public,lut_provinces,id,1,uuid,,PRIMARY KEY,,,
database,public,lut_provinces,name,2,varchar,255,NOT NULL,,,
database,public,lut_provinces,code,3,varchar,10,UNIQUE,,,
database,public,lut_provinces,created_at,4,timestamp,,DEFAULT NOW(),,,
database,public,users,id,1,uuid,,PRIMARY KEY,,,
database,public,users,name,2,varchar,255,NOT NULL,,,
database,public,users,email,3,varchar,255,UNIQUE,,,
database,public,users,province_id,4,uuid,,FOREIGN KEY,lut_provinces,id,
database,public,posts,id,1,uuid,,PRIMARY KEY,,,
database,public,posts,title,2,varchar,500,NOT NULL,,,
database,public,posts,content,3,text,,,,,
database,public,posts,user_id,4,uuid,,FOREIGN KEY,users,id,
database,public,posts,created_at,5,timestamp,,DEFAULT NOW(),,,`;

  // More realistic e-commerce example
  const ecommerceSchemaText = `ecommerce,public,categories,id,1,uuid,,PRIMARY KEY,,,
ecommerce,public,categories,name,2,varchar,100,NOT NULL,,,
ecommerce,public,categories,slug,3,varchar,100,UNIQUE,,,
ecommerce,public,categories,parent_id,4,uuid,,FOREIGN KEY,categories,id,
ecommerce,public,categories,description,5,text,,,,,
ecommerce,public,categories,is_active,6,boolean,,DEFAULT TRUE,,,
ecommerce,public,categories,created_at,7,timestamp,,DEFAULT NOW(),,,
ecommerce,public,categories,updated_at,8,timestamp,,DEFAULT NOW(),,,
ecommerce,public,products,id,1,uuid,,PRIMARY KEY,,,
ecommerce,public,products,sku,2,varchar,50,UNIQUE NOT NULL,,,
ecommerce,public,products,name,3,varchar,255,NOT NULL,,,
ecommerce,public,products,description,4,text,,,,,
ecommerce,public,products,category_id,5,uuid,,FOREIGN KEY,categories,id,
ecommerce,public,products,price,6,decimal,10.2,NOT NULL,,,
ecommerce,public,products,compare_price,7,decimal,10.2,,,,
ecommerce,public,products,cost_price,8,decimal,10.2,,,,
ecommerce,public,products,track_inventory,9,boolean,,DEFAULT TRUE,,,
ecommerce,public,products,inventory_quantity,10,integer,,DEFAULT 0,,,
ecommerce,public,products,weight,11,decimal,8.2,,,,
ecommerce,public,products,is_active,12,boolean,,DEFAULT TRUE,,,
ecommerce,public,products,meta_title,13,varchar,255,,,,,
ecommerce,public,products,meta_description,14,varchar,500,,,,,
ecommerce,public,products,created_at,15,timestamp,,DEFAULT NOW(),,,
ecommerce,public,products,updated_at,16,timestamp,,DEFAULT NOW(),,,
ecommerce,public,customers,id,1,uuid,,PRIMARY KEY,,,
ecommerce,public,customers,email,2,varchar,255,UNIQUE NOT NULL,,,
ecommerce,public,customers,first_name,3,varchar,100,NOT NULL,,,
ecommerce,public,customers,last_name,4,varchar,100,NOT NULL,,,
ecommerce,public,customers,phone,5,varchar,20,,,,,
ecommerce,public,customers,date_of_birth,6,date,,,,,
ecommerce,public,customers,password_hash,7,varchar,255,NOT NULL,,,
ecommerce,public,customers,email_verified_at,8,timestamp,,,,,
ecommerce,public,customers,is_active,9,boolean,,DEFAULT TRUE,,,
ecommerce,public,customers,created_at,10,timestamp,,DEFAULT NOW(),,,
ecommerce,public,customers,updated_at,11,timestamp,,DEFAULT NOW(),,,
ecommerce,public,customer_addresses,id,1,uuid,,PRIMARY KEY,,,
ecommerce,public,customer_addresses,customer_id,2,uuid,,FOREIGN KEY,customers,id,
ecommerce,public,customer_addresses,type,3,varchar,20,NOT NULL,,,
ecommerce,public,customer_addresses,first_name,4,varchar,100,NOT NULL,,,
ecommerce,public,customer_addresses,last_name,5,varchar,100,NOT NULL,,,
ecommerce,public,customer_addresses,company,6,varchar,255,,,,,
ecommerce,public,customer_addresses,address_line_1,7,varchar,255,NOT NULL,,,
ecommerce,public,customer_addresses,address_line_2,8,varchar,255,,,,,
ecommerce,public,customer_addresses,city,9,varchar,100,NOT NULL,,,
ecommerce,public,customer_addresses,state,10,varchar,100,,,,,
ecommerce,public,customer_addresses,postal_code,11,varchar,20,,,,,
ecommerce,public,customer_addresses,country,12,varchar,100,NOT NULL,,,
ecommerce,public,customer_addresses,phone,13,varchar,20,,,,,
ecommerce,public,customer_addresses,is_default,14,boolean,,DEFAULT FALSE,,,
ecommerce,public,customer_addresses,created_at,15,timestamp,,DEFAULT NOW(),,,
ecommerce,public,orders,id,1,uuid,,PRIMARY KEY,,,
ecommerce,public,orders,order_number,2,varchar,50,UNIQUE NOT NULL,,,
ecommerce,public,orders,customer_id,3,uuid,,FOREIGN KEY,customers,id,
ecommerce,public,orders,status,4,varchar,20,NOT NULL,,,
ecommerce,public,orders,subtotal,5,decimal,10.2,NOT NULL,,,
ecommerce,public,orders,tax_amount,6,decimal,10.2,,DEFAULT 0,,,
ecommerce,public,orders,shipping_amount,7,decimal,10.2,,DEFAULT 0,,,
ecommerce,public,orders,discount_amount,8,decimal,10.2,,DEFAULT 0,,,
ecommerce,public,orders,total_amount,9,decimal,10.2,NOT NULL,,,
ecommerce,public,orders,currency,10,varchar,3,,DEFAULT 'USD',,,
ecommerce,public,orders,payment_status,11,varchar,20,NOT NULL,,,
ecommerce,public,orders,shipping_address,12,json,,,,,
ecommerce,public,orders,billing_address,13,json,,,,,
ecommerce,public,orders,notes,14,text,,,,,
ecommerce,public,orders,shipped_at,15,timestamp,,,,,
ecommerce,public,orders,delivered_at,16,timestamp,,,,,
ecommerce,public,orders,created_at,17,timestamp,,DEFAULT NOW(),,,
ecommerce,public,orders,updated_at,18,timestamp,,DEFAULT NOW(),,,
ecommerce,public,order_items,id,1,uuid,,PRIMARY KEY,,,
ecommerce,public,order_items,order_id,2,uuid,,FOREIGN KEY,orders,id,
ecommerce,public,order_items,product_id,3,uuid,,FOREIGN KEY,products,id,
ecommerce,public,order_items,quantity,4,integer,NOT NULL,,,
ecommerce,public,order_items,unit_price,5,decimal,10.2,NOT NULL,,,
ecommerce,public,order_items,total_price,6,decimal,10.2,NOT NULL,,,
ecommerce,public,order_items,product_name,7,varchar,255,NOT NULL,,,
ecommerce,public,order_items,product_sku,8,varchar,50,NOT NULL,,,
ecommerce,public,order_items,created_at,9,timestamp,,DEFAULT NOW(),,,`;

  // Complex enterprise example with more tables and relationships
  const enterpriseSchemaText = `enterprise,public,organizations,id,1,uuid,,PRIMARY KEY,,,
enterprise,public,organizations,name,2,varchar,255,NOT NULL,,,
enterprise,public,organizations,slug,3,varchar,100,UNIQUE,,,
enterprise,public,organizations,domain,4,varchar,255,UNIQUE,,,
enterprise,public,organizations,subscription_plan,5,varchar,50,NOT NULL,,,
enterprise,public,organizations,max_users,6,integer,,DEFAULT 10,,,
enterprise,public,organizations,is_active,7,boolean,,DEFAULT TRUE,,,
enterprise,public,organizations,created_at,8,timestamp,,DEFAULT NOW(),,,
enterprise,public,users,id,1,uuid,,PRIMARY KEY,,,
enterprise,public,users,organization_id,2,uuid,,FOREIGN KEY,organizations,id,
enterprise,public,users,email,3,varchar,255,UNIQUE NOT NULL,,,
enterprise,public,users,first_name,4,varchar,100,NOT NULL,,,
enterprise,public,users,last_name,5,varchar,100,NOT NULL,,,
enterprise,public,users,role,6,varchar,50,NOT NULL,,,
enterprise,public,users,is_admin,7,boolean,,DEFAULT FALSE,,,
enterprise,public,users,last_login_at,8,timestamp,,,,,
enterprise,public,users,created_at,9,timestamp,,DEFAULT NOW(),,,
enterprise,public,projects,id,1,uuid,,PRIMARY KEY,,,
enterprise,public,projects,organization_id,2,uuid,,FOREIGN KEY,organizations,id,
enterprise,public,projects,name,3,varchar,255,NOT NULL,,,
enterprise,public,projects,description,4,text,,,,,
enterprise,public,projects,status,5,varchar,20,NOT NULL,,,
enterprise,public,projects,start_date,6,date,,,,,
enterprise,public,projects,end_date,7,date,,,,,
enterprise,public,projects,budget,8,decimal,12.2,,,,
enterprise,public,projects,created_by,9,uuid,,FOREIGN KEY,users,id,
enterprise,public,projects,created_at,10,timestamp,,DEFAULT NOW(),,,
enterprise,public,tasks,id,1,uuid,,PRIMARY KEY,,,
enterprise,public,tasks,project_id,2,uuid,,FOREIGN KEY,projects,id,
enterprise,public,tasks,assigned_to,3,uuid,,FOREIGN KEY,users,id,
enterprise,public,tasks,title,4,varchar,255,NOT NULL,,,
enterprise,public,tasks,description,5,text,,,,,
enterprise,public,tasks,priority,6,varchar,10,,DEFAULT 'medium',,,
enterprise,public,tasks,status,7,varchar,20,,DEFAULT 'todo',,,
enterprise,public,tasks,due_date,8,timestamp,,,,,
enterprise,public,tasks,estimated_hours,9,decimal,5.2,,,,
enterprise,public,tasks,actual_hours,10,decimal,5.2,,,,
enterprise,public,tasks,created_by,11,uuid,,FOREIGN KEY,users,id,
enterprise,public,tasks,created_at,12,timestamp,,DEFAULT NOW(),,,
enterprise,public,time_entries,id,1,uuid,,PRIMARY KEY,,,
enterprise,public,time_entries,task_id,2,uuid,,FOREIGN KEY,tasks,id,
enterprise,public,time_entries,user_id,3,uuid,,FOREIGN KEY,users,id,
enterprise,public,time_entries,description,4,text,,,,,
enterprise,public,time_entries,hours,5,decimal,5.2,NOT NULL,,,
enterprise,public,time_entries,date,6,date,NOT NULL,,,
enterprise,public,time_entries,is_billable,7,boolean,,DEFAULT TRUE,,,
enterprise,public,time_entries,hourly_rate,8,decimal,8.2,,,,
enterprise,public,time_entries,created_at,9,timestamp,,DEFAULT NOW(),,,`;

  it("should clear existing schema data before parsing", () => {
    // Add some initial data
    store.addTable("existing_table", [], 50, 50);
    store.addRelationship("table1", "col1", "table2", "col2");

    expect(store.tables).toHaveLength(1);
    expect(store.relationships).toHaveLength(1);

    // Parse new schema
    store.parseSchemaData(sampleSchemaText);

    // Should have new data, not the old data
    expect(store.tables).toHaveLength(3);
    expect(store.relationships).toHaveLength(2);
    expect(store.tables.some((t) => t.name === "existing_table")).toBe(false);
  });

  it("should create correct number of tables from schema data", () => {
    store.parseSchemaData(sampleSchemaText);

    expect(store.tables).toHaveLength(3);
    expect(store.tables.map((t) => t.name)).toEqual(
      expect.arrayContaining(["lut_provinces", "users", "posts"])
    );
  });

  it("should handle complex e-commerce schema with many tables", () => {
    store.parseSchemaData(ecommerceSchemaText);

    expect(store.tables).toHaveLength(6);
    expect(store.tables.map((t) => t.name)).toEqual(
      expect.arrayContaining([
        "categories",
        "products",
        "customers",
        "customer_addresses",
        "orders",
        "order_items",
      ])
    );

    // Should have multiple foreign key relationships
    expect(store.relationships.length).toBeGreaterThan(5);

    // Check that products table has correct number of columns (realistic e-commerce)
    const productsTable = store.tables.find((t) => t.name === "products");
    expect(productsTable!.columns).toHaveLength(16); // Real-world products have many attributes
  });

  it("should handle enterprise-level schema with complex relationships", () => {
    store.parseSchemaData(enterpriseSchemaText);

    expect(store.tables).toHaveLength(5);
    expect(store.tables.map((t) => t.name)).toEqual(
      expect.arrayContaining([
        "organizations",
        "users",
        "projects",
        "tasks",
        "time_entries",
      ])
    );

    // Should handle multiple foreign keys per table
    const tasksTable = store.tables.find((t) => t.name === "tasks");
    const foreignKeyColumns = tasksTable!.columns.filter((c) => c.isForeign);
    expect(foreignKeyColumns).toHaveLength(3); // project_id, assigned_to, created_by
  });

  it("should create tables with correct column structure", () => {
    store.parseSchemaData(sampleSchemaText);

    const provincesTable = store.tables.find((t) => t.name === "lut_provinces");
    expect(provincesTable).toBeDefined();
    expect(provincesTable!.columns).toHaveLength(4);

    // Check specific columns
    const idColumn = provincesTable!.columns.find((c) => c.name === "id");
    expect(idColumn).toMatchObject({
      name: "id",
      type: "uuid",
      length: "",
      isPrimary: true,
      isForeign: false,
      isUnique: false,
      isNotNull: false,
      foreignTable: undefined,
      foreignColumn: undefined,
    });

    const nameColumn = provincesTable!.columns.find((c) => c.name === "name");
    expect(nameColumn).toMatchObject({
      name: "name",
      type: "varchar",
      length: "255",
      isPrimary: false,
      isForeign: false,
      isUnique: false,
      isNotNull: true,
    });

    const codeColumn = provincesTable!.columns.find((c) => c.name === "code");
    expect(codeColumn).toMatchObject({
      name: "code",
      type: "varchar",
      length: "10",
      isPrimary: false,
      isForeign: false,
      isUnique: true,
      isNotNull: false,
    });
  });

  it("should create foreign key relationships correctly", () => {
    store.parseSchemaData(sampleSchemaText);

    expect(store.relationships).toHaveLength(2);

    const userProvinceRelation = store.relationships.find(
      (r) => r.fromTable === "users" && r.fromColumn === "province_id"
    );
    expect(userProvinceRelation).toMatchObject({
      fromTable: "users",
      fromColumn: "province_id",
      toTable: "lut_provinces",
      toColumn: "id",
    });

    const postUserRelation = store.relationships.find(
      (r) => r.fromTable === "posts" && r.fromColumn === "user_id"
    );
    expect(postUserRelation).toMatchObject({
      fromTable: "posts",
      fromColumn: "user_id",
      toTable: "users",
      toColumn: "id",
    });
  });

  it("should set foreign key properties on columns correctly", () => {
    store.parseSchemaData(sampleSchemaText);

    const usersTable = store.tables.find((t) => t.name === "users");
    const provinceIdColumn = usersTable!.columns.find(
      (c) => c.name === "province_id"
    );

    expect(provinceIdColumn).toMatchObject({
      name: "province_id",
      type: "uuid",
      isPrimary: false,
      isForeign: true,
      foreignTable: "lut_provinces",
      foreignColumn: "id",
    });

    const postsTable = store.tables.find((t) => t.name === "posts");
    const userIdColumn = postsTable!.columns.find((c) => c.name === "user_id");

    expect(userIdColumn).toMatchObject({
      name: "user_id",
      type: "uuid",
      isPrimary: false,
      isForeign: true,
      foreignTable: "users",
      foreignColumn: "id",
    });
  });

  it("should position tables in a grid layout", () => {
    store.parseSchemaData(sampleSchemaText);

    const tablePositions = store.tables.map((t) => ({
      name: t.name,
      x: t.x,
      y: t.y,
    }));

    // First row (y = 100)
    expect(tablePositions).toContainEqual({
      name: "lut_provinces",
      x: 100,
      y: 100,
    }); // index 0: 100 + (0 % 3) * 300
    expect(tablePositions).toContainEqual({ name: "users", x: 400, y: 100 }); // index 1: 100 + (1 % 3) * 300
    expect(tablePositions).toContainEqual({ name: "posts", x: 700, y: 100 }); // index 2: 100 + (2 % 3) * 300
  });

  it("should sort columns by position within each table", () => {
    const unorderedSchema = `database,public,test_table,created_at,3,timestamp,,DEFAULT NOW(),,,
database,public,test_table,id,1,uuid,,PRIMARY KEY,,,
database,public,test_table,name,2,varchar,255,NOT NULL,,,`;

    store.parseSchemaData(unorderedSchema);

    const testTable = store.tables.find((t) => t.name === "test_table");
    const columnNames = testTable!.columns.map((c) => c.name);

    expect(columnNames).toEqual(["id", "name", "created_at"]);
  });

  it("should handle empty schema text", () => {
    store.parseSchemaData("");

    expect(store.tables).toHaveLength(0);
    expect(store.relationships).toHaveLength(0);
  });

  it("should filter out lines with insufficient data", () => {
    const incompleteSchema = `database,public,incomplete
database,public,valid_table,id,1,uuid,,PRIMARY KEY,,,
invalid,line,with,few,parts`;

    store.parseSchemaData(incompleteSchema);

    expect(store.tables).toHaveLength(1);
    expect(store.tables[0].name).toBe("valid_table");
    expect(store.tables[0].columns).toHaveLength(1);
  });

  it("should handle mixed case constraints correctly", () => {
    const mixedCaseSchema = `database,public,test_table,col1,1,uuid,,primary key,,,
database,public,test_table,col2,2,varchar,50,FOREIGN KEY,other,id,
database,public,test_table,col3,3,varchar,50,Unique,,,
database,public,test_table,col4,4,varchar,50,not null,,,`;

    store.parseSchemaData(mixedCaseSchema);

    const testTable = store.tables.find((t) => t.name === "test_table");
    const columns = testTable!.columns;

    expect(columns[0]).toMatchObject({ isPrimary: true });
    expect(columns[1]).toMatchObject({
      isForeign: true,
      foreignTable: "other",
      foreignColumn: "id",
    });
    expect(columns[2]).toMatchObject({ isUnique: true });
    expect(columns[3]).toMatchObject({ isNotNull: true });
  });

  it("should handle multiple constraints on a single column", () => {
    const multiConstraintSchema = `database,public,test_table,combo_col,1,varchar,200,UNIQUE NOT NULL,,,`;

    store.parseSchemaData(multiConstraintSchema);

    const testTable = store.tables.find((t) => t.name === "test_table");
    const comboColumn = testTable!.columns[0];

    expect(comboColumn).toMatchObject({
      name: "combo_col",
      isUnique: true,
      isNotNull: true,
      isPrimary: false,
      isForeign: false,
    });
  });

  it("should set correct table dimensions", () => {
    store.parseSchemaData(sampleSchemaText);

    const provincesTable = store.tables.find((t) => t.name === "lut_provinces");

    expect(provincesTable!.width).toBe(250);
    // Height = 40 (header) + columns.length * 32
    expect(provincesTable!.height).toBe(40 + 4 * 32); // 4 columns

    const postsTable = store.tables.find((t) => t.name === "posts");
    expect(postsTable!.height).toBe(40 + 5 * 32); // 5 columns
  });

  it("should reset canvas state when parsing new schema", () => {
    // Modify canvas state
    store.updateCanvasScale(2);
    store.updateCanvasPan(100, 200);
    store.setSelectedTable("some-table");
    store.setDragState(true);

    expect(store.canvas.scale).toBe(2);
    expect(store.canvas.panX).toBe(100);
    expect(store.canvas.panY).toBe(200);

    store.parseSchemaData(sampleSchemaText);

    // Canvas should be reset
    expect(store.canvas.scale).toBe(1);
    expect(store.canvas.panX).toBe(0);
    expect(store.canvas.panY).toBe(0);
    expect(store.canvas.selectedTable).toBe(null);
    expect(store.canvas.isDragging).toBe(false);
    expect(store.canvas.isPanning).toBe(false);
  });

  it("should skip relationships for rows without foreign key data", () => {
    const schemaWithoutForeignKeys = `database,public,simple_table,id,1,uuid,,PRIMARY KEY,,,
database,public,simple_table,name,2,varchar,255,NOT NULL,,,`;

    store.parseSchemaData(schemaWithoutForeignKeys);

    expect(store.tables).toHaveLength(1);
    expect(store.relationships).toHaveLength(0);
  });

  it("should generate unique IDs for tables and relationships", () => {
    store.parseSchemaData(sampleSchemaText);

    const tableIds = store.tables.map((t) => t.id);
    const relationshipIds = store.relationships.map((r) => r.id);

    // All table IDs should be unique
    expect(new Set(tableIds).size).toBe(tableIds.length);

    // All relationship IDs should be unique
    expect(new Set(relationshipIds).size).toBe(relationshipIds.length);

    // IDs should follow the expected format (timestamp-random)
    tableIds.forEach((id) => {
      expect(id).toMatch(/^\d+-\d+\.?\d*$/);
    });
  });
});
