<script setup lang="ts">
import type { Table, CanvasState } from "~/types/schema";

interface Props {
  tables: Table[];
  canvas: CanvasState;
  containerRect: DOMRect | null;
}

const props = defineProps<Props>();

// Calculate viewBox for the minimap
const minimapViewBox = computed(() => {
  if (props.tables.length === 0) return "0 0 100 100";

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  props.tables.forEach((table) => {
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

// Calculate viewport rectangle for the minimap
const viewportRect = computed(() => {
  if (!props.containerRect) return { x: 0, y: 0, width: 100, height: 100 };

  return {
    x: -props.canvas.panX / props.canvas.scale,
    y: -props.canvas.panY / props.canvas.scale,
    width: props.containerRect.width / props.canvas.scale,
    height: props.containerRect.height / props.canvas.scale,
  };
});

// Get table style based on mode and selection
const getTableStyle = (table: Table) => {
  const isSelected = props.canvas.selectedTable === table.id;

  if (props.canvas.isClassicMode) {
    return {
      fill: isSelected ? "#000000" : "#ffffff",
      stroke: isSelected ? "#374151" : "#000000",
      strokeWidth: isSelected ? "2" : "1",
    };
  } else {
    return {
      fill: isSelected ? "#3b82f6" : "#e5e7eb",
      stroke: isSelected ? "#1d4ed8" : "#9ca3af",
      strokeWidth: isSelected ? "2" : "1",
    };
  }
};
</script>

<template>
  <div
    v-if="tables.length > 0"
    class="bg-white/95 border border-gray-200 absolute top-4 right-4 w-48 h-32 backdrop-blur-sm rounded-lg shadow-lg z-20 overflow-hidden transition-all duration-200 hover:shadow-xl"
  >
    <!-- Header -->
    <div
      class="p-2 text-xs font-medium border-b transition-colors duration-200"
      :class="{
        'text-gray-600 border-gray-200 bg-gray-50/50': !canvas.isClassicMode,
        'text-gray-700 border-gray-300 bg-blue-100/50': canvas.isClassicMode,
      }"
    >
      <div class="flex items-center justify-between">
        <span>Overview</span>
        <span class="text-[10px] text-gray-500"
          >{{ tables.length }} tables</span
        >
      </div>
    </div>

    <!-- Minimap Content -->
    <div
      class="relative w-full h-24 transition-colors duration-200"
      :class="{
        'bg-gray-50': !canvas.isClassicMode,
        'bg-blue-50': canvas.isClassicMode,
      }"
    >
      <svg class="absolute inset-0 w-full h-full" :viewBox="minimapViewBox">
        <!-- Tables -->
        <g v-for="table in tables" :key="table.id">
          <rect
            :x="table.x"
            :y="table.y"
            :width="table.width"
            :height="table.height"
            :fill="getTableStyle(table).fill"
            :stroke="getTableStyle(table).stroke"
            :stroke-width="getTableStyle(table).strokeWidth"
            rx="4"
            class="transition-all duration-150"
          />
        </g>

        <!-- Viewport indicator -->
        <rect
          :x="viewportRect.x"
          :y="viewportRect.y"
          :width="viewportRect.width"
          :height="viewportRect.height"
          :fill="
            canvas.isClassicMode
              ? 'rgba(0, 0, 0, 0.1)'
              : 'rgba(59, 130, 246, 0.1)'
          "
          :stroke="canvas.isClassicMode ? '#374151' : '#3b82f6'"
          stroke-width="2"
          rx="2"
          class="transition-all duration-200"
        />
      </svg>
    </div>
  </div>
</template>
