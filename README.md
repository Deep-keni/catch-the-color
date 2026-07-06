# Catch the Color 🎮⚡

**Catch the Color** is a premium, fast-paced reflex testing browser game built with vanilla HTML, CSS, and JavaScript. The objective is simple: tap only the circles that match the target color shown at the top, avoid wrong colors, and don't let the target color slip away!

---

## 🚀 Key Features

*   **Tactile Neon Visuals**: Features custom cosmic radial gradients, glassmorphic UI elements, and vibrant glowing neon circle indicators.
*   **Precision Tap Detection**: Engineered using element metadata (`data-*` attributes) and absolute timeout cancellations to prevent stale event evaluation or race conditions.
*   **Euclidean Collision Prevention**: Circles automatically detect spatial proximity to existing on-screen targets and reject overlapping coordinates, keeping the screen clean and playable.
*   **Progressive Difficulty Scaling**: The game speed dynamically adjusts as your score increases, dropping spawn intervals and lifetime durations at key thresholds.
*   **Reflex Analytics**: Tracks total survival duration and computes your average reaction speed down to the millisecond, saving your **Personal Best (High Score)** to local browser storage (`localStorage`).

---

## 📈 Progressive Difficulty Thresholds

The pace of spawns and the lifespan of the targets scale dynamically:

| Score Range | Difficulty | Spawn Interval | Circle Lifetime (Visible-Time) |
| :--- | :--- | :--- | :--- |
| **0 – 10** | Normal | `1200ms` | `1000ms` |
| **11 – 15** | Moderate | `1000ms` | `850ms` |
| **16 – 25** | Hard | `750ms` | `600ms` |
| **26+** | Expert | `480ms` | `400ms` |

---

## 🛠️ File Structure

The project maintains a clean, framework-free structure:
```text
Reflex_Tester/
├── index.html     # Welcome Card, Instructions & Entry Point
├── game.html      # Play Area, Live Score Bar & Spawner
├── result.html    # Game Over Summary, Reflex Stats & Navigation
├── style.css      # Custom Fonts (Poppins), Glassmorphic styles & CSS Transitions
└── script.js     # Spawner Loop, State Management, localStorage & Difficulty Engine
