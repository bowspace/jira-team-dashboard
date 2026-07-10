# Use @dnd-kit for Weekly kanban drag-and-drop

**Status**: accepted

The Roadmap Weekly view's kanban board (Plan / In Progress / Release) needs drag-and-drop to move cards between columns. We chose `@dnd-kit/core` over the native HTML5 Drag and Drop API and over `react-beautiful-dnd`.

**Why not native HTML5 DnD**: it has no real touch/mobile support without significant polyfill work, and this app has a mobile bottom nav — dragging needs to work on phones, not just desktop mouse.

**Why not react-beautiful-dnd**: unmaintained since 2022, with known breakage under React 18+ StrictMode, which this app uses (`main.jsx`). Don't reintroduce it even though it's still the library most people reach for by name.

`@dnd-kit` is actively maintained, has real pointer/touch sensor support, and works cleanly with React 19 function components.
