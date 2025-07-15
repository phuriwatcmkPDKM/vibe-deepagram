<script setup lang="ts">
import type { Table, CanvasState } from "~/types/schema";

interface Props {
  tables: Table[];
  canvas: CanvasState;
  containerRect: DOMRect | null;
}

const props = defineProps<Props>();
const schemaStore = useSchemaStore();

// Check if zoom controls should be disabled
const canZoomIn = computed(() => props.canvas.scale < 3);
const canZoomOut = computed(() => props.canvas.scale > 0.1);
const hasTables = computed(() => props.tables.length > 0);

// Zoom control functions
const zoomIn = () => {
  if (canZoomIn.value) {
    const newScale = Math.min(props.canvas.scale * 1.2, 3);
    schemaStore.updateCanvasScale(newScale);
  }
};

const zoomOut = () => {
  if (canZoomOut.value) {
    const newScale = Math.max(props.canvas.scale * 0.8, 0.1);
    schemaStore.updateCanvasScale(newScale);
  }
};

const resetZoom = () => {
  schemaStore.updateCanvasState({ scale: 1, panX: 0, panY: 0 });
};

const fitToScreen = () => {
  if (props.tables.length === 0) {
    resetZoom();
    return;
  }

  const padding = 100;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  props.tables.forEach((table: Table) => {
    minX = Math.min(minX, table.x);
    minY = Math.min(minY, table.y);
    maxX = Math.max(maxX, table.x + table.width);
    maxY = Math.max(maxY, table.y + table.height);
  });

  const contentWidth = maxX - minX + padding * 2;
  const contentHeight = maxY - minY + padding * 2;

  if (props.containerRect) {
    const scaleX = props.containerRect.width / contentWidth;
    const scaleY = props.containerRect.height / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 1);

    const panX = (props.containerRect.width - (maxX + minX) * newScale) / 2;
    const panY = (props.containerRect.height - (maxY + minY) * newScale) / 2;

    schemaStore.updateCanvasState({ scale: newScale, panX, panY });
  }
};

// Get current zoom percentage for display
const zoomPercentage = computed(() => Math.round(props.canvas.scale * 100));

// Show different tooltip text based on zoom state
const resetZoomTooltip = computed(() => {
  if (zoomPercentage.value === 100) {
    return "Already at 100% (Ctrl/Cmd + 1)";
  }
  return `Reset to 100% (Ctrl/Cmd + 1) - Currently ${zoomPercentage.value}%`;
});

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
</script>

<template>
  <div class="absolute bottom-6 right-6 flex flex-col gap-2 z-20">
    <div
      class="bg-white rounded-lg shadow-lg p-1 flex flex-col gap-1 transition-all duration-200 hover:shadow-xl"
    >
      <!-- Zoom In Button -->
      <button
        :disabled="!canZoomIn"
        class="w-10 h-10 bg-white border-0 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center text-lg font-bold text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        title="Zoom In (Ctrl/Cmd + Plus)"
        @click="zoomIn"
      >
        <span class="select-none">+</span>
      </button>

      <!-- Zoom Out Button -->
      <button
        :disabled="!canZoomOut"
        class="w-10 h-10 bg-white border-0 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center text-lg font-bold text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        title="Zoom Out (Ctrl/Cmd + Minus)"
        @click="zoomOut"
      >
        <span class="select-none">−</span>
      </button>

      <!-- Separator -->
      <div class="w-full h-px bg-gray-200 my-1" />

      <!-- Fit to Screen Button -->
      <button
        :disabled="!hasTables"
        class="px-3 py-2 bg-white border-0 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        title="Fit to Screen (Ctrl/Cmd + 0)"
        @click="fitToScreen"
      >
        <span class="select-none">Fit</span>
      </button>

      <!-- Reset Zoom Button -->
      <button
        class="px-3 py-2 bg-white border-0 rounded-md hover:bg-gray-100 transition-all text-xs font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        :class="{ 'bg-blue-50 text-blue-700': zoomPercentage === 100 }"
        :title="resetZoomTooltip"
        @click="resetZoom"
      >
        <span class="select-none">{{ zoomPercentage }}%</span>
      </button>
    </div>
  </div>
</template>
