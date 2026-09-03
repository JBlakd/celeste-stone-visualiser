# Celeste Stone Visualiser

Interactive 3D surface visualiser for [Celeste Stone](https://celestestone.com.au), built to preview engineered stone slabs in realistic kitchen environments.

The visualiser allows users to switch between kitchen scenes and independently apply Celeste Stone designs to configurable surfaces such as benchtops and splashbacks. Stone textures are mapped using UV coordinates prepared in Blender so slab veining can be displayed at a realistic physical scale rather than simply stretched across each surface.

## Features

- Interactive 3D kitchen environments
- Real-time Celeste Stone slab selection
- Independent stone selection for multiple configurable surfaces
- Material-based surface detection using named GLB materials
- Physically scaled slab UV mapping
- Support for waterfall edges, joins, bookmatching and deliberate slab placement through Blender UVs
- Multiple kitchen/model selection
- Orbit, zoom and free camera navigation
- HDR environment lighting and soft shadows
- Responsive controls for desktop, portrait mobile and landscape mobile
- Mobile-specific rendering and texture optimisations
- Collapsible interface to maximise the 3D viewing area
- External model and texture delivery through Cloudflare R2

## Live Visualiser

https://visualiser.celestestone.com.au

## Tech Stack

- React 19
- TypeScript
- Three.js
- React Three Fiber
- React Three Drei
- Vite
- Cloudflare
- Cloudflare R2
- Blender for model preparation and UV mapping

## Project Structure

```text
src/
├── components/
│   ├── Model.tsx
│   ├── ModelSelector.tsx
│   ├── Scene.tsx
│   └── SlabSelector.tsx
├── data/
│   ├── models.json
│   ├── models.ts
│   ├── slabs.json
│   ├── slabs.ts
│   └── surface.ts
├── hooks/
│   └── useIsMobile.ts
├── three/
│   ├── meshUtils.ts
│   └── textures.ts
├── App.css
├── App.tsx
├── index.css
└── main.tsx
```

Large runtime assets such as `.glb` kitchen models and slab texture images are hosted separately rather than committed to the repository.

## Surface Convention

Configurable surfaces are identified using material names embedded in the GLB.

For example:

```text
STONE_BENCHTOP
STONE_SPLASHBACK
CABINETRY
FLOOR
```

Slab-configurable surfaces are defined centrally in `src/data/surface.ts`.

A Blender model intended for use in the visualiser should assign the appropriate material name to every configurable surface before export.

The application then detects those materials when the GLB is loaded and replaces their runtime materials with the selected Celeste Stone texture.

This keeps scene-specific geometry and UV information inside the model while keeping slab selection logic generic.

## Slab Data

Available stone designs are defined in:

```text
src/data/slabs.json
```

A slab entry contains information such as:

```json
{
  "id": "taj-mahal",
  "sku": "CSF9070",
  "name": "Taj Mahal",
  "level": 3,
  "texture": "https://visualiser-assets.celestestone.com.au/slabs/CSF9070-Taj_Mahal.webp"
}
```

Slab images represent full-size Celeste Stone slabs.

Where physical-scale UV mapping is used, the image is treated as representing a:

```text
3200 mm × 1600 mm
```

slab.

## Model Data

Available visualiser scenes are defined in:

```text
src/data/models.json
```

GLB files are hosted externally and loaded at runtime.

Keeping model metadata in Git while hosting large binary assets separately keeps the repository lightweight and makes models easier to update independently.

## Preparing a Model in Blender

The basic model preparation workflow is:

1. Import or prepare the kitchen model in Blender.
2. Confirm the scene geometry is correctly scaled.
3. Clean unnecessary or problematic geometry where required.
4. Separate or identify configurable surfaces.
5. Assign the appropriate material names, such as `STONE_BENCHTOP` and `STONE_SPLASHBACK`.
6. UV-map stone surfaces against a 3200 × 1600 mm slab reference.
7. Position individual UV islands to represent realistic slab cuts, joins or bookmatching.
8. Export the scene as `.glb`.
9. Upload the GLB to the visualiser asset store.
10. Add or update the corresponding entry in `models.json`.

### UV Mapping

UV mapping is intentionally handled in Blender rather than calculated at runtime.

This means the model itself controls:

- stone scale
- vein direction
- cut location
- joins
- waterfall continuity
- bookmatching
- the relationship between separate fabricated pieces

The web application only changes which slab texture is applied.

This avoids having scene-specific fabrication logic hard-coded into React or Three.js.

## Adding a New Slab

1. Upload the slab image to the asset store.
2. Add an entry to `src/data/slabs.json`.
3. Commit and deploy.

No changes to the renderer are required.

## Adding a New Stone Surface Type

Add the surface role to the central surface configuration in:

```text
src/data/surface.ts
```

For example:

```ts
StoneVanity = "STONE_VANITY";
```

Add it to the slab-configurable surface list with its UI label, then assign the same material name to the relevant geometry in Blender.

The surface selection UI and slab assignment system are designed to work from this shared configuration rather than requiring separate controls for every surface type.

## Development

### Requirements

- Node.js
- npm

### Install

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

The Vite development server normally runs at:

```text
http://localhost:5173
```

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

### Fix Lint Issues

```bash
npm run lint:fix
```

### Type Check

```bash
npm run type-check
```

## Asset Hosting

Large assets are served from:

```text
https://visualiser-assets.celestestone.com.au
```

This includes:

- kitchen GLB models
- full-resolution slab textures

The asset domain must permit cross-origin requests from the visualiser domain so Three.js can load images as WebGL textures.

## Mobile Performance

Mobile devices use reduced rendering settings to limit GPU and memory pressure.

Optimisations include:

- reduced device pixel ratio
- reduced shadow quality
- reduced shadow sampling
- lower texture anisotropy
- disabled mipmap generation for dynamically loaded slab textures
- disposal of replaced slab textures
- mobile detection that continues to work when a device is rotated into landscape

## Architecture

The project deliberately separates three concerns:

```text
Blender / GLB
    ↓
geometry + UV layout + surface names

JSON data
    ↓
available models + available slabs

React / Three.js
    ↓
selection UI + rendering + dynamic texture assignment
```

The renderer therefore does not need to know how a particular kitchen was fabricated.

If the GLB uses the expected surface naming convention and contains suitable UVs, it can use the same generic visualiser code.

## Background

This repository began as a fork of `gorhorvat/product-configurator-3d` and has since been substantially simplified and repurposed as a dedicated stone-surface visualisation application for Celeste Stone.
