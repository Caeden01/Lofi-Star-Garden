# 🌌 Lofi Star-Garden

> An idle, atmospheric sandbox game built with React. Cultivate a bioluminescent garden in the middle of a quiet, starry void, set to an endless procedurally-generated lofi beat.

![Lofi Star-Garden Gameplay](https://via.placeholder.com/800x400/0f172a/38bdf8?text=Lofi+Star-Garden+Screenshot) 
*(Note: Replace this link with an actual screenshot or GIF of your game!)*

## ✨ About the Project

**Lofi Star-Garden** is an experiment in "vibe coding." The goal wasn't to build complex mechanics or stressful fail-states, but rather an interactive, audio-visual toy that feels good to use and can peacefully run on a second monitor while you work.

The standout feature of this project is the **Custom Web Audio API Sequencer**. There are no MP3s or audio files in this repository. Instead, the game features a built-in synthesizer that mathematically schedules a 4-bar lofi chord progression, synthesized drums, and an ambient melody. Furthermore, **every interaction sound (clicking, planting, harvesting) dynamically harmonizes with the chord currently playing in the background.**

## 🎮 Features

* **Bioluminescent Botany:** Plant Star Sprouts, Nebula Blooms, Void Trees, and Moon Ferns. Watch them grow in real-time with CSS-powered neon glows.
* **Idle Mechanics:** Mature plants generate passive Stardust over time.
* **Procedural Lofi Engine:** A zero-dependency 80-BPM beat generator utilizing JavaScript lookahead scheduling for perfect timing.
* **Dynamic Harmonics:** Interaction sounds act like a live guitar solo, dynamically grabbing notes from the current background chord.
* **Aesthetic UI:** Built entirely with Tailwind CSS, featuring glassmorphism, deep space gradients, and CSS particle animations.

## 🛠️ Tech Stack

* **Framework:** [React 18+](https://react.dev/) (Functional Components & Hooks)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Audio:** Native Web Audio API (`window.AudioContext`)

## 🚀 How to Run Locally

You can run this project easily using [Vite](https://vitejs.dev/). 

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/yourusername/lofi-star-garden.git](https://github.com/yourusername/lofi-star-garden.git)
   cd lofi-star-garden
