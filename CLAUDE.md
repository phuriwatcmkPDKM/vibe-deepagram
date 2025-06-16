# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Nuxt 3 application called "vibe-deepagram" that provides a visual database schema designer. The application allows users to import database schema data (CSV format) and visualize it as an interactive canvas with draggable tables and relationship connections.

## Development Commands

**Package Manager**: This project uses `pnpm` (preferred)

- **Install dependencies**: `pnpm install`
- **Development server**: `pnpm dev` (runs on http://localhost:3000)
- **Build**: `pnpm build`
- **Preview production build**: `pnpm preview`
- **Run tests**: `pnpm test` (uses Vitest)
- **Lint**: ESLint is configured via @nuxt/eslint module
- **Type checking**: TypeScript checking is enabled in nuxt.config.ts

## Core Architecture

### State Management
- **Pinia Store**: `stores/schema-store.ts` - Central state management for:
  - `tables[]` - Array of database tables with positions and metadata
  - `relationships[]` - Array of foreign key relationships between tables
  - `canvas` - Canvas state (pan, zoom, drag states, selected table)

### Key Data Flow
1. User imports CSV schema data via `import-modal.vue`
2. `parseSchemaData()` in schema store processes CSV into table/column objects
3. Tables are positioned on canvas using automatic grid layout
4. `schema-canvas.vue` renders interactive canvas with draggable tables
5. `table-node.vue` renders individual table components

### Type Definitions
- `types/schema.ts` - Core interfaces:
  - `Table`, `Column`, `Relationship` - Database schema types
  - `CanvasState` - Canvas interaction state
  - `SchemaData` - Raw CSV parsing interface

### CSV Schema Format
Expected format: `database,schema,table,column,position,datatype,length,constraints,foreignTable,foreignColumn`

### Canvas Features
- **Pan**: Mouse drag on empty canvas areas
- **Zoom**: Ctrl/Cmd + mouse wheel, or keyboard shortcuts (+ / - / 0)
- **Table Drag**: Click and drag individual tables
- **Keyboard Shortcuts**: 
  - Ctrl/Cmd + Plus: Zoom in
  - Ctrl/Cmd + Minus: Zoom out  
  - Ctrl/Cmd + 0: Fit to screen
  - Ctrl/Cmd + 1: Reset to 100%

## Tech Stack

- **Framework**: Nuxt 3 with Vue 3 Composition API
- **Styling**: Tailwind CSS v4 with custom CSS variables
- **State**: Pinia for state management
- **Utilities**: VueUse for mouse/keyboard interactions
- **Testing**: Vitest with @nuxt/test-utils
- **TypeScript**: Enabled with strict type checking
- **Icons**: @nuxt/icon module

## Testing Strategy

- Test files located in `stores/` directory alongside implementation
- Uses Vitest with Nuxt environment
- Test configuration in `vitest.config.ts`
- Coverage available via @vitest/coverage-v8

## Canvas Layout Logic

Tables are auto-positioned using:
- 3-column grid layout (index % 3 for x-position)
- 300px horizontal spacing between columns
- 280px vertical spacing between rows
- Initial offset: (100, 100)