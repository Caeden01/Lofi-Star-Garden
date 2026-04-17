import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Flower2, TreeDeciduous, Leaf, Volume2, VolumeX, Moon, Shovel } from 'lucide-react';

// --- GAME CONSTANTS & DATA ---
const GRID_SIZE = 6;

const PLANTS = {
  sprout: { 
    id: 'sprout', name: 'Star Sprout', cost: 10, timeToGrow: 5000, income: 1,
    color: 'text-cyan-300', glow: 'shadow-[0_0_15px_rgba(103,232,249,0.5)]',
    icon: Leaf, description: "A quick-growing neon sprout."
  },
  bloom: { 
    id: 'bloom', name: 'Nebula Bloom', cost: 40, timeToGrow: 15000, income: 3,
    color: 'text-fuchsia-400', glow: 'shadow-[0_0_20px_rgba(232,121,249,0.6)]',
    icon: Flower2, description: "Radiates a warm, pink energy."
  },
  tree: { 
    id: 'tree', name: 'Void Tree', cost: 150, timeToGrow: 45000, income: 10,
    color: 'text-indigo-400', glow: 'shadow-[0_0_25px_rgba(129,140,248,0.7)]',
    icon: TreeDeciduous, description: "An ancient, slow-growing cosmic tree."
  },
  fern: {
    id: 'fern', name: 'Moon Fern', cost: 1000, timeToGrow: 90000, income: 50,
    color: 'text-emerald-400', glow: 'shadow-[0_0_20px_rgba(52,211,153,0.6)]',
    icon: Moon, description: "Draws heavy energy from the lunar void."
  }
};

// --- PROCEDURAL MUSIC ENGINE ---
const m2f = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

// Lofi Chord Progression: Cmaj7, Am7, Fmaj9, G13
const CHORDS = [
  [48, 52, 55, 59], // Cmaj7 (C3, E3, G3, B3)
  [45, 48, 52, 55], // Am7   (A2, C3, E3, G3)
  [41, 48, 52, 57], // Fmaj9 (F2, C3, E3, A3)
  [43, 47, 50, 57]  // G13   (G2, B2, D3, A3)
];

class LofiSequencer {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.isPlaying = false;
    this.bpm = 80;
    this.currentStep = 0;
    this.nextNoteTime = 0;
    this.timerID = null;
    this.noiseBuffer = null;
    this.currentChordIndex = 0;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.createNoiseBuffer();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.6; // Master volume
      this.masterGain.connect(this.ctx.destination);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) {
        this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.6, this.ctx.currentTime, 0.1);
    }
    return this.muted;
  }

  createNoiseBuffer() {
    const bufferSize = this.ctx.sampleRate * 2;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }

  start() {
    if (this.isPlaying) return;
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.isPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.scheduler();
  }

  scheduler() {
    // Schedule notes slightly ahead of time for perfect rhythm
    while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
      this.playStep(this.currentStep, this.nextNoteTime);
      this.advanceNote();
    }
    this.timerID = setTimeout(() => this.scheduler(), 25);
  }

  advanceNote() {
    const secondsPerBeat = 60.0 / this.bpm;
    const secondsPer16th = secondsPerBeat / 4;
    this.nextNoteTime += secondsPer16th;
    this.currentStep++;
    if (this.currentStep === 64) {
      this.currentStep = 0; // Loop every 4 bars (64 16th notes)
    }
  }

  playTone(freq, type, time, dur, vol, attack = 0.05) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.value = freq;
    
    filter.type = 'lowpass';
    filter.frequency.value = 1500; // Lofi muffle

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol, time + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + dur);
  }

  playKick(time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.masterGain);
    
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5); // Pitch drop
    
    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
    
    osc.start(time); osc.stop(time + 0.5);
  }

  playHat(time, vol = 0.1) {
    if (!this.noiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 6000;
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    
    noise.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
    noise.start(time); noise.stop(time + 0.1);
  }

  playSnare(time) {
    this.playHat(time, 0.2); // Noise part
    this.playTone(200, 'sine', time, 0.2, 0.2, 0.01); // Thump part
  }

  playStep(step, time) {
    const bar = Math.floor(step / 16);
    this.currentChordIndex = bar % 4;
    const chord = CHORDS[this.currentChordIndex];
    const beat16 = step % 16;

    // --- RHYTHM SECTION ---
    // Kick on 1 and 2.5 (steps 0 and 10)
    if (beat16 === 0 || beat16 === 10) this.playKick(time);
    
    // Snare on 2 and 4 (steps 4 and 12)
    if (beat16 === 4 || beat16 === 12) this.playSnare(time);
    
    // Hi-hats on every 8th note, alternating velocity for groove
    if (beat16 % 2 === 0) {
      this.playHat(time, beat16 % 4 === 0 ? 0.08 : 0.03);
    }

    // --- HARMONIC SECTION ---
    // Play full chord on step 0 and 8 (syncopated)
    if (beat16 === 0 || beat16 === 8) {
      chord.forEach(note => {
        this.playTone(m2f(note), 'sine', time, 2.5, 0.05, 0.2); // Mellow attack
      });
    }

    // Deep bass root note
    if (beat16 === 0 || beat16 === 8) {
      this.playTone(m2f(chord[0] - 12), 'triangle', time, 1.5, 0.15, 0.1);
    }

    // --- GENERATIVE MELODY ---
    // Randomly play notes from the current chord up 1 or 2 octaves
    if (beat16 % 4 === 2 && Math.random() > 0.6) {
      const randomNote = chord[Math.floor(Math.random() * chord.length)];
      this.playTone(m2f(randomNote + 12), 'sine', time, 1.0, 0.04);
      if (Math.random() > 0.8) this.playTone(m2f(randomNote + 24), 'sine', time, 1.0, 0.02); // shimmer
    }
  }

  // Called by user interactions (clicking) - perfectly in key with current chord!
  playInteractionSound(isError = false) {
    if (!this.ctx) return;
    if (isError) {
      this.playTone(150, 'square', this.ctx.currentTime, 0.2, 0.05, 0.01);
      return;
    }
    
    // Grab notes from whatever chord the background music is currently playing
    const chord = CHORDS[this.currentChordIndex];
    const note1 = chord[Math.floor(Math.random() * chord.length)] + 12; // 1 octave up
    const note2 = chord[Math.floor(Math.random() * chord.length)] + 24; // 2 octaves up
    
    // Play a lovely bell sound
    this.playTone(m2f(note1), 'sine', this.ctx.currentTime, 1.5, 0.1, 0.01);
    this.playTone(m2f(note2), 'triangle', this.ctx.currentTime, 2.0, 0.05, 0.01);
  }
}

const synth = new LofiSequencer();

// --- REACT APP COMPONENTS ---

export default function LofiStarGarden() {
  const [started, setStarted] = useState(false);
  const [stardust, setStardust] = useState(25);
  const [selectedSeed, setSelectedSeed] = useState(null);
  const [grid, setGrid] = useState(Array(GRID_SIZE * GRID_SIZE).fill(null));
  const [comets, setComets] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  
  // Background stars generation
  const [bgStars] = useState(() => 
    Array.from({ length: 50 }).map(() => ({
      id: Math.random(),
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      delay: `${Math.random() * 5}s`,
      duration: `${Math.random() * 3 + 2}s`
    }))
  );

  // -- GAME LOGIC --
  const startGame = () => {
    synth.init();
    synth.start();
    setStarted(true);
  };

  const toggleMute = () => {
    setIsMuted(synth.toggleMute());
  };

  // Comet Spawner
  useEffect(() => {
    if (!started) return;
    
    const spawnComet = () => {
      const id = Date.now();
      const startY = Math.random() * 80 + 10;
      const duration = Math.random() * 10000 + 8000;
      
      setComets(prev => [...prev, { id, top: `${startY}%`, duration, size: Math.random() * 1.5 + 0.5 }]);

      setTimeout(() => {
        setComets(prev => prev.filter(c => c.id !== id));
      }, duration);
    };

    const interval = setInterval(spawnComet, Math.random() * 8000 + 4000);
    return () => clearInterval(interval);
  }, [started]);

  // Passive Income Loop
  useEffect(() => {
    if (!started) return;

    const incomeLoop = setInterval(() => {
      setGrid(currentGrid => {
        let tickIncome = 0;
        currentGrid.forEach(cell => {
          if (cell && cell.stage === 'mature') tickIncome += PLANTS[cell.type].income;
        });
        
        if (tickIncome > 0) setStardust(prev => prev + tickIncome);
        return currentGrid;
      });
    }, 1000); // 1 tick per second

    return () => clearInterval(incomeLoop);
  }, [started]);

  // Plant Growth Loop
  useEffect(() => {
    if (!started) return;

    const checkGrowth = setInterval(() => {
      setGrid(prevGrid => {
        let gridChanged = false;
        const newGrid = prevGrid.map(cell => {
          if (!cell || cell.stage === 'mature') return cell;

          const timeElapsed = Date.now() - cell.plantedAt;
          const plantData = PLANTS[cell.type];

          if (timeElapsed >= plantData.timeToGrow) {
            gridChanged = true;
            synth.playInteractionSound(); // Play a nice in-key chord when plant matures
            return { ...cell, stage: 'mature' };
          }
          return cell;
        });

        return gridChanged ? newGrid : prevGrid;
      });
    }, 1000);

    return () => clearInterval(checkGrowth);
  }, [started]);

  // Interactions
  const catchComet = (id, e) => {
    e.stopPropagation();
    synth.playInteractionSound();
    setStardust(prev => prev + Math.floor(Math.random() * 5) + 3);
    setComets(prev => prev.filter(c => c.id !== id));
  };

  const handleCellClick = (index) => {
    if (isDeleteMode) {
      if (grid[index] !== null) {
        synth.playInteractionSound(true); // Uproot sound
        const newGrid = [...grid];
        newGrid[index] = null;
        setGrid(newGrid);
      }
      return;
    }

    if (!selectedSeed) return;
    
    const seedData = PLANTS[selectedSeed];
    
    if (grid[index] !== null) {
      synth.playInteractionSound(true); // Error boop
      return; 
    }
    
    if (stardust >= seedData.cost) {
      synth.playInteractionSound();
      setStardust(prev => prev - seedData.cost);
      
      const newGrid = [...grid];
      newGrid[index] = { type: selectedSeed, plantedAt: Date.now(), stage: 'growing' };
      setGrid(newGrid);
      setSelectedSeed(null);
    } else {
      synth.playInteractionSound(true); // Error boop
    }
  };

  // -- RENDERERS --
  if (!started) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200 selection:bg-fuchsia-900/50">
        <div className="text-center space-y-8 p-8 max-w-md backdrop-blur-md bg-slate-900/30 rounded-3xl border border-slate-800 shadow-[0_0_50px_rgba(30,27,75,0.5)]">
          <Moon className="w-16 h-16 mx-auto text-indigo-400 mb-4 animate-pulse" />
          <h1 className="text-4xl font-light tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-fuchsia-400">
            Lofi Star-Garden
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed font-light">
            A quiet place in the void. <br/>
            Catch passing comets for stardust.<br/>
            Cultivate bioluminescent flora.<br/>
            Listen to the generative beat.
          </p>
          <button 
            onClick={startGame}
            className="px-8 py-3 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 transition-all duration-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] tracking-wider uppercase text-sm"
          >
            Enter Garden
          </button>
        </div>
      </div>
    );
  }

  const currentIncome = grid.reduce((sum, cell) => sum + (cell && cell.stage === 'mature' ? PLANTS[cell.type].income : 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 overflow-hidden relative font-sans text-slate-200">
      
      {/* BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none"></div>
      
      {bgStars.map(star => (
        <div 
          key={star.id}
          className="absolute rounded-full bg-white z-0"
          style={{
            left: star.left, top: star.top, width: `${star.size}px`, height: `${star.size}px`,
            opacity: 0.1, animation: `twinkle ${star.duration} infinite alternate ${star.delay}`
          }}
        />
      ))}

      {comets.map(comet => (
        <div
          key={comet.id}
          onClick={(e) => catchComet(comet.id, e)}
          className="absolute z-50 cursor-crosshair group p-8 -m-8"
          style={{ top: comet.top, left: '-10%', animation: `flyRight ${comet.duration}ms linear forwards` }}
        >
          <div className="relative flex items-center">
            <div 
              className="w-3 h-3 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.9)] z-10 group-hover:scale-150 transition-transform duration-300"
              style={{ transform: `scale(${comet.size})` }}
            />
            <div className="absolute left-1 w-24 h-0.5 bg-gradient-to-r from-white/80 to-transparent -translate-y-1/2 blur-[1px]" />
          </div>
        </div>
      ))}

      {/* UI LAYER */}
      <div className="relative z-30 min-h-screen flex flex-col p-6">
        
        {/* Top Bar */}
        <header className="flex justify-between items-center mb-6 lg:mb-12">
          <div className="flex items-center gap-3 bg-slate-900/50 backdrop-blur-md px-6 py-3 rounded-full border border-slate-800 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span className="font-mono text-xl text-cyan-50 tracking-widest">{stardust}</span>
            <span className="text-slate-500 text-xs uppercase tracking-widest ml-2 hidden sm:inline">Stardust</span>
            
            <div className="ml-4 pl-4 border-l border-slate-700 flex items-center gap-1">
              <span className="text-emerald-400 text-xs sm:text-sm font-mono">+{currentIncome}/s</span>
            </div>
          </div>
          
          <button 
            onClick={toggleMute}
            className="p-3 rounded-full bg-slate-900/50 backdrop-blur-md border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-24">
          
          {/* Tool Shop */}
          <div className="flex lg:flex-col gap-3 bg-slate-900/30 p-3 sm:p-4 rounded-3xl backdrop-blur-md border border-slate-800/50 flex-wrap justify-center w-full lg:w-auto">
            
            <button
              onClick={() => {
                synth.playInteractionSound();
                setIsDeleteMode(!isDeleteMode);
                setSelectedSeed(null);
              }}
              className={`relative p-3 sm:p-4 rounded-2xl flex flex-col items-center gap-2 transition-all duration-300 w-20 sm:w-28
                ${isDeleteMode 
                  ? 'bg-red-900/40 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)] scale-105' 
                  : 'bg-slate-800/30 hover:bg-slate-800/50 border-transparent'}
                border
              `}
            >
              <Shovel className={`w-6 h-6 sm:w-8 sm:h-8 text-red-400 ${isDeleteMode ? 'animate-pulse' : ''}`} />
              <div className="text-center hidden sm:block">
                <div className="text-xs text-slate-300 font-medium mb-1">Uproot</div>
                <div className="text-[10px] text-red-400/80">Clear Space</div>
              </div>
            </button>

            <div className="w-px lg:w-full h-12 lg:h-px bg-slate-800 my-1 rounded-full" />

            {Object.values(PLANTS).map((plant) => {
              const Icon = plant.icon;
              const isSelected = selectedSeed === plant.id && !isDeleteMode;
              const canAfford = stardust >= plant.cost;

              return (
                <button
                  key={plant.id}
                  onClick={() => {
                    synth.playInteractionSound();
                    setSelectedSeed(isSelected ? null : plant.id);
                    setIsDeleteMode(false);
                  }}
                  disabled={!canAfford}
                  className={`relative p-3 sm:p-4 rounded-2xl flex flex-col items-center gap-2 transition-all duration-300 w-20 sm:w-28
                    ${!canAfford ? 'opacity-40 cursor-not-allowed grayscale' : 'cursor-pointer'}
                    ${isSelected 
                      ? `bg-slate-800/80 border-${plant.color.split('-')[1]}-500 shadow-[0_0_20px_rgba(255,255,255,0.1)] scale-105` 
                      : 'bg-slate-800/30 hover:bg-slate-800/50 border-transparent'}
                    border
                  `}
                >
                  <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${plant.color} ${isSelected ? 'animate-pulse' : ''}`} />
                  <div className="text-center hidden sm:block">
                    <div className="text-xs text-slate-300 font-medium mb-1 truncate w-full px-1">{plant.name}</div>
                  </div>
                  <div className="text-[10px] sm:text-xs flex items-center justify-center gap-1 text-cyan-400/80 font-mono">
                    <Sparkles className="w-3 h-3" /> {plant.cost}
                  </div>
                  
                  {isSelected && <div className="absolute -right-1 -top-1 w-3 h-3 rounded-full bg-cyan-400 animate-ping" />}
                </button>
              );
            })}
          </div>

          {/* Garden Grid */}
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />
            
            <div 
              className="grid gap-1 sm:gap-2 p-4 sm:p-6 rounded-3xl backdrop-blur-sm bg-slate-900/40 border border-slate-700/50 shadow-2xl relative z-10"
              style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`, animation: 'float 6s ease-in-out infinite' }}
            >
              {grid.map((cell, index) => (
                <div
                  key={index}
                  onClick={() => handleCellClick(index)}
                  className={`
                    w-10 h-10 sm:w-14 sm:h-14 md:w-20 md:h-20 rounded-xl border flex items-center justify-center
                    transition-all duration-500 relative overflow-hidden group
                    ${selectedSeed && !cell ? 'cursor-cell hover:border-cyan-400/50 hover:bg-cyan-900/20' : ''}
                    ${isDeleteMode && cell ? 'cursor-not-allowed hover:border-red-500/50 hover:bg-red-900/30' : ''}
                    ${cell ? 'bg-slate-800/60 border-slate-700/50' : 'bg-slate-900/40 border-slate-800/50'}
                  `}
                >
                  {!cell && selectedSeed && <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-to-tr from-transparent to-white/10" />}
                  {cell && isDeleteMode && <div className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity bg-red-500 mix-blend-overlay z-20" />}

                  {cell && (
                    <div className="flex flex-col items-center justify-center w-full h-full relative">
                      {cell.stage === 'growing' ? (
                        <div className="relative w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-slate-700 border border-slate-500 animate-pulse flex items-center justify-center">
                           <div className="absolute w-full h-full border-t-2 border-cyan-400 rounded-full animate-spin" />
                        </div>
                      ) : (
                        <div className={`flex items-center justify-center transition-all duration-1000 ${PLANTS[cell.type].color}`}>
                          <div className={`absolute inset-0 opacity-50 blur-md bg-current rounded-full ${PLANTS[cell.type].glow}`} />
                          {(() => {
                            const Icon = PLANTS[cell.type].icon;
                            return <Icon className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 drop-shadow-lg relative z-10 animate-[gentleSway_4s_ease-in-out_infinite]" />;
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="text-center text-slate-600 text-[10px] sm:text-xs mt-auto pb-4 font-light tracking-widest uppercase">
          {isDeleteMode ? 'Select a plant to uproot' : selectedSeed ? 'Click an empty tile to plant' : 'Listen to the beat'}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes twinkle { 0% { opacity: 0.1; transform: scale(1); } 100% { opacity: 0.8; transform: scale(1.2); box-shadow: 0 0 10px rgba(255,255,255,0.5); } }
        @keyframes flyRight { 0% { left: -10%; transform: translateY(0px) rotate(5deg); } 100% { left: 110%; transform: translateY(50px) rotate(5deg); } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
        @keyframes gentleSway { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg) scale(1.05); } }
      `}} />
    </div>
  );
}
