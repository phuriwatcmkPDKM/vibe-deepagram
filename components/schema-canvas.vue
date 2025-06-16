<script setup lang="ts">
import type { Relationship, DragMoveEvent, Table } from "~/types/schema";

const schemaStore = useSchemaStore();
const { tables, relationships, canvas } = storeToRefs(schemaStore);

// Refs
const containerRef = ref<HTMLElement>();
const viewportRef = ref<HTMLElement>();

// State
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const lastPanPoint = ref({ x: 0, y: 0 });

// Computed
const transform = computed(() => {
  return `translate(${canvas.value.panX}px, ${canvas.value.panY}px) scale(${canvas.value.scale})`;
});

const gridPattern = computed(() => {
  const size = 20 * canvas.value.scale;
  const x = canvas.value.panX % size;
  const y = canvas.value.panY % size;

  return {
    size: Math.max(size, 10),
    x: x < 0 ? x + size : x,
    y: y < 0 ? y + size : y,
    opacity: canvas.value.scale > 0.5 ? 0.6 : 0.3,
  };
});

// Mouse handlers
const onMouseDown = (event: MouseEvent) => {
  const target = event.target as HTMLElement;

  // Don't pan if clicking on a table
  if (target.closest("[data-table]")) {
    return;
  }

  event.preventDefault();
  isDragging.value = true;
  schemaStore.setPanState(true);

  dragStart.value = {
    x: event.clientX - canvas.value.panX,
    y: event.clientY - canvas.value.panY,
  };

  lastPanPoint.value = {
    x: event.clientX,
    y: event.clientY,
  };

  // Clear selection
  schemaStore.setSelectedTable(null);

  // Add global mouse events
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};

const onMouseMove = (event: MouseEvent) => {
  if (!isDragging.value) return;

  event.preventDefault();

  const deltaX = event.clientX - lastPanPoint.value.x;
  const deltaY = event.clientY - lastPanPoint.value.y;

  const newPanX = canvas.value.panX + deltaX;
  const newPanY = canvas.value.panY + deltaY;

  schemaStore.updateCanvasPan(newPanX, newPanY);

  lastPanPoint.value = {
    x: event.clientX,
    y: event.clientY,
  };
};

const onMouseUp = () => {
  isDragging.value = false;
  schemaStore.setPanState(false);

  // Remove global mouse events
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
};

// Wheel handler for zooming
const onWheel = (event: WheelEvent) => {
  event.preventDefault();

  if (!containerRef.value) return;

  const rect = containerRef.value.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  // Use center point for zoom
  const pointX = centerX;
  const pointY = centerY;

  const scaleDelta = -event.deltaY * 0.01;
  const newScale = Math.min(
    Math.max(canvas.value.scale + scaleDelta * canvas.value.scale, 0.1),
    3
  );

  if (newScale !== canvas.value.scale) {
    const scaleRatio = newScale / canvas.value.scale;

    const newPanX = pointX - (pointX - canvas.value.panX) * scaleRatio;
    const newPanY = pointY - (pointY - canvas.value.panY) * scaleRatio;

    schemaStore.updateCanvasState({
      scale: newScale,
      panX: newPanX,
      panY: newPanY,
    });
  }
};

// Table handlers
const handleTableDragStart = (tableId: string) => {
  console.log("Canvas received dragStart", tableId);
  schemaStore.setSelectedTable(tableId);
  schemaStore.setDragState(true);
};

const handleTableDragMove = ({ tableId, x, y }: DragMoveEvent) => {
  console.log("Canvas received dragMove", { tableId, x, y });
  schemaStore.updateTablePosition(tableId, x, y);
};

const handleTableDragEnd = () => {
  console.log("Canvas received dragEnd");
  schemaStore.setDragState(false);
};

// Zoom controls
const zoomIn = () => {
  const newScale = Math.min(canvas.value.scale * 1.2, 3);
  schemaStore.updateCanvasScale(newScale);
};

const zoomOut = () => {
  const newScale = Math.max(canvas.value.scale * 0.8, 0.1);
  schemaStore.updateCanvasScale(newScale);
};

const resetZoom = () => {
  schemaStore.updateCanvasState({ scale: 1, panX: 0, panY: 0 });
};

const fitToScreen = () => {
  if (tables.value.length === 0) {
    resetZoom();
    return;
  }

  const padding = 100;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  tables.value.forEach((table: Table) => {
    minX = Math.min(minX, table.x);
    minY = Math.min(minY, table.y);
    maxX = Math.max(maxX, table.x + table.width);
    maxY = Math.max(maxY, table.y + table.height);
  });

  const contentWidth = maxX - minX + padding * 2;
  const contentHeight = maxY - minY + padding * 2;
  const containerRect = containerRef.value?.getBoundingClientRect();

  if (containerRect) {
    const scaleX = containerRect.width / contentWidth;
    const scaleY = containerRect.height / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 1);

    const panX = (containerRect.width - (maxX + minX) * newScale) / 2;
    const panY = (containerRect.height - (maxY + minY) * newScale) / 2;

    schemaStore.updateCanvasState({ scale: newScale, panX, panY });
  }
};

// Keyboard shortcuts
onKeyStroke(["+", "="], (e) => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    zoomIn();
  }
});

onKeyStroke("-", (e) => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    zoomOut();
  }
});

onKeyStroke("0", (e) => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    fitToScreen();
  }
});

onKeyStroke("1", (e) => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    resetZoom();
  }
});

// Optimized relationship path calculation with improved connection logic
const relationshipPaths = computed(() => {
  const paths = new Map<string, string>();
  
  // Create lookup maps for better performance
  const tableMap = new Map(tables.value.map(t => [t.name, t]));

  relationships.value.forEach((relationship) => {
    const fromTable = tableMap.get(relationship.fromTable);
    const toTable = tableMap.get(relationship.toTable);

    if (!fromTable || !toTable) {
      paths.set(relationship.id, "");
      return;
    }

    // Find column indices with fallback
    const fromColumnIndex = Math.max(0, 
      fromTable.columns.findIndex(c => c.name === relationship.fromColumn)
    );
    const toColumnIndex = Math.max(0,
      toTable.columns.findIndex(c => c.name === relationship.toColumn)
    );

    // Calculate precise connection points based on updated row height (42px)
    const headerHeight = 40;
    const rowHeight = 42;
    const rowCenter = rowHeight / 2;
    
    const fromY = fromTable.y + headerHeight + (fromColumnIndex * rowHeight) + rowCenter;
    const toY = toTable.y + headerHeight + (toColumnIndex * rowHeight) + rowCenter;

    // Intelligent connection point selection
    const fromCenter = { x: fromTable.x + fromTable.width / 2, y: fromY };
    const toCenter = { x: toTable.x + toTable.width / 2, y: toY };
    
    let fromX: number, toX: number;
    let fromSide: 'left' | 'right' | 'top' | 'bottom';
    let toSide: 'left' | 'right' | 'top' | 'bottom';

    // Calculate best connection sides based on table positions
    const deltaX = toCenter.x - fromCenter.x;
    const deltaY = toCenter.y - fromCenter.y;
    
    // Determine optimal connection sides
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal connection preferred
      if (deltaX > 0) {
        // From left to right
        fromSide = 'right';
        toSide = 'left';
        fromX = fromTable.x + fromTable.width;
        toX = toTable.x;
      } else {
        // From right to left
        fromSide = 'left';
        toSide = 'right';
        fromX = fromTable.x;
        toX = toTable.x + toTable.width;
      }
    } else {
      // Vertical connection preferred for closer tables
      if (deltaY > 0) {
        // From top to bottom
        fromSide = 'bottom';
        toSide = 'top';
        fromX = fromCenter.x;
        toX = toCenter.x;
      } else {
        // From bottom to top
        fromSide = 'top';
        toSide = 'bottom';
        fromX = fromCenter.x;
        toX = toCenter.x;
      }
    }

    // Generate smooth path based on connection type
    let path: string;
    
    if (fromSide === 'right' || fromSide === 'left') {
      // Horizontal bezier curve
      const horizontalOffset = Math.min(Math.abs(deltaX) * 0.4, 80);
      const control1X = fromX + (fromSide === 'right' ? horizontalOffset : -horizontalOffset);
      const control2X = toX + (toSide === 'left' ? -horizontalOffset : horizontalOffset);
      
      path = `M${fromX},${fromY}C${control1X},${fromY},${control2X},${toY},${toX},${toY}`;
    } else {
      // Vertical bezier curve
      const verticalOffset = Math.min(Math.abs(deltaY) * 0.4, 60);
      const control1Y = fromY + (fromSide === 'bottom' ? verticalOffset : -verticalOffset);
      const control2Y = toY + (toSide === 'top' ? -verticalOffset : verticalOffset);
      
      path = `M${fromX},${fromY}C${fromX},${control1Y},${toX},${control2Y},${toX},${toY}`;
    }

    paths.set(relationship.id, path);
  });

  return paths;
});

// Optimized path getter with fallback
const getRelationshipPath = (relationship: Relationship): string => {
  return relationshipPaths.value.get(relationship.id) || "";
};

// Mini-map
const minimapViewBox = computed(() => {
  if (tables.value.length === 0) return "0 0 100 100";

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  tables.value.forEach((table) => {
    minX = Math.min(minX, table.x);
    minY = Math.min(minY, table.y);
    maxX = Math.max(maxX, table.x + table.width);
    maxY = Math.max(maxY, table.y + table.height);
  });

  const padding = 100;
  return `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${
    maxY - minY + padding * 2
  }`;
});

const viewportRect = computed(() => {
  if (!containerRef.value) return { x: 0, y: 0, width: 100, height: 100 };

  const rect = containerRef.value.getBoundingClientRect();
  return {
    x: -canvas.value.panX / canvas.value.scale,
    y: -canvas.value.panY / canvas.value.scale,
    width: rect.width / canvas.value.scale,
    height: rect.height / canvas.value.scale,
  };
});
</script>

<template>
  <div
    ref="containerRef"
    class="relative w-full h-full overflow-hidden bg-gray-50 select-none"
    :class="{
      'cursor-grab': !canvas.isDragging && !isDragging,
      'cursor-grabbing': canvas.isDragging || isDragging,
    }"
    @mousedown="onMouseDown"
    @wheel="onWheel"
    @contextmenu.prevent
  >
    <!-- Grid Background -->
    <div
      class="absolute inset-0 pointer-events-none"
      :style="{
        backgroundImage: `radial-gradient(circle, rgba(156, 163, 175, 0.4) 1px, transparent 1px)`,
        backgroundSize: `${gridPattern.size}px ${gridPattern.size}px`,
        backgroundPosition: `${gridPattern.x}px ${gridPattern.y}px`,
        opacity: gridPattern.opacity,
        transition: 'opacity 0.2s ease',
      }"
    />

    <!-- Viewport -->
    <div
      ref="viewportRef"
      class="absolute inset-0 origin-top-left pointer-events-none"
      :style="{ transform }"
    >
      <!-- Relationships SVG -->
      <svg
        class="absolute inset-0 w-full h-full pointer-events-none"
        style="overflow: visible"
      >
        <defs>
          <!-- Standard arrow marker -->
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="7.5"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
            viewBox="0 0 8 6"
          >
            <path
              d="M0,0 L0,6 L8,3 z"
              fill="#3b82f6"
            />
          </marker>
          
          <!-- Smaller arrow for zoomed out views -->
          <marker
            id="arrowhead-small"
            markerWidth="6"
            markerHeight="4"
            refX="5.5"
            refY="2"
            orient="auto"
            markerUnits="strokeWidth"
            viewBox="0 0 6 4"
          >
            <path
              d="M0,0 L0,4 L6,2 z"
              fill="#3b82f6"
            />
          </marker>
        </defs>

        <g v-if="canvas.scale > 0.1">
          <path
            v-for="relationship in relationships"
            :key="relationship.id"
            :d="getRelationshipPath(relationship)"
            stroke="#3b82f6"
            :stroke-width="Math.max(1, 3 / canvas.scale)"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            :marker-end="canvas.scale > 0.5 ? 'url(#arrowhead)' : 'url(#arrowhead-small)'"
            :opacity="Math.max(0.5, Math.min(1, canvas.scale * 2))"
            class="transition-opacity duration-200"
          />
        </g>
      </svg>

      <!-- Tables -->
      <template v-for="table in tables" :key="table.id">
        <div
          :data-table="table.id"
          class="absolute pointer-events-auto"
          :style="{
            left: `${table.x}px`,
            top: `${table.y}px`,
            width: `${table.width}px`,
            height: `${table.height}px`,
          }"
        >
          <table-node
            :table="table"
            :is-selected="canvas.selectedTable === table.id"
            :scale="canvas.scale"
            @drag-start="handleTableDragStart"
            @drag-move="handleTableDragMove"
            @drag-end="handleTableDragEnd"
          />
        </div>
      </template>
    </div>

    <!-- Canvas Info -->
    <div
      class="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-gray-600 shadow-sm z-20"
    >
      <div>{{ Math.round(canvas.scale * 100) }}% zoom</div>
      <div>{{ tables.length }} tables</div>
    </div>

    <!-- Zoom Controls -->
    <div class="absolute bottom-6 right-6 flex flex-col gap-2 z-20">
      <div class="bg-white rounded-lg shadow-lg p-1 flex flex-col gap-1">
        <button
          :disabled="canvas.scale >= 3"
          class="w-10 h-10 bg-white border-0 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center text-lg font-bold text-gray-700 hover:text-gray-900"
          title="Zoom In (Ctrl/Cmd + Plus)"
          @click="zoomIn"
        >
          +
        </button>
        <button
          :disabled="canvas.scale <= 0.1"
          class="w-10 h-10 bg-white border-0 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center text-lg font-bold text-gray-700 hover:text-gray-900"
          title="Zoom Out (Ctrl/Cmd + Minus)"
          @click="zoomOut"
        >
          −
        </button>
        <div class="w-full h-px bg-gray-200 my-1" />
        <button
          class="px-3 py-2 bg-white border-0 rounded-md hover:bg-gray-100 transition-all text-xs font-medium text-gray-700 hover:text-gray-900"
          title="Fit to Screen (Ctrl/Cmd + 0)"
          @click="fitToScreen"
        >
          Fit
        </button>
        <button
          class="px-3 py-2 bg-white border-0 rounded-md hover:bg-gray-100 transition-all text-xs font-medium text-gray-700 hover:text-gray-900"
          title="Reset Zoom (Ctrl/Cmd + 1)"
          @click="resetZoom"
        >
          100%
        </button>
      </div>
    </div>

    <!-- Mini-map -->
    <div
      v-if="canvas.scale < 0.5 && tables.length > 0"
      class="absolute top-4 right-4 w-48 h-32 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden"
    >
      <div
        class="p-2 text-xs font-medium text-gray-600 border-b border-gray-200"
      >
        Overview
      </div>
      <div class="relative w-full h-24 bg-gray-50">
        <svg class="absolute inset-0 w-full h-full" :viewBox="minimapViewBox">
          <g v-for="table in tables" :key="table.id">
            <rect
              :x="table.x"
              :y="table.y"
              :width="table.width"
              :height="table.height"
              :fill="canvas.selectedTable === table.id ? '#3b82f6' : '#e5e7eb'"
              :stroke="
                canvas.selectedTable === table.id ? '#1d4ed8' : '#9ca3af'
              "
              stroke-width="1"
              rx="4"
            />
          </g>
          <!-- Viewport indicator -->
          <rect
            :x="viewportRect.x"
            :y="viewportRect.y"
            :width="viewportRect.width"
            :height="viewportRect.height"
            fill="rgba(59, 130, 246, 0.1)"
            stroke="#3b82f6"
            stroke-width="2"
            rx="2"
          />
        </svg>
      </div>
    </div>
  </div>
</template>
