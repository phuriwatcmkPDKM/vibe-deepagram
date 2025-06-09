<script setup lang="ts">
import type { Table, DragMoveEvent } from "~/types/schema";

interface Props {
  table: Table;
  isSelected?: boolean;
}

interface Emits {
  (e: "dragStart", tableId: string): void;
  (e: "dragMove", event: DragMoveEvent): void;
  (e: "dragEnd"): void;
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
});

const emit = defineEmits<Emits>();

const { pressed: isPressed } = useMousePressed();
const { x: mouseX, y: mouseY } = useMouse();

let dragOffset = { x: 0, y: 0 };
let isDragging = false;

const startDrag = (event: MouseEvent): void => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  dragOffset = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
  isDragging = true;
  emit("dragStart", props.table.id);
};

watch([mouseX, mouseY, isPressed], ([newX, newY, pressed]) => {
  if (!pressed) {
    if (isDragging) {
      isDragging = false;
      emit("dragEnd");
    }
    return;
  }

  if (isDragging) {
    const canvasRect = document
      .querySelector(".schema-canvas")
      ?.getBoundingClientRect();
    if (canvasRect) {
      const newTableX = newX - canvasRect.left - dragOffset.x;
      const newTableY = newY - canvasRect.top - dragOffset.y;

      emit("dragMove", {
        tableId: props.table.id,
        x: newTableX,
        y: newTableY,
      });
    }
  }
});
</script>

<template>
  <div
    :style="{
      transform: `translate(${table.x}px, ${table.y}px)`,
      width: `${table.width}px`,
    }"
    class="absolute bg-white border-2 border-gray-200 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-move select-none z-10"
    :class="{ 'border-primary-500 shadow-primary-100': isSelected }"
    @mousedown="startDrag"
  >
    <!-- Table Header -->
    <div
      class="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-3 rounded-t-md"
    >
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 bg-white/20 rounded-sm" />
        <h3 class="font-semibold text-sm">{{ table.name }}</h3>
      </div>
    </div>

    <!-- Columns -->
    <div class="divide-y divide-gray-100">
      <div
        v-for="(column, index) in table.columns"
        :key="index"
        class="px-4 py-2.5 hover:bg-gray-50 transition-colors"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <!-- Key Indicators -->
            <div class="flex gap-1">
              <span
                v-if="column.isPrimary"
                class="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-amber-500 rounded"
              >
                PK
              </span>
              <span
                v-if="column.isForeign"
                class="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-emerald-500 rounded"
              >
                FK
              </span>
            </div>

            <span class="text-sm font-medium text-gray-900">{{
              column.name
            }}</span>
          </div>

          <div class="text-xs text-gray-500">
            {{
              column.length ? `${column.type}(${column.length})` : column.type
            }}
          </div>
        </div>

        <!-- Constraints -->
        <div v-if="column.isUnique || column.isNotNull" class="flex gap-1 mt-1">
          <span
            v-if="column.isUnique"
            class="inline-flex px-1.5 py-0.5 text-xs font-medium text-blue-800 bg-blue-100 rounded"
          >
            UNIQUE
          </span>
          <span
            v-if="column.isNotNull"
            class="inline-flex px-1.5 py-0.5 text-xs font-medium text-red-800 bg-red-100 rounded"
          >
            NOT NULL
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
