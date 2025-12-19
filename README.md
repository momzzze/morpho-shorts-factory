# Morpho Shorts Factory

🎬 An experimental platform for building an automated short-form video pipeline.

This project focuses on turning long-form video into short, vertical clips through a clean, scalable pipeline.  
It intentionally starts **without heavy AI dependencies**, while being designed to **evolve naturally with AI features** when they add real value.

---

## What this is

Morpho Shorts Factory is both:

- a **working MVP** for short-form video automation  
- a **playground** for experimenting with video processing, queues, storage, and AI-assisted workflows  

The philosophy is simple:  
**ship something useful first, then make it smarter over time.**

---

## Core goals

- ⚙️ Build a reliable video pipeline using Node.js and FFmpeg  
- 🧱 Keep architecture clean and modular  
- 🤖 Treat AI as an optional enhancement, not a requirement  
- 📦 Support local and cloud storage transparently  
- 🚀 Scale via queues and workers, not monolith logic  

---

## High-level pipeline

1. **Ingest**
   - Upload video file or register external URL
   - Attach license metadata (owned, public domain, CC)

2. **Analyze**
   - Scene detection (shot boundaries)
   - Audio peak detection
   - Generate candidate time windows (e.g. 20–45s)

3. **Review**
   - Manually approve or tweak candidate clips
   - Select template and basic overlay options

4. **Render**
   - Vertical format (1080x1920)
   - Background blur / fill
   - Text overlays / watermarking

5. **Export / Upload**
   - Save renders
   - Upload to platforms (initially private)

---

## Architecture overview

### Backend (Node.js – core system)

- **API**: Express
- **Workers**: RabbitMQ consumers
- **Video processing**: FFmpeg
- **Database**: PostgreSQL + Prisma
- **Queue**: Redis + BullMQ
- **Storage**: Pluggable (local filesystem or S3)

All non-blocking work (analysis, rendering, uploads) runs in workers.

---

## Storage abstraction

A single interface supports multiple backends:

- Local storage (development)
- S3-compatible storage (production)

Switchable via config:

```env
STORAGE_DRIVER=local | s3
