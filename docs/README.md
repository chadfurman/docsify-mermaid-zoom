# docsify-mermaid-zoom Demo

Interactive mermaid diagrams for [docsify](https://docsify.js.org/) with zoom, pan, resize, and fullscreen.

## Simple Flowchart

A basic decision flow. Try **pinch-to-zoom** (trackpad) or **Ctrl+scroll** (mouse) to zoom in and out. Click and drag to pan around.

```mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> E[Check console]
    E --> F{Found the bug?}
    F -->|Yes| G[Fix it]
    F -->|No| H[Add more logs]
    H --> E
    G --> C
```

## Sequence Diagram

A medium-complexity sequence diagram showing how the plugin initializes. Drag the **bottom-right corner** of the container to resize it vertically.

```mermaid
sequenceDiagram
    participant Page as Docsify Page
    participant Plugin as mermaid-zoom
    participant Mermaid as Mermaid.js
    participant SPZ as svg-pan-zoom

    Page->>Plugin: doneEach hook fires
    Plugin->>Plugin: Wait for renderDelay (300ms)
    Plugin->>Mermaid: Query .mermaid elements
    Mermaid-->>Plugin: Return rendered SVGs

    loop Each diagram
        Plugin->>Plugin: Create zoom container
        Plugin->>Plugin: Compute aspect ratio
        Plugin->>SPZ: Initialize svg-pan-zoom
        SPZ-->>Plugin: Return panZoom instance
        Plugin->>Plugin: Add controls (zoom, reset, fullscreen)
        Plugin->>Plugin: Attach ResizeObserver
    end

    Note over Plugin,SPZ: Pinch/Ctrl+scroll to zoom<br/>Drag to pan<br/>Resize from corner
```

## Complex Graph with Subgraphs

A larger diagram that benefits from zoom. Click the **fullscreen button** (top-right corner) to expand the diagram to fill your screen. Press **ESC** to exit.

```mermaid
graph TB
    subgraph Frontend
        UI[Web UI] --> API[API Gateway]
        Mobile[Mobile App] --> API
    end

    subgraph Services
        API --> Auth[Auth Service]
        API --> Users[User Service]
        API --> Orders[Order Service]
        API --> Products[Product Service]

        Auth --> AuthDB[(Auth DB)]
        Users --> UserDB[(User DB)]
        Orders --> OrderDB[(Order DB)]
        Products --> ProductDB[(Product DB)]
    end

    subgraph Messaging
        Orders --> Queue[Message Queue]
        Queue --> Notify[Notification Service]
        Queue --> Analytics[Analytics Service]
        Queue --> Inventory[Inventory Service]
    end

    subgraph External
        Notify --> Email[Email Provider]
        Notify --> SMS[SMS Provider]
        Notify --> Push[Push Notifications]
        Analytics --> DW[Data Warehouse]
        Inventory --> ERP[ERP System]
    end

    subgraph Monitoring
        Metrics[Metrics Collector] --> Dashboard[Dashboard]
        Logs[Log Aggregator] --> Dashboard
        Traces[Trace Collector] --> Dashboard
    end

    Services -.-> Monitoring
    Messaging -.-> Monitoring
```

## Features

| Feature | How to use |
|---------|-----------|
| **Zoom** | Pinch (trackpad) or Ctrl+scroll (mouse wheel) |
| **Pan** | Click and drag inside the diagram |
| **Resize** | Drag the bottom-right corner of the container |
| **Fullscreen** | Click the expand button in the top-right controls |
| **Reset** | Click the reset button to fit and center |
| **Zoom buttons** | Use + and - buttons for precise zoom |

## Installation

Just two lines — the plugin auto-loads mermaid and svg-pan-zoom:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@chadfurman/docsify-mermaid-zoom@2/dist/docsify-mermaid-zoom.css">
<script src="https://cdn.jsdelivr.net/npm/@chadfurman/docsify-mermaid-zoom@2/dist/docsify-mermaid-zoom.js"></script>
```

Or install via npm:

```bash
npm install @chadfurman/docsify-mermaid-zoom
```

See the full [README](https://github.com/chadfurman/docsify-mermaid-zoom) for configuration options.
