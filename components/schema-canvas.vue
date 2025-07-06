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

// Get cardinality label for a specific side of the relationship
const getCardinalityLabel = (relationship: Relationship, side: 'from' | 'to'): string => {
  const cardinality = relationship.cardinality || 'one-to-many';
  
  switch (cardinality) {
    case 'one-to-one':
      return '1';
    case 'one-to-many':
      return side === 'from' ? '1' : 'N';
    case 'many-to-one':
      return side === 'from' ? 'M' : '1';
    case 'many-to-many':
      return side === 'from' ? 'M' : 'N';
    default:
      return side === 'from' ? '1' : 'N';
  }
};

// Get IE-style marker for government mode
const getIEMarker = (relationship: Relationship, side: 'from' | 'to'): string => {
  const cardinality = relationship.cardinality || 'one-to-many';
  
  switch (cardinality) {
    case 'one-to-one':
      return 'ie-one-to-one'; // Single line both ends
    case 'one-to-many':
      return side === 'from' ? 'ie-one' : 'ie-many'; // Single line → crow's foot
    case 'many-to-one':
      return side === 'from' ? 'ie-many' : 'ie-one'; // Crow's foot → single line
    case 'many-to-many':
      return 'ie-many'; // Crow's foot both ends
    default:
      return side === 'from' ? 'ie-one' : 'ie-many';
  }
};

// Get position for cardinality label on the relationship line
const getCardinalityPosition = (relationship: Relationship, side: 'from' | 'to'): { x: number; y: number } => {
  const fromTable = tables.value.find(t => t.name === relationship.fromTable);
  const toTable = tables.value.find(t => t.name === relationship.toTable);

  if (!fromTable || !toTable) {
    return { x: 0, y: 0 };
  }

  const fromColumnIndex = Math.max(0, 
    fromTable.columns.findIndex(c => c.name === relationship.fromColumn)
  );
  const toColumnIndex = Math.max(0,
    toTable.columns.findIndex(c => c.name === relationship.toColumn)
  );

  // Calculate connection points (same as in relationshipPaths)
  const headerHeight = 40;
  const rowHeight = 42;
  const rowCenter = rowHeight / 2;
  
  const fromY = fromTable.y + headerHeight + (fromColumnIndex * rowHeight) + rowCenter;
  const toY = toTable.y + headerHeight + (toColumnIndex * rowHeight) + rowCenter;

  const fromCenter = { x: fromTable.x + fromTable.width / 2, y: fromY };
  const toCenter = { x: toTable.x + toTable.width / 2, y: toY };
  
  let fromX: number, toX: number;
  const deltaX = toCenter.x - fromCenter.x;
  const deltaY = toCenter.y - fromCenter.y;

  // Determine connection points (same logic as relationshipPaths)
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX > 0) {
      fromX = fromTable.x + fromTable.width;
      toX = toTable.x;
    } else {
      fromX = fromTable.x;
      toX = toTable.x + toTable.width;
    }
  } else {
    fromX = fromCenter.x;
    toX = toCenter.x;
  }

  // Position labels near the tables (20% from each end)
  const labelOffset = 0.2;
  
  if (side === 'from') {
    return {
      x: fromX + (toX - fromX) * labelOffset,
      y: fromY + (toY - fromY) * labelOffset
    };
  } else {
    return {
      x: fromX + (toX - fromX) * (1 - labelOffset),
      y: fromY + (toY - fromY) * (1 - labelOffset)
    };
  }
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
    class="relative w-full h-full overflow-hidden select-none"
    :class="{
      'cursor-grab': !canvas.isDragging && !isDragging,
      'cursor-grabbing': canvas.isDragging || isDragging,
      'bg-gray-50': !canvas.isGovernmentMode,
      'bg-blue-50': canvas.isGovernmentMode,
    }"
    @mousedown="onMouseDown"
    @wheel="onWheel"
    @contextmenu.prevent
  >
    <!-- Grid Background -->
    <div
      class="absolute inset-0 pointer-events-none"
      :style="{
        backgroundImage: canvas.isGovernmentMode 
          ? `radial-gradient(circle, rgba(75, 85, 99, 0.3) 1px, transparent 1px)` 
          : `radial-gradient(circle, rgba(156, 163, 175, 0.4) 1px, transparent 1px)`,
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
          <!-- Information Engineering Style Markers for Government Mode -->
          <!-- IE One to One (single line both ends) -->
          <marker
            id="ie-one-to-one"
            markerWidth="8"
            markerHeight="16"
            refX="8"
            refY="8"
            orient="auto"
            markerUnits="userSpaceOnUse"
            viewBox="0 0 8 16"
          >
            <line x1="0" y1="2" x2="0" y2="14" stroke="#000000" stroke-width="3" />
          </marker>

          <!-- IE One to Many - One End (single line) -->
          <marker
            id="ie-one"
            markerWidth="8"
            markerHeight="16"
            refX="8"
            refY="8"
            orient="auto"
            markerUnits="userSpaceOnUse"
            viewBox="0 0 8 16"
          >
            <line x1="0" y1="2" x2="0" y2="14" stroke="#000000" stroke-width="3" />
          </marker>

          <!-- IE One to Many - Many End (crow's foot) -->
          <marker
            id="ie-many"
            markerWidth="20"
            markerHeight="20"
            refX="20"
            refY="10"
            orient="auto"
            markerUnits="userSpaceOnUse"
            viewBox="0 0 20 20"
          >
            <path d="M 0,10 L 20,10 M 14,4 L 20,10 L 14,16" stroke="#000000" stroke-width="3" fill="none" stroke-linejoin="round" />
          </marker>

          <!-- IE One or More - Double line + crow's foot -->
          <marker
            id="ie-one-or-more"
            markerWidth="28"
            markerHeight="20"
            refX="28"
            refY="10"
            orient="auto"
            markerUnits="userSpaceOnUse"
            viewBox="0 0 28 20"
          >
            <line x1="0" y1="4" x2="0" y2="16" stroke="#000000" stroke-width="3" />
            <line x1="6" y1="4" x2="6" y2="16" stroke="#000000" stroke-width="3" />
            <path d="M 8,10 L 28,10 M 22,4 L 28,10 L 22,16" stroke="#000000" stroke-width="3" fill="none" stroke-linejoin="round" />
          </marker>

          <!-- IE One and Only One - Double line -->
          <marker
            id="ie-one-only"
            markerWidth="14"
            markerHeight="16"
            refX="14"
            refY="8"
            orient="auto"
            markerUnits="userSpaceOnUse"
            viewBox="0 0 14 16"
          >
            <line x1="0" y1="2" x2="0" y2="14" stroke="#000000" stroke-width="3" />
            <line x1="6" y1="2" x2="6" y2="14" stroke="#000000" stroke-width="3" />
          </marker>

          <!-- IE Zero or One - Circle + line -->
          <marker
            id="ie-zero-one"
            markerWidth="20"
            markerHeight="16"
            refX="20"
            refY="8"
            orient="auto"
            markerUnits="userSpaceOnUse"
            viewBox="0 0 20 16"
          >
            <circle cx="5" cy="8" r="5" fill="none" stroke="#000000" stroke-width="3" />
            <line x1="12" y1="2" x2="12" y2="14" stroke="#000000" stroke-width="3" />
          </marker>

          <!-- IE Zero or Many - Circle + crow's foot -->
          <marker
            id="ie-zero-many"
            markerWidth="32"
            markerHeight="20"
            refX="32"
            refY="10"
            orient="auto"
            markerUnits="userSpaceOnUse"
            viewBox="0 0 32 20"
          >
            <circle cx="5" cy="10" r="5" fill="none" stroke="#000000" stroke-width="3" />
            <path d="M 12,10 L 32,10 M 26,4 L 32,10 L 26,16" stroke="#000000" stroke-width="3" fill="none" stroke-linejoin="round" />
          </marker>

          <!-- Original colored markers for normal mode -->
          <marker
            id="one-to-one"
            markerWidth="16"
            markerHeight="12"
            refX="8"
            refY="6"
            orient="auto"
            markerUnits="strokeWidth"
            viewBox="0 0 16 12"
          >
            <rect x="2" y="2" width="12" height="8" fill="white" stroke="#3b82f6" stroke-width="1" rx="2" />
            <text x="8" y="8" text-anchor="middle" font-family="Arial, sans-serif" font-size="7" font-weight="bold" fill="#3b82f6">1</text>
          </marker>

          <marker
            id="one-to-many"
            markerWidth="16"
            markerHeight="12"
            refX="8"
            refY="6"
            orient="auto"
            markerUnits="strokeWidth"
            viewBox="0 0 16 12"
          >
            <rect x="2" y="2" width="12" height="8" fill="white" stroke="#3b82f6" stroke-width="1" rx="2" />
            <text x="8" y="8" text-anchor="middle" font-family="Arial, sans-serif" font-size="7" font-weight="bold" fill="#3b82f6">N</text>
          </marker>

          <marker
            id="many-to-one"
            markerWidth="16"
            markerHeight="12"
            refX="8"
            refY="6"
            orient="auto"
            markerUnits="strokeWidth"
            viewBox="0 0 16 12"
          >
            <rect x="2" y="2" width="12" height="8" fill="white" stroke="#3b82f6" stroke-width="1" rx="2" />
            <text x="8" y="8" text-anchor="middle" font-family="Arial, sans-serif" font-size="7" font-weight="bold" fill="#3b82f6">M</text>
          </marker>

          <marker
            id="many-to-many"
            markerWidth="20"
            markerHeight="12"
            refX="10"
            refY="6"
            orient="auto"
            markerUnits="strokeWidth"
            viewBox="0 0 20 12"
          >
            <rect x="1" y="2" width="18" height="8" fill="white" stroke="#3b82f6" stroke-width="1" rx="2" />
            <text x="10" y="8" text-anchor="middle" font-family="Arial, sans-serif" font-size="6" font-weight="bold" fill="#3b82f6">M:N</text>
          </marker>
        </defs>

        <g v-if="canvas.scale > 0.1">
          <!-- Relationship lines with IE-style markers in government mode -->
          <path
            v-for="relationship in relationships"
            :key="relationship.id"
            :d="getRelationshipPath(relationship)"
            :stroke="canvas.isGovernmentMode ? '#000000' : '#3b82f6'"
            :stroke-width="canvas.isGovernmentMode ? Math.max(2, 4 / canvas.scale) : Math.max(1, 3 / canvas.scale)"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            :opacity="Math.max(0.5, Math.min(1, canvas.scale * 2))"
            class="transition-opacity duration-200"
            :marker-start="canvas.isGovernmentMode ? `url(#${getIEMarker(relationship, 'from')})` : ''"
            :marker-end="canvas.isGovernmentMode ? `url(#${getIEMarker(relationship, 'to')})` : ''"
          />
          
          <!-- Cardinality labels on lines (only in normal mode, not government mode) -->
          <g v-if="!canvas.isGovernmentMode" v-for="relationship in relationships" :key="`label-${relationship.id}`">
            <text
              v-if="getCardinalityLabel(relationship, 'from')"
              :x="getCardinalityPosition(relationship, 'from').x"
              :y="getCardinalityPosition(relationship, 'from').y"
              text-anchor="middle"
              dominant-baseline="middle"
              font-family="Arial, sans-serif"
              :font-size="Math.max(10, 12 / canvas.scale)"
              font-weight="bold"
              fill="#3b82f6"
              stroke="white"
              :stroke-width="Math.max(2, 3 / canvas.scale)"
              paint-order="stroke fill"
            >
              {{ getCardinalityLabel(relationship, 'from') }}
            </text>
            
            <text
              v-if="getCardinalityLabel(relationship, 'to')"
              :x="getCardinalityPosition(relationship, 'to').x"
              :y="getCardinalityPosition(relationship, 'to').y"
              text-anchor="middle"
              dominant-baseline="middle"
              font-family="Arial, sans-serif"
              :font-size="Math.max(10, 12 / canvas.scale)"
              font-weight="bold"
              fill="#3b82f6"
              stroke="white"
              :stroke-width="Math.max(2, 3 / canvas.scale)"
              paint-order="stroke fill"
            >
              {{ getCardinalityLabel(relationship, 'to') }}
            </text>
          </g>
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
      class="absolute top-4 left-4 backdrop-blur-sm rounded-lg px-3 py-2 text-xs shadow-sm z-20"
      :class="{
        'bg-white/90 text-gray-600': !canvas.isGovernmentMode,
        'bg-blue-50/90 text-gray-700 border border-gray-400': canvas.isGovernmentMode,
      }"
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
      class="absolute top-4 right-4 w-48 h-32 backdrop-blur-sm rounded-lg shadow-lg z-20 overflow-hidden"
      :class="{
        'bg-white/90 border border-gray-200': !canvas.isGovernmentMode,
        'bg-blue-50/90 border border-gray-400': canvas.isGovernmentMode,
      }"
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
              :fill="canvas.isGovernmentMode 
                ? (canvas.selectedTable === table.id ? '#000000' : '#ffffff') 
                : (canvas.selectedTable === table.id ? '#3b82f6' : '#e5e7eb')"
              :stroke="canvas.isGovernmentMode 
                ? (canvas.selectedTable === table.id ? '#374151' : '#000000') 
                : (canvas.selectedTable === table.id ? '#1d4ed8' : '#9ca3af')"
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
