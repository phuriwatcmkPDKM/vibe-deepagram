<template>
  <div class="relative w-full h-full overflow-hidden bg-gray-50 schema-canvas">
    <!-- Grid Background -->
    <div
      class="absolute inset-0 opacity-60"
      :style="{
        backgroundImage: `
          linear-gradient(rgba(156, 163, 175, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(156, 163, 175, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: `${20 * canvas.scale}px ${20 * canvas.scale}px`,
        backgroundPosition: `${canvas.panX}px ${canvas.panY}px`,
      }"
    />

    <!-- Canvas Container -->
    <div
      ref="canvasRef"
      class="absolute inset-0 cursor-grab active:cursor-grabbing"
      :style="{
        transform: `translate(${canvas.panX}px, ${canvas.panY}px) scale(${canvas.scale})`,
      }"
      @mousedown="startPan"
      @wheel.prevent="handleWheel"
    >
      <!-- Relationship Lines SVG -->
      <svg
        class="absolute inset-0 pointer-events-none z-0"
        :width="canvasSize.width"
        :height="canvasSize.height"
        :viewBox="`0 0 ${canvasSize.width} ${canvasSize.height}`"
        style="overflow: visible"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
          </marker>
        </defs>

        <g v-for="relationship in relationships" :key="relationship.id">
          <path
            :d="getRelationshipPath(relationship)"
            stroke="#3b82f6"
            stroke-width="2"
            fill="none"
            marker-end="url(#arrowhead)"
          />
        </g>
      </svg>

      <!-- Tables -->
      <table-node
        v-for="table in tables"
        :key="table.id"
        :table="table"
        :is-selected="canvas.selectedTable === table.id"
        @drag-start="handleTableDragStart"
        @drag-move="handleTableDragMove"
        @drag-end="handleTableDragEnd"
      />
    </div>

    <!-- Zoom Controls -->
    <div class="absolute bottom-6 right-6 flex flex-col gap-2 z-20">
      <button
        class="w-10 h-10 bg-white border border-gray-300 rounded-full shadow-md hover:shadow-lg transition-shadow flex items-center justify-center text-lg font-bold text-gray-700 hover:text-gray-900"
        @click="zoomIn"
      >
        +
      </button>
      <button
        class="w-10 h-10 bg-white border border-gray-300 rounded-full shadow-md hover:shadow-lg transition-shadow flex items-center justify-center text-lg font-bold text-gray-700 hover:text-gray-900"
        @click="zoomOut"
      >
        −
      </button>
      <button
        class="px-3 py-2 bg-white border border-gray-300 rounded-md shadow-md hover:shadow-lg transition-shadow text-xs font-medium text-gray-700 hover:text-gray-900"
        @click="fitToScreen"
      >
        Fit
      </button>
    </div>
  </div>
</template>

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
const canvasSize = reactive<CanvasSize>({ width: 4000, height: 4000 });

const { pressed: isPressed } = useMousePressed();
const { x: mouseX, y: mouseY } = useMouse();

let panStart: PanStart = { x: 0, y: 0 };
let isPanning = false;

const startPan = (event: MouseEvent): void => {
  const target = event.target as HTMLElement;
  if (
    target === canvasRef.value ||
    target.closest(".schema-canvas") === event.currentTarget
  ) {
    isPanning = true;
    panStart = {
      x: event.clientX - canvas.value.panX,
      y: event.clientY - canvas.value.panY,
    };
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

  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
  const newScale = Math.max(0.1, Math.min(3, canvas.value.scale * zoomFactor));

  if (newScale !== canvas.value.scale) {
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
  const newScale = Math.min(3, canvas.value.scale * 1.2);
  schemaStore.updateCanvasScale(newScale);
};

const zoomOut = (): void => {
  const newScale = Math.max(0.1, canvas.value.scale * 0.8);
  schemaStore.updateCanvasScale(newScale);
};

const fitToScreen = (): void => {
  if (tables.value.length === 0) return;

  const padding = 50;
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

const getRelationshipPath = (relationship: Relationship): string => {
  const fromTable = tables.value.find(
    (t: Table) => t.name === relationship.fromTable
  );
  const toTable = tables.value.find(
    (t: Table) => t.name === relationship.toTable
  );

  if (!fromTable || !toTable) return "";

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

  return `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
};

onMounted(() => {
  nextTick(() => {
    if (canvasRef.value) {
      const rect = canvasRef.value.getBoundingClientRect();
      canvasSize.width = Math.max(rect.width, 4000);
      canvasSize.height = Math.max(rect.height, 4000);
    }
  });

  // Update canvas size on window resize
  window.addEventListener("resize", () => {
    if (canvasRef.value) {
      const rect = canvasRef.value.getBoundingClientRect();
      canvasSize.width = Math.max(rect.width, 4000);
      canvasSize.height = Math.max(rect.height, 4000);
    }
  });
});
</script>
