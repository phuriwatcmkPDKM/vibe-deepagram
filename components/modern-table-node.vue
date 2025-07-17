<script setup lang="ts">
import { HEADER_HEIGHT, ROW_HEIGHT } from "~/constants";
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

// Computed height based on columns
const calculatedHeight = computed(() => {
  const headerHeight = HEADER_HEIGHT; // Table header height
  const rowHeight = ROW_HEIGHT; // Each column row height
  if (props.table.columns.length <= 2) {
    return headerHeight + props.table.columns.length * rowHeight + 8;
  } else {
    return headerHeight + props.table.columns.length * rowHeight + 2;
  }
});

// Dragging state
const isDragging = ref(false);
const dragStartPos = ref({ x: 0, y: 0 });
const initialTablePos = ref({ x: 0, y: 0 });

const startDrag = (event: MouseEvent): void => {
  event.preventDefault();
  event.stopPropagation();

  isDragging.value = true;
  dragStartPos.value = { x: event.clientX, y: event.clientY };
  initialTablePos.value = { x: props.table.x, y: props.table.y };

  emit("dragStart", props.table.id);

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};

const onMouseMove = (event: MouseEvent) => {
  if (!isDragging.value) return;

  event.preventDefault();

  const schemaStore = useSchemaStore();
  const canvas = schemaStore.canvas;

  const deltaX = event.clientX - dragStartPos.value.x;
  const deltaY = event.clientY - dragStartPos.value.y;

  const scaledDeltaX = deltaX / canvas.scale;
  const scaledDeltaY = deltaY / canvas.scale;

  const newX = initialTablePos.value.x + scaledDeltaX;
  const newY = initialTablePos.value.y + scaledDeltaY;

  emit("dragMove", {
    tableId: props.table.id,
    x: newX,
    y: newY,
  });
};

const onMouseUp = () => {
  if (!isDragging.value) return;

  isDragging.value = false;
  emit("dragEnd");

  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
};
</script>

<template>
  <div
    :style="{
      width: `${table.width}px`,
      height: `${calculatedHeight}px`,
    }"
    class="w-full h-full rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-move select-none bg-white border-2 border-gray-200 overflow-hidden"
    :class="{
      'border-primary/60 shadow-primary-100': isSelected,
    }"
    @mousedown="startDrag"
  >
    <!-- Table Header -->
    <div
      class="px-4 py-3 rounded-t-md bg-gradient-to-r from-ci-primary to-ci-secondary text-white"
    >
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-sm bg-white/50" />
        <h3 class="font-semibold text-base">{{ table.name }}</h3>
      </div>
    </div>

    <!-- Columns -->
    <div class="divide-y divide-gray-100">
      <div
        v-for="(column, index) in table.columns"
        :key="index"
        class="px-4 py-2.5 transition-colors hover:bg-gray-50"
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
      </div>
    </div>
  </div>
</template>
