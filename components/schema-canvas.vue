<script setup lang="ts">
import type { Relationship, DragMoveEvent, Table } from "~/types/schema";

interface PanStart {
  x: number;
  y: number;
}

interface CanvasSize {
  width: number;
  height: number;
}

const schemaStore = useSchemaStore();
const { tables, relationships, canvas } = storeToRefs(schemaStore);

const canvasRef = ref<HTMLElement | null>(null);
const canvasSize = reactive<CanvasSize>({ width: 6000, height: 6000 });

const { pressed: isPressed } = useMousePressed();
const { x: mouseX, y: mouseY } = useMouse();

let panStart: PanStart = { x: 0, y: 0 };
let isPanning = false;

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

// Mini-map calculations
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
  if (!canvasRef.value) return { x: 0, y: 0, width: 100, height: 100 };

  const rect = canvasRef.value.getBoundingClientRect();
  const scale = canvas.value.scale;
  const panX = canvas.value.panX;
  const panY = canvas.value.panY;

  return {
    x: -panX / scale,
    y: -panY / scale,
    width: rect.width / scale,
    height: rect.height / scale,
  };
});

const startPan = (event: MouseEvent): void => {
  const target = event.target as HTMLElement;

  // Don't start panning if clicking on a table element
  if (
    target.closest("table-node") ||
    target.getAttribute("data-table-element")
  ) {
    return;
  }

  if (
    target === canvasRef.value ||
    target.closest(".schema-canvas") === event.currentTarget
  ) {
    isPanning = true;
    panStart = {
      x: event.clientX - canvas.value.panX,
      y: event.clientY - canvas.value.panY,
    };

    // Clear table selection when clicking on canvas
    schemaStore.setSelectedTable(null);
  }
};

watch(
  [mouseX, mouseY, isPressed],
  ([newX, newY, pressed]: [number, number, boolean]) => {
    if (!pressed) {
      isPanning = false;
      return;
    }

    if (isPanning) {
      const panX = newX - panStart.x;
      const panY = newY - panStart.y;
      schemaStore.updateCanvasPan(panX, panY);
    }
  }
);

const handleWheel = (event: WheelEvent): void => {
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;

  // Smooth zoom with finer control
  const zoomSensitivity = 0.05;
  const zoomFactor =
    1 + (event.deltaY > 0 ? -zoomSensitivity : zoomSensitivity);
  const newScale = Math.max(0.1, Math.min(5, canvas.value.scale * zoomFactor));

  if (newScale !== canvas.value.scale) {
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const scaleDiff = newScale - canvas.value.scale;
    const panX =
      canvas.value.panX -
      ((mouseX - canvas.value.panX) * scaleDiff) / canvas.value.scale;
    const panY =
      canvas.value.panY -
      ((mouseY - canvas.value.panY) * scaleDiff) / canvas.value.scale;

    schemaStore.updateCanvasState({ scale: newScale, panX, panY });
  }
};

const handleTableDragStart = (tableId: string): void => {
  schemaStore.setSelectedTable(tableId);
  schemaStore.setDragState(true);
};

const handleTableDragMove = ({ tableId, x, y }: DragMoveEvent): void => {
  schemaStore.updateTablePosition(tableId, x, y);
};

const handleTableDragEnd = (): void => {
  schemaStore.setDragState(false);
};

const zoomIn = (): void => {
  const newScale = Math.min(5, canvas.value.scale * 1.3);
  schemaStore.updateCanvasScale(newScale);
};

const zoomOut = (): void => {
  const newScale = Math.max(0.1, canvas.value.scale * 0.7);
  schemaStore.updateCanvasScale(newScale);
};

const resetZoom = (): void => {
  schemaStore.updateCanvasState({ scale: 1, panX: 0, panY: 0 });
};

const fitToScreen = (): void => {
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
  const containerRect = canvasRef.value?.getBoundingClientRect();

  if (containerRect) {
    const scaleX = containerRect.width / contentWidth;
    const scaleY = containerRect.height / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 1);

    const panX = (containerRect.width - (maxX + minX) * newScale) / 2;
    const panY = (containerRect.height - (maxY + minY) * newScale) / 2;

    schemaStore.updateCanvasState({ scale: newScale, panX, panY });
  }
};

// Memoized relationship path calculation for performance
const relationshipPaths = computed(() => {
  const paths = new Map<string, string>();

  relationships.value.forEach((relationship) => {
    const fromTable = tables.value.find(
      (t: Table) => t.name === relationship.fromTable
    );
    const toTable = tables.value.find(
      (t: Table) => t.name === relationship.toTable
    );

    if (!fromTable || !toTable) {
      paths.set(relationship.id, "");
      return;
    }

    const fromColumnIndex = fromTable.columns.findIndex(
      (c) => c.name === relationship.fromColumn
    );
    const toColumnIndex = toTable.columns.findIndex(
      (c) => c.name === relationship.toColumn
    );

    const fromY = fromTable.y + 40 + fromColumnIndex * 32 + 16;
    const toY = toTable.y + 40 + toColumnIndex * 32 + 16;

    let fromX: number, toX: number;

    if (fromTable.x + fromTable.width < toTable.x) {
      fromX = fromTable.x + fromTable.width;
      toX = toTable.x;
    } else if (toTable.x + toTable.width < fromTable.x) {
      fromX = fromTable.x;
      toX = toTable.x + toTable.width;
    } else {
      fromX = fromTable.x + fromTable.width / 2;
      toX = toTable.x + toTable.width / 2;
    }

    const midX = (fromX + toX) / 2;

    // Simplified path for better performance
    paths.set(
      relationship.id,
      `M${fromX},${fromY}C${midX},${fromY},${midX},${toY},${toX},${toY}`
    );
  });

  return paths;
});

const getRelationshipPath = (relationship: Relationship): string => {
  return relationshipPaths.value.get(relationship.id) || "";
};

onMounted(() => {
  nextTick(() => {
    if (canvasRef.value) {
      const rect = canvasRef.value.getBoundingClientRect();
      canvasSize.width = Math.max(rect.width, 6000);
      canvasSize.height = Math.max(rect.height, 6000);
    }
  });

  // Update canvas size on window resize
  window.addEventListener("resize", () => {
    if (canvasRef.value) {
      const rect = canvasRef.value.getBoundingClientRect();
      canvasSize.width = Math.max(rect.width, 6000);
      canvasSize.height = Math.max(rect.height, 6000);
    }
  });
});
</script>
<template>
  <div class="relative w-full h-full overflow-hidden bg-gray-50 schema-canvas">
    <!-- Grid Background -->
    <div
      class="absolute inset-0 opacity-60 pointer-events-none"
      :style="{
        backgroundImage: `
          radial-gradient(circle, rgba(156, 163, 175, 0.2) 1px, transparent 1px),
          linear-gradient(rgba(156, 163, 175, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(156, 163, 175, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: `${20 * canvas.scale}px ${20 * canvas.scale}px, ${
          20 * canvas.scale
        }px ${20 * canvas.scale}px, ${20 * canvas.scale}px ${
          20 * canvas.scale
        }px`,
        backgroundPosition: `${canvas.panX % (20 * canvas.scale)}px ${
          canvas.panY % (20 * canvas.scale)
        }px`,
        backgroundColor: '#f9fafb',
        transition: canvas.scale > 0.5 ? 'opacity 0.2s ease' : 'none',
      }"
    />

    <!-- Canvas Container -->
    <div
      ref="canvasRef"
      class="absolute inset-0 transition-none"
      :class="{
        'cursor-grab': !canvas.isDragging && !isPanning,
        'cursor-grabbing': canvas.isDragging || isPanning,
        'select-none': isPanning || canvas.isDragging,
      }"
      :style="{
        transform: `translate(${canvas.panX}px, ${canvas.panY}px) scale(${canvas.scale})`,
        willChange: canvas.isDragging || isPanning ? 'transform' : 'auto',
      }"
      data-canvas="true"
      @mousedown="startPan"
      @wheel.prevent="handleWheel"
      @contextmenu.prevent
    >
      <!-- Relationship Lines SVG - Optimized for performance -->
      <svg
        class="absolute inset-0 pointer-events-none z-0"
        :width="canvasSize.width"
        :height="canvasSize.height"
        :viewBox="`0 0 ${canvasSize.width} ${canvasSize.height}`"
        style="overflow: visible"
        :style="{
          willChange: canvas.isDragging || isPanning ? 'auto' : 'transform',
          opacity: canvas.isDragging ? 0.7 : 1,
          transition: canvas.isDragging ? 'none' : 'opacity 0.2s ease',
        }"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
          </marker>
        </defs>

        <g v-if="!canvas.isDragging || canvas.scale > 0.5">
          <path
            v-for="relationship in relationships"
            :key="relationship.id"
            :d="getRelationshipPath(relationship)"
            stroke="#3b82f6"
            :stroke-width="canvas.scale < 0.5 ? 1 : 2"
            fill="none"
            marker-end="url(#arrowhead)"
            vector-effect="non-scaling-stroke"
            :style="{
              opacity: canvas.scale < 0.3 ? 0.6 : 1,
            }"
          />
        </g>
      </svg>

      <!-- Tables -->
      <template v-for="table in tables" :key="table.id">
        <table-node
          :table="table"
          :is-selected="canvas.selectedTable === table.id"
          :scale="canvas.scale"
          @drag-start="handleTableDragStart"
          @drag-move="handleTableDragMove"
          @drag-end="handleTableDragEnd"
        />
      </template>
    </div>

    <!-- Canvas Info Overlay -->
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

    <!-- Mini-map (when zoomed out) -->
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
