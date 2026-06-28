/* ==========================================================================
   SLITHIFY - GAME ENGINE & SYSTEM LOGIC
   ========================================================================== */

class SlithifyGame {
  constructor() {
    // Canvas & Context
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Grid settings (600x480 canvas, 20x20 cell size -> 30 columns x 24 rows)
    this.cellSize = 20;
    this.gridWidth = this.canvas.width / this.cellSize;
    this.gridHeight = this.canvas.height / this.cellSize;
    
    // Pre-defined Maze Layouts
    this.mazes = {
      none: [],
      box: this.createBoxMaze(),
      cross: this.createCrossMaze(),
      tunnels: this.createTunnelsMaze(),
      spiral: this.createSpiralMaze()
    };

    // Game States
    this.state = {
      score: 0,
      highScore: 0,
      snake: [],
      direction: 'RIGHT',
      nextDirection: 'RIGHT',
      food: null,
      foodType: 'normal', // 'normal' or 'golden'
      foodTimer: 0,       // countdown for golden food
      particles: [],
      scorePopups: [],    // Floating popups
      gameStatus: 'IDLE', // 'IDLE', 'PLAYING', 'PAUSED', 'GAMEOVER'
      theme: 'doraemon',
      difficulty: 'medium',
      maze: 'none',       // Current maze ID
      mazeWalls: [],      // Coordinates of walls
      soundEnabled: true,
      crtEnabled: true,
      gridEnabled: true,
      tickRate: 100,      // Current ms per game tick
      lastTickTime: 0
    };

    // Leaderboard list
    this.leaderboard = [];

    // Synthesized Sound Engine
    this.sounds = new SoundEngine();

    // DOM Bindings
    this.bindDOM();
    
    // Initial setups
    this.loadSettings();
    this.loadLeaderboard();
    
    // Setup controls
    this.setupInputHandlers();
    
    // Draw initial screen
    this.drawScene();
    
    // Kickstart animation loop (handles particles and smooth elements)
    requestAnimationFrame((t) => this.animLoop(t));
  }

  /* --- DOM Bindings --- */
  bindDOM() {
    this.splashScreen = document.getElementById('splashScreen');
    this.pausedScreen = document.getElementById('pausedScreen');
    this.gameOverScreen = document.getElementById('gameOverScreen');
    this.scoreDisplay = document.getElementById('scoreDisplay');
    this.speedDisplay = document.getElementById('speedDisplay');
    this.lengthDisplay = document.getElementById('lengthDisplay');
    this.finalScore = document.getElementById('finalScore');
    this.playerNameInput = document.getElementById('playerNameInput');
    this.highScoreEntryForm = document.getElementById('highScoreEntryForm');
    this.leaderboardList = document.getElementById('leaderboardList');
    this.crtWrapper = document.getElementById('crtWrapper');
    this.ambientGlow = document.getElementById('ambientGlow');
    this.bgFloating = document.getElementById('bgFloating');

    // Controls settings
    this.themeSelect = document.getElementById('themeSelect');
    this.mazeSelect = document.getElementById('mazeSelect');
    this.speedSelect = document.getElementById('speedSelect');
    this.audioToggle = document.getElementById('audioToggle');
    this.crtToggle = document.getElementById('crtToggle');
    this.gridToggle = document.getElementById('gridToggle');

    // Buttons
    this.startBtn = document.getElementById('startBtn');
    this.resumeBtn = document.getElementById('resumeBtn');
    this.restartBtn = document.getElementById('restartBtn');
    this.saveScoreBtn = document.getElementById('saveScoreBtn');

    // Retro LCD HUD
    this.hudScore = document.getElementById('hudScore');
    this.hudSpeed = document.getElementById('hudSpeed');
    this.hudLength = document.getElementById('hudLength');
  }

  /* --- Game Settings Configuration --- */
  loadSettings() {
    // Load local storage values if available
    const theme = localStorage.getItem('slithify_theme') || 'doraemon';
    const difficulty = localStorage.getItem('slithify_difficulty') || 'medium';
    const maze = localStorage.getItem('slithify_maze') || 'none';
    const sound = localStorage.getItem('slithify_sound') !== 'false';
    const crt = localStorage.getItem('slithify_crt') !== 'false';
    const grid = localStorage.getItem('slithify_grid') !== 'false';

    this.state.theme = theme;
    this.state.difficulty = difficulty;
    this.state.maze = maze;
    this.state.mazeWalls = this.mazes[maze] || [];
    this.state.soundEnabled = sound;
    this.state.crtEnabled = crt;
    this.state.gridEnabled = grid;

    // Sync elements
    this.themeSelect.value = theme;
    this.mazeSelect.value = maze;
    this.speedSelect.value = difficulty;
    this.audioToggle.checked = sound;
    this.crtToggle.checked = crt;
    this.gridToggle.checked = grid;

    this.applyTheme(theme);
    this.applyCRT(crt);
    this.applyDifficulty(difficulty);
  }

  saveSettings() {
    localStorage.setItem('slithify_theme', this.state.theme);
    localStorage.setItem('slithify_difficulty', this.state.difficulty);
    localStorage.setItem('slithify_maze', this.state.maze);
    localStorage.setItem('slithify_sound', this.state.soundEnabled);
    localStorage.setItem('slithify_crt', this.state.crtEnabled);
    localStorage.setItem('slithify_grid', this.state.gridEnabled);
  }

  applyTheme(theme) {
    document.body.className = `theme-${theme}`;
    this.state.theme = theme;
    
    // Adjust canvas ambient color overlay
    if (this.ambientGlow) {
      if (theme === 'doraemon') {
        this.ambientGlow.style.background = 'radial-gradient(circle, rgba(0, 150, 255, 0.08) 0%, rgba(0, 0, 0, 0) 70%)';
      } else if (theme === 'squidgame') {
        this.ambientGlow.style.background = 'radial-gradient(circle, rgba(255, 0, 127, 0.08) 0%, rgba(0, 0, 0, 0) 70%)';
      } else if (theme === 'shinchan') {
        this.ambientGlow.style.background = 'radial-gradient(circle, rgba(255, 204, 0, 0.08) 0%, rgba(0, 0, 0, 0) 70%)';
      } else if (theme === 'tomjerry') {
        this.ambientGlow.style.background = 'radial-gradient(circle, rgba(140, 140, 158, 0.08) 0%, rgba(0, 0, 0, 0) 70%)';
      }
    }

    // Initialize/Refresh drifting background elements
    this.initFloatingBackground(theme);
  }

  applyCRT(enabled) {
    this.state.crtEnabled = enabled;
    if (enabled) {
      this.crtWrapper.classList.add('crt-active');
    } else {
      this.crtWrapper.classList.remove('crt-active');
    }
  }

  applyDifficulty(level) {
    this.state.difficulty = level;
    let baseRate = 100;
    if (level === 'easy') baseRate = 140;
    if (level === 'medium') baseRate = 100;
    if (level === 'hard') baseRate = 60;
    
    this.state.tickRate = baseRate;
    this.updateHUD();
  }

  /* --- Input Setup --- */
  setupInputHandlers() {
    // Keyboard Controls
    window.addEventListener('keydown', (e) => {
      // Prevent browser scrolling with arrows/spacebar while playing
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.code) && this.state.gameStatus === 'PLAYING') {
        e.preventDefault();
      }
      
      this.handleKeyPress(e.code);
    });

    // Theme Selector Change
    this.themeSelect.addEventListener('change', (e) => {
      this.applyTheme(e.target.value);
      this.saveSettings();
      this.sounds.playClick();
    });

    // Maze Selector Change
    this.mazeSelect.addEventListener('change', (e) => {
      const mazeVal = e.target.value;
      this.state.maze = mazeVal;
      this.state.mazeWalls = this.mazes[mazeVal] || [];
      this.saveSettings();
      this.sounds.playClick();
      
      // Auto-restart game with new layout if already running or dead
      if (this.state.gameStatus === 'PLAYING' || this.state.gameStatus === 'PAUSED' || this.state.gameStatus === 'GAMEOVER') {
        this.startGame();
      } else {
        this.drawScene(); // Redraw splash screen with the new maze layout visible
      }
    });

    // Difficulty Selector Change
    this.speedSelect.addEventListener('change', (e) => {
      this.applyDifficulty(e.target.value);
      this.saveSettings();
      this.sounds.playClick();
    });

    // Toggles
    this.audioToggle.addEventListener('change', (e) => {
      this.state.soundEnabled = e.target.checked;
      this.saveSettings();
      this.sounds.playClick();
    });

    this.crtToggle.addEventListener('change', (e) => {
      this.applyCRT(e.target.checked);
      this.saveSettings();
      this.sounds.playClick();
    });

    this.gridToggle.addEventListener('change', (e) => {
      this.state.gridEnabled = e.target.checked;
      this.saveSettings();
      this.sounds.playClick();
    });

    // Menu Actions
    this.startBtn.addEventListener('click', () => this.startGame());
    this.resumeBtn.addEventListener('click', () => this.togglePause());
    this.restartBtn.addEventListener('click', () => this.startGame());
    this.saveScoreBtn.addEventListener('click', () => this.saveHighScore());

    // Mobile Virtual Pad Bindings
    const bindDpad = (elementId, direction) => {
      const el = document.getElementById(elementId);
      if (el) {
        // Prevent zoom gestures on double tap for iOS
        el.addEventListener('touchend', (e) => {
          e.preventDefault();
          this.handleDirectionInput(direction);
        });
        el.addEventListener('click', () => this.handleDirectionInput(direction));
      }
    };

    bindDpad('dpadUp', 'UP');
    bindDpad('dpadDown', 'DOWN');
    bindDpad('dpadLeft', 'LEFT');
    bindDpad('dpadRight', 'RIGHT');

    const centerPad = document.getElementById('dpadCenter');
    if (centerPad) {
      centerPad.addEventListener('click', () => this.handleKeyPress('Space'));
      centerPad.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.handleKeyPress('Space');
      });
    }

    // Touch Swipes setup
    this.setupTouchSwipe();
  }

  setupTouchSwipe() {
    const target = this.crtWrapper || this.canvas;
    if (!target) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    target.addEventListener('touchstart', (e) => {
      if (this.state.gameStatus !== 'PLAYING') return;
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    target.addEventListener('touchmove', (e) => {
      if (this.state.gameStatus === 'PLAYING') {
        e.preventDefault();
      }
    }, { passive: false });

    target.addEventListener('touchend', (e) => {
      if (this.state.gameStatus !== 'PLAYING') return;
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      const threshold = 30; // Min swipe distance in pixels

      if (Math.max(absDx, absDy) > threshold) {
        if (absDx > absDy) {
          // Horizontal swipe
          if (dx > 0) {
            this.handleDirectionInput('RIGHT');
          } else {
            this.handleDirectionInput('LEFT');
          }
        } else {
          // Vertical swipe
          if (dy > 0) {
            this.handleDirectionInput('DOWN');
          } else {
            this.handleDirectionInput('UP');
          }
        }
      }
    }, { passive: true });
  }

  handleKeyPress(code) {
    if (this.state.gameStatus === 'PLAYING') {
      if (code === 'ArrowUp' || code === 'KeyW') this.handleDirectionInput('UP');
      if (code === 'ArrowDown' || code === 'KeyS') this.handleDirectionInput('DOWN');
      if (code === 'ArrowLeft' || code === 'KeyA') this.handleDirectionInput('LEFT');
      if (code === 'ArrowRight' || code === 'KeyD') this.handleDirectionInput('RIGHT');
      if (code === 'Space') this.togglePause();
    } else if (this.state.gameStatus === 'PAUSED') {
      if (code === 'Space') this.togglePause();
    } else if (this.state.gameStatus === 'IDLE') {
      if (code === 'Space' || code === 'Enter') this.startGame();
    } else if (this.state.gameStatus === 'GAMEOVER') {
      if (code === 'Space' || code === 'Enter') {
        // If high score input is not active or empty, restart
        if (document.activeElement !== this.playerNameInput) {
          this.startGame();
        }
      }
    }
  }

  handleDirectionInput(dir) {
    const opp = {
      'UP': 'DOWN',
      'DOWN': 'UP',
      'LEFT': 'RIGHT',
      'RIGHT': 'LEFT'
    };

    // Prevent immediate reverse direction crash
    if (opp[dir] !== this.state.direction) {
      this.state.nextDirection = dir;
      // Play a very subtle movement pulse sound
      if (this.state.gameStatus === 'PLAYING') {
        this.sounds.playMove(this.state.soundEnabled);
      }
    }
  }

  /* --- Game Actions --- */
  startGame() {
    this.sounds.initAudio();
    this.sounds.playClick();
    
    // Reset States
    this.state.score = 0;
    this.state.direction = 'RIGHT';
    this.state.nextDirection = 'RIGHT';
    this.state.particles = [];
    this.state.scorePopups = [];
    
    // Starting coordinates (Centered, length 4)
    const startX = Math.floor(this.gridWidth / 2);
    const startY = Math.floor(this.gridHeight / 2);
    this.state.snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
      { x: startX - 3, y: startY }
    ];

    this.spawnFood();
    
    // Hide screens
    this.splashScreen.classList.remove('active');
    this.pausedScreen.classList.remove('active');
    this.gameOverScreen.classList.remove('active');

    this.state.gameStatus = 'PLAYING';
    this.state.lastTickTime = performance.now();
    this.updateHUD();
  }

  togglePause() {
    if (this.state.gameStatus === 'PLAYING') {
      this.state.gameStatus = 'PAUSED';
      this.pausedScreen.classList.add('active');
      this.sounds.playPause(this.state.soundEnabled);
    } else if (this.state.gameStatus === 'PAUSED') {
      this.state.gameStatus = 'PLAYING';
      this.pausedScreen.classList.remove('active');
      this.state.lastTickTime = performance.now();
      this.sounds.playResume(this.state.soundEnabled);
    }
  }

  gameOver() {
    this.state.gameStatus = 'GAMEOVER';
    this.finalScore.textContent = String(this.state.score).padStart(3, '0');
    
    // Check if score makes leaderboard
    const isNewRecord = this.isLeaderboardScore(this.state.score);
    if (isNewRecord) {
      this.highScoreEntryForm.style.display = 'flex';
      this.playerNameInput.value = '';
      setTimeout(() => this.playerNameInput.focus(), 300);
      this.sounds.playHighScore(this.state.soundEnabled);
    } else {
      this.highScoreEntryForm.style.display = 'none';
      this.sounds.playGameOver(this.state.soundEnabled);
    }

    this.gameOverScreen.classList.add('active');
  }

  /* --- Spawning Mechanics --- */
  spawnFood() {
    let attempts = 0;
    let foodPos;
    
    while (attempts < 100) {
      foodPos = {
        x: Math.floor(Math.random() * this.gridWidth),
        y: Math.floor(Math.random() * this.gridHeight)
      };

      // Check if food coordinates collide with the snake or walls
      const onSnake = this.state.snake.some(segment => segment.x === foodPos.x && segment.y === foodPos.y);
      const onWall = this.state.mazeWalls.some(wall => wall.x === foodPos.x && wall.y === foodPos.y);
      if (!onSnake && !onWall) break;
      attempts++;
    }

    // Determine type: 15% chance of golden food
    const rand = Math.random();
    if (rand < 0.15 && this.state.score > 30) {
      this.state.foodType = 'golden';
      this.state.foodTimer = 40; // Spawns for 40 game ticks
    } else {
      this.state.foodType = 'normal';
      this.state.foodTimer = 0;
    }
    
    this.state.food = foodPos;
  }

  /* --- Physics/Tick Logic --- */
  gameTick() {
    if (this.state.gameStatus !== 'PLAYING') return;

    // Apply movement direction
    this.state.direction = this.state.nextDirection;

    // Head coords
    const head = { ...this.state.snake[0] };

    // Next head position
    if (this.state.direction === 'UP') head.y--;
    if (this.state.direction === 'DOWN') head.y++;
    if (this.state.direction === 'LEFT') head.x--;
    if (this.state.direction === 'RIGHT') head.x++;

    // Wall Collision Check (Fatal in arcade style)
    if (head.x < 0 || head.x >= this.gridWidth || head.y < 0 || head.y >= this.gridHeight) {
      this.triggerScreenShake();
      this.sounds.playCrash(this.state.soundEnabled);
      this.gameOver();
      return;
    }

    // Maze Wall Collision Check
    const hitWall = this.state.mazeWalls.some(w => w.x === head.x && w.y === head.y);
    if (hitWall) {
      this.triggerScreenShake();
      this.sounds.playCrash(this.state.soundEnabled);
      this.gameOver();
      return;
    }

    // Self Collision Check
    const selfCollision = this.state.snake.some((segment, index) => {
      // Ignore final tail tip if it's shrinking
      if (index === this.state.snake.length - 1) return false;
      return segment.x === head.x && segment.y === head.y;
    });

    if (selfCollision) {
      this.triggerScreenShake();
      this.sounds.playCrash(this.state.soundEnabled);
      this.gameOver();
      return;
    }

    // Add new head segment
    this.state.snake.unshift(head);

    // Food Collision Check
    if (head.x === this.state.food.x && head.y === this.state.food.y) {
      const points = this.state.foodType === 'golden' ? 30 : 10;
      this.state.score += points;
      
      // Spawn floating score popup
      const foodX = this.state.food.x * this.cellSize;
      const foodY = this.state.food.y * this.cellSize;
      this.state.scorePopups.push({
        x: foodX + this.cellSize / 2,
        y: foodY,
        text: `+${points}`,
        alpha: 1.0,
        yOffset: 0
      });

      // Spawn eating particles
      let particleColor = '#ff3344';
      if (this.state.foodType === 'golden') {
        particleColor = '#ffd700';
      } else {
        if (this.state.theme === 'doraemon') particleColor = '#0096ff';
        else if (this.state.theme === 'squidgame') particleColor = '#df9a28';
        else if (this.state.theme === 'shinchan') particleColor = '#ff66cc';
        else if (this.state.theme === 'tomjerry') particleColor = '#ffcc00';
      }
      this.spawnParticles(foodX + this.cellSize/2, foodY + this.cellSize/2, particleColor);

      // Play Sound
      this.sounds.playEat(this.state.foodType === 'golden', this.state.soundEnabled);

      // Re-spawn Food
      this.spawnFood();
      
      // Gradually adjust difficulty based on score
      this.applyDifficulty(this.state.difficulty);
      this.updateHUD();
    } else {
      // Remove tail to keep same length
      this.state.snake.pop();
    }

    // Decrease Golden Food Timer
    if (this.state.foodType === 'golden') {
      this.state.foodTimer--;
      if (this.state.foodTimer <= 0) {
        this.spawnFood(); // Despawn and spawn regular
      }
    }
  }

  /* --- Particle Generator --- */
  spawnParticles(x, y, color) {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      this.state.particles.push(new Particle(
        x, 
        y, 
        Math.cos(angle) * speed, 
        Math.sin(angle) * speed, 
        color
      ));
    }
  }

  /* --- Rendering Code --- */
  drawScene() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Clear Canvas - Custom Light Background based on active theme
    let canvasBg = '#f4f5f8'; // Default light grey
    if (this.state.theme === 'doraemon') canvasBg = '#e8f3fc';
    else if (this.state.theme === 'squidgame') canvasBg = '#fcecf2';
    else if (this.state.theme === 'shinchan') canvasBg = '#fffbe8';
    else if (this.state.theme === 'tomjerry') canvasBg = '#f3f3f6';

    ctx.fillStyle = canvasBg;
    ctx.fillRect(0, 0, width, height);

    // Draw Grid Lines (if enabled)
    if (this.state.gridEnabled) {
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-color').trim() || 'rgba(0,0,0,0.03)';
      ctx.lineWidth = 0.5;
      
      for (let x = 0; x <= width; x += this.cellSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += this.cellSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // Draw Maze Walls
    this.drawMazeWalls(ctx);

    // Draw Food
    if (this.state.food) {
      const fx = this.state.food.x * this.cellSize;
      const fy = this.state.food.y * this.cellSize;
      const r = this.cellSize / 2;

      ctx.save();
      if (this.state.foodType === 'golden') {
        // Flashing Golden food
        const pulse = 1 + Math.sin(performance.now() / 80) * 0.2;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 12 * pulse;
        ctx.fillStyle = '#ffd700';
        
        // Draw star or diamond shape
        ctx.beginPath();
        ctx.moveTo(fx + r, fy + r - r * pulse);
        ctx.lineTo(fx + r + r * pulse, fy + r);
        ctx.lineTo(fx + r, fy + r + r * pulse);
        ctx.lineTo(fx + r - r * pulse, fy + r);
        ctx.closePath();
        ctx.fill();

        // Draw time remaining indicator ring
        ctx.beginPath();
        ctx.arc(fx + r, fy + r, r * 1.3, 0, (Math.PI * 2) * (this.state.foodTimer / 40));
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        // Normal Theme Food
        this.drawNormalFood(ctx, fx, fy, r);
      }
      ctx.restore();
    }

    // Draw Snake
    const snake = this.state.snake;
    if (snake.length > 0) {
      ctx.save();
      
      snake.forEach((segment, idx) => {
        const sx = segment.x * this.cellSize;
        const sy = segment.y * this.cellSize;
        const isHead = idx === 0;

        if (isHead) {
          this.drawSnakeHead(ctx, sx, sy, this.cellSize, this.state.direction);
        } else {
          this.drawSnakeSegment(ctx, sx, sy, this.cellSize, idx, snake.length);
        }
      });
      ctx.restore();
    }

    // Draw Particles
    this.state.particles.forEach(p => p.draw(ctx));

    // Update and Draw Floating Score Popups
    this.state.scorePopups = this.state.scorePopups.filter(pop => {
      pop.yOffset -= 0.6; // float up
      pop.alpha -= 0.025; // fade out
      if (pop.alpha > 0) {
        ctx.save();
        ctx.globalAlpha = pop.alpha;
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#0077cc';
        ctx.font = "bold 13px 'Fredoka One', cursive, sans-serif";
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(pop.text, pop.x, pop.y + pop.yOffset);
        ctx.restore();
        return true;
      }
      return false;
    });
  }

  /* --- Procedural Food Rendering --- */
  drawNormalFood(ctx, fx, fy, r) {
    const pulse = 1 + Math.sin(performance.now() / 150) * 0.12;
    const center = fx + this.cellSize / 2;
    const centery = fy + this.cellSize / 2;

    ctx.save();
    
    if (this.state.theme === 'doraemon') {
      // DORA CAKE (Dorayaki): Two golden-brown pancakes sandwiching red bean paste
      ctx.shadowColor = 'rgba(181, 101, 29, 0.3)';
      ctx.shadowBlur = 6 * pulse;

      // Bottom pancake
      ctx.fillStyle = '#8f5527'; // Darker brown
      ctx.beginPath();
      ctx.ellipse(center, centery + 2 * pulse, r * 0.9 * pulse, r * 0.5 * pulse, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Bean paste center filling
      ctx.fillStyle = '#4f1414'; // Dark red-brown bean paste
      ctx.fillRect(center - r * 0.75 * pulse, centery - 1 * pulse, r * 1.5 * pulse, 3 * pulse);
      
      // Top pancake
      ctx.fillStyle = '#c48045'; // Golden brown
      ctx.beginPath();
      ctx.ellipse(center, centery - 2 * pulse, r * 0.95 * pulse, r * 0.52 * pulse, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Shine line
      ctx.strokeStyle = '#f2be8c';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(center - 1, centery - 4 * pulse, r * 0.5 * pulse, r * 0.18 * pulse, 0.1, Math.PI * 1.2, Math.PI * 1.8);
      ctx.stroke();

    } else if (this.state.theme === 'squidgame') {
      // DALGONA CANDY: Golden-brown circle with stamped star outline
      ctx.shadowColor = 'rgba(223, 154, 40, 0.4)';
      ctx.shadowBlur = 6 * pulse;

      // Base
      ctx.fillStyle = '#e8a93e'; // Caramel
      ctx.strokeStyle = '#a6680a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(center, centery, r * 0.9 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Star shape stamp
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const numPoints = 5;
      const outerRad = r * 0.5 * pulse;
      const innerRad = r * 0.22 * pulse;
      for (let i = 0; i < numPoints * 2; i++) {
        const rad = i % 2 === 0 ? outerRad : innerRad;
        const currAngle = (Math.PI / numPoints) * i - Math.PI / 2;
        const sx = center + Math.cos(currAngle) * rad;
        const sy = centery + Math.sin(currAngle) * rad;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.stroke();

    } else if (this.state.theme === 'shinchan') {
      // CHOCOBI PINK STAR BISCUIT: Cute pink star
      ctx.shadowColor = 'rgba(255, 102, 204, 0.4)';
      ctx.shadowBlur = 8 * pulse;

      ctx.fillStyle = '#ff6ec7'; // Chocobi pink
      ctx.strokeStyle = '#cc358d';
      ctx.lineWidth = 1.5;
      
      ctx.beginPath();
      const numPoints = 5;
      const outerRad = r * 0.95 * pulse;
      const innerRad = r * 0.45 * pulse;
      for (let i = 0; i < numPoints * 2; i++) {
        const rad = i % 2 === 0 ? outerRad : innerRad;
        const currAngle = (Math.PI / numPoints) * i - Math.PI / 2;
        const sx = center + Math.cos(currAngle) * rad;
        const sy = centery + Math.sin(currAngle) * rad;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Texture details
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(center, centery, 1.5 * pulse, 0, Math.PI * 2);
      ctx.fill();

    } else if (this.state.theme === 'tomjerry') {
      // CHEESE SLICE: Yellow triangle with cartoon holes
      ctx.shadowColor = 'rgba(255, 183, 0, 0.4)';
      ctx.shadowBlur = 6 * pulse;

      ctx.fillStyle = '#ffd214'; // Cheese yellow
      ctx.strokeStyle = '#df9b00';
      ctx.lineWidth = 1.5;

      const size = r * 0.9 * pulse;
      ctx.beginPath();
      ctx.moveTo(center - size, centery + size); // Bottom left
      ctx.lineTo(center + size, centery + size); // Bottom right
      ctx.lineTo(center, centery - size * 1.1);   // Top peak
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Holes
      ctx.fillStyle = '#dfaf00';
      ctx.beginPath();
      ctx.arc(center - size * 0.3, centery + size * 0.4, 2 * pulse, 0, Math.PI * 2);
      ctx.arc(center + size * 0.4, centery + size * 0.2, 1.5 * pulse, 0, Math.PI * 2);
      ctx.arc(center - size * 0.1, centery - size * 0.2, 2.5 * pulse, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /* --- Procedural Custom Snake Heads --- */
  drawSnakeHead(ctx, sx, sy, size, dir) {
    const cx = sx + size / 2;
    const cy = sy + size / 2;
    const r = size / 2;

    // Direct offset variables based on direction to turn eyes/face dynamically
    let dx = 0;
    let dy = 0;
    if (dir === 'RIGHT') dx = 1.5;
    if (dir === 'LEFT') dx = -1.5;
    if (dir === 'UP') dy = -1.5;
    if (dir === 'DOWN') dy = 1.5;

    ctx.save();

    if (this.state.theme === 'doraemon') {
      // 1. DORAEMON HEAD: Blue head, white cheeks, red nose, whiskers, red collar
      // Blue base
      ctx.fillStyle = '#0096ff';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // White face patch (shifted slightly forward)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx + dx * 0.8, cy + dy * 0.8 + 1.5, r * 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0055bb';
      ctx.lineWidth = 1;
      const ex1 = cx + dx + (dir === 'UP' || dir === 'DOWN' ? -3 : dx * 0.5 - 2.5);
      const ex2 = cx + dx + (dir === 'UP' || dir === 'DOWN' ? 3 : dx * 0.5 + 2.5);
      const ey = cy + dy - 2.5;

      ctx.beginPath();
      ctx.ellipse(ex1, ey, 2.5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(ex2, ey, 2.5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Pupils
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(ex1 + (dx > 0 ? 0.5 : dx < 0 ? -0.5 : 0), ey, 1, 0, Math.PI * 2);
      ctx.arc(ex2 + (dx > 0 ? 0.5 : dx < 0 ? -0.5 : 0), ey, 1, 0, Math.PI * 2);
      ctx.fill();

      // Red Nose
      ctx.fillStyle = '#ff3344';
      ctx.beginPath();
      ctx.arc(cx + dx * 1.5, cy + dy * 1.5 + 1.5, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Whiskers (3 on each side)
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 0.8;
      const wBaseX = cx + dx * 1.5;
      const wBaseY = cy + dy * 1.5 + 3.5;
      
      // Left whiskers
      ctx.beginPath();
      ctx.moveTo(wBaseX - 2, wBaseY); ctx.lineTo(wBaseX - 7, wBaseY - 1.5);
      ctx.moveTo(wBaseX - 2, wBaseY + 1.5); ctx.lineTo(wBaseX - 7.5, wBaseY + 1.5);
      ctx.moveTo(wBaseX - 2, wBaseY + 3); ctx.lineTo(wBaseX - 6.5, wBaseY + 4.5);
      
      // Right whiskers
      ctx.moveTo(wBaseX + 2, wBaseY); ctx.lineTo(wBaseX + 7, wBaseY - 1.5);
      ctx.moveTo(wBaseX + 2, wBaseY + 1.5); ctx.lineTo(wBaseX + 7.5, wBaseY + 1.5);
      ctx.moveTo(wBaseX + 2, wBaseY + 3); ctx.lineTo(wBaseX + 6.5, wBaseY + 4.5);
      ctx.stroke();

      // Collar
      ctx.fillStyle = '#ff3344';
      ctx.fillRect(cx - 6, cy + r - 3, 12, 2.5);
      // Bell
      ctx.fillStyle = '#ffe500';
      ctx.beginPath();
      ctx.arc(cx, cy + r - 1.5, 1.8, 0, Math.PI * 2);
      ctx.fill();

    } else if (this.state.theme === 'squidgame') {
      // 2. SQUID GAME HEAD: Pink Guard Mask, black visor screen, white Triangle symbol
      ctx.fillStyle = '#ff007f'; // Guard pink
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Black Mask Visor area
      ctx.fillStyle = '#0f0f12';
      ctx.beginPath();
      ctx.arc(cx + dx * 0.5, cy + dy * 0.5, r * 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Stamped white Triangle shape
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      const tx = cx + dx;
      const ty = cy + dy;
      const tSize = r * 0.45;
      
      ctx.beginPath();
      ctx.moveTo(tx, ty - tSize * 0.9); // Top peak
      ctx.lineTo(tx + tSize, ty + tSize * 0.7); // Bottom right
      ctx.lineTo(tx - tSize, ty + tSize * 0.7); // Bottom left
      ctx.closePath();
      ctx.stroke();

    } else if (this.state.theme === 'shinchan') {
      // 3. SHINCHAN HEAD: Peach skin circle, huge glossy eyes, signature thick eyebrows
      ctx.fillStyle = '#ffd8a8'; // Skin tone
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#000000';
      const ex1 = cx + dx + (dir === 'UP' || dir === 'DOWN' ? -3 : dx * 0.5 - 2);
      const ex2 = cx + dx + (dir === 'UP' || dir === 'DOWN' ? 3 : dx * 0.5 + 4);
      const ey = cy + dy + 1;
      
      ctx.beginPath();
      ctx.ellipse(ex1, ey, 2.5, 3, 0, 0, Math.PI * 2);
      ctx.ellipse(ex2, ey, 2.5, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eye highlights (glossy white reflection dots)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex1 + 0.8, ey - 1, 0.8, 0, Math.PI * 2);
      ctx.arc(ex2 + 0.8, ey - 1, 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Signature Thick Eyebrows (Thick arched black lines)
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.8;
      ctx.lineCap = 'round';
      
      ctx.beginPath();
      // Left Eyebrow
      ctx.arc(ex1, ey - 5.5, 3, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
      
      ctx.beginPath();
      // Right Eyebrow
      ctx.arc(ex2, ey - 5.5, 3, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();

      // Blushing cheeks (rosy pink circles)
      ctx.fillStyle = 'rgba(255, 102, 102, 0.45)';
      ctx.beginPath();
      ctx.arc(ex1 - 2, ey + 4, 2, 0, Math.PI * 2);
      ctx.arc(ex2 + 2, ey + 4, 2, 0, Math.PI * 2);
      ctx.fill();

      // Cute mouth curve
      ctx.strokeStyle = '#4a2211';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx + dx * 1.5, cy + dy * 1.5 + 4.5, 2, 0, Math.PI);
      ctx.stroke();

    } else if (this.state.theme === 'tomjerry') {
      // 4. TOM & JERRY HEAD: Tom-grey cat face
      ctx.fillStyle = '#8c8c9e'; // Grey fur
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Ears (pointy grey triangles with pink cores)
      ctx.fillStyle = '#8c8c9e';
      
      // Left ear
      ctx.beginPath();
      ctx.moveTo(cx - r + 1, cy - r + 3);
      ctx.lineTo(cx - r - 3, cy - r - 4);
      ctx.lineTo(cx - 2, cy - r + 1);
      ctx.closePath();
      ctx.fill();
      // Left ear pink center
      ctx.fillStyle = '#ffb3cc';
      ctx.beginPath();
      ctx.moveTo(cx - r + 2.5, cy - r + 2.8);
      ctx.lineTo(cx - r - 1.5, cy - r - 2);
      ctx.lineTo(cx - 4, cy - r + 1.5);
      ctx.closePath();
      ctx.fill();

      // Right ear
      ctx.fillStyle = '#8c8c9e';
      ctx.beginPath();
      ctx.moveTo(cx + r - 1, cy - r + 3);
      ctx.lineTo(cx + r + 3, cy - r - 4);
      ctx.lineTo(cx + 2, cy - r + 1);
      ctx.closePath();
      ctx.fill();
      // Right ear pink center
      ctx.fillStyle = '#ffb3cc';
      ctx.beginPath();
      ctx.moveTo(cx + r - 2.5, cy - r + 2.8);
      ctx.lineTo(cx + r + 1.5, cy - r - 2);
      ctx.lineTo(cx + 4, cy - r + 1.5);
      ctx.closePath();
      ctx.fill();

      // Cat Eyes (Yellow base with green slit pupils)
      const ex1 = cx + dx + (dir === 'UP' || dir === 'DOWN' ? -3 : dx * 0.5 - 2);
      const ex2 = cx + dx + (dir === 'UP' || dir === 'DOWN' ? 3 : dx * 0.5 + 3);
      const ey = cy + dy - 1.5;

      ctx.fillStyle = '#ffea33'; // Yellow iris
      ctx.beginPath();
      ctx.ellipse(ex1, ey, 2.5, 3.2, 0, 0, Math.PI * 2);
      ctx.ellipse(ex2, ey, 2.5, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Green pupil slits
      ctx.fillStyle = '#2db83d';
      ctx.fillRect(ex1 - 0.6, ey - 2, 1.2, 4);
      ctx.fillRect(ex2 - 0.6, ey - 2, 1.2, 4);

      // White cheeks muzzle (Tom muzzle patch)
      ctx.fillStyle = '#f3f3f6';
      ctx.beginPath();
      ctx.arc(cx + dx * 1.2 - 2, cy + dy * 1.2 + 2, 2.5, 0, Math.PI * 2);
      ctx.arc(cx + dx * 1.2 + 2, cy + dy * 1.2 + 2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Red Nose
      ctx.fillStyle = '#ff5c5c';
      ctx.beginPath();
      ctx.arc(cx + dx * 1.2, cy + dy * 1.2 + 1, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Whiskers
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy + 3.5); ctx.lineTo(cx - 9, cy + 3);
      ctx.moveTo(cx - 4, cy + 4.5); ctx.lineTo(cx - 10, cy + 5);
      ctx.moveTo(cx + 4, cy + 3.5); ctx.lineTo(cx + 9, cy + 3);
      ctx.moveTo(cx + 4, cy + 4.5); ctx.lineTo(cx + 10, cy + 5);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* --- Procedural Custom Snake Body Segments --- */
  drawSnakeSegment(ctx, sx, sy, size, idx, total) {
    const cx = sx + size / 2;
    const cy = sy + size / 2;
    const r = size / 2;

    // Segment size tapers slightly towards tail
    const sizeRatio = Math.max(0.6, 1 - (idx / total) * 0.35);
    const pad = (size - (size * sizeRatio)) / 2;
    const segSize = size * sizeRatio;
    const segmentR = segSize / 2;
    const segCx = sx + pad + segmentR;
    const segCy = sy + pad + segmentR;

    ctx.save();

    if (this.state.theme === 'doraemon') {
      // Doraemon body segment: Alternating blue circles with white pockets and red collar line
      ctx.fillStyle = '#0096ff';
      ctx.beginPath();
      ctx.arc(segCx, segCy, segmentR, 0, Math.PI * 2);
      ctx.fill();

      // White pocket belly detail
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(segCx, segCy + segmentR * 0.3, segmentR * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // Collar line red stripe
      ctx.strokeStyle = '#ff3344';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(segCx - segmentR * 0.8, segCy - segmentR * 0.35);
      ctx.lineTo(segCx + segmentR * 0.8, segCy - segmentR * 0.35);
      ctx.stroke();

    } else if (this.state.theme === 'squidgame') {
      // Squid Game segment: Green tracksuit segment, white side-stripes, player number!
      ctx.fillStyle = '#037a6b'; // Tracksuit green
      ctx.beginPath();
      ctx.arc(segCx, segCy, segmentR, 0, Math.PI * 2);
      ctx.fill();

      // White shoulder stripes on the sides
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Left shoulder line
      ctx.ellipse(segCx, segCy, segmentR, segmentR, 0, Math.PI * 0.7, Math.PI * 1.3);
      ctx.stroke();
      ctx.beginPath();
      // Right shoulder line
      ctx.ellipse(segCx, segCy, segmentR, segmentR, 0, Math.PI * 1.7, Math.PI * 0.3);
      ctx.stroke();

      // Render player number on first few segments (456, 067, 218)
      if (idx <= 3 && segmentR > 6) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.floor(segmentR * 0.9)}px 'Share Tech Mono'`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let pNum = '456';
        if (idx === 1) pNum = '456';
        if (idx === 2) pNum = '067';
        if (idx === 3) pNum = '218';
        ctx.fillText(pNum, segCx, segCy + 0.5);
      }

    } else if (this.state.theme === 'shinchan') {
      // Shinchan segment: Alternating shirt-red and shorts-yellow segments
      const isRed = idx % 2 === 0;
      
      ctx.fillStyle = isRed ? '#ff3333' : '#ffcc00';
      ctx.beginPath();
      ctx.arc(segCx, segCy, segmentR, 0, Math.PI * 2);
      ctx.fill();

      // Red shirt collar decoration
      if (isRed) {
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(segCx, segCy - segmentR * 0.6, segmentR * 0.25, 0, Math.PI);
        ctx.fill();
      } else {
        // Yellow shorts details
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(segCx, segCy, segmentR * 0.8, 0, Math.PI * 2);
        ctx.stroke();
      }

    } else if (this.state.theme === 'tomjerry') {
      // Tom & Jerry: Alternating grey (Tom) and brown (Jerry) body segments!
      const isTom = idx % 2 === 0;
      
      ctx.fillStyle = isTom ? '#8c8c9e' : '#b57a3e'; // grey or brown
      ctx.beginPath();
      ctx.arc(segCx, segCy, segmentR, 0, Math.PI * 2);
      ctx.fill();

      // Belly pocket patch
      ctx.fillStyle = isTom ? '#f3f3f6' : '#ffd8a8';
      ctx.beginPath();
      ctx.arc(segCx, segCy + segmentR * 0.25, segmentR * 0.62, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /* --- Animation Loop --- */
  animLoop(timestamp) {
    // 1. Process physics/game ticks
    if (this.state.gameStatus === 'PLAYING') {
      const delta = timestamp - this.state.lastTickTime;
      // Calculate active speed (slight increase proportional to score)
      const currentTickRate = Math.max(40, this.state.tickRate - Math.floor(this.state.score / 50) * 5);

      if (delta >= currentTickRate) {
        this.gameTick();
        this.state.lastTickTime = timestamp;
      }
    }

    // 2. Process particles transitions
    this.state.particles = this.state.particles.filter(p => p.update());

    // 3. Render frame
    this.drawScene();

    // 4. Loop
    requestAnimationFrame((t) => this.animLoop(t));
  }

  /* --- HUD Interface Updater --- */
  updateHUD() {
    const scoreStr = String(this.state.score).padStart(4, '0');
    const lengthStr = String(this.state.snake.length || 0);
    const speedLevel = Math.min(10, 1 + Math.floor(this.state.score / 50));
    const speedStr = `LVL ${speedLevel}`;

    this.scoreDisplay.textContent = scoreStr;
    this.lengthDisplay.textContent = lengthStr;
    this.speedDisplay.textContent = speedStr;

    if (this.hudScore) this.hudScore.textContent = scoreStr;
    if (this.hudLength) this.hudLength.textContent = lengthStr;
    if (this.hudSpeed) this.hudSpeed.textContent = speedStr;
  }

  /* --- Leaderboard Logic --- */
  loadLeaderboard() {
    const saved = localStorage.getItem('slithify_leaderboard');
    if (saved) {
      this.leaderboard = JSON.parse(saved);
    } else {
      // Populate defaults
      this.leaderboard = [
        { name: 'DOR', score: 150, date: new Date().toLocaleDateString() },
        { name: '456', score: 120, date: new Date().toLocaleDateString() },
        { name: 'SHI', score: 90, date: new Date().toLocaleDateString() },
        { name: 'JER', score: 70, date: new Date().toLocaleDateString() },
        { name: 'TOM', score: 50, date: new Date().toLocaleDateString() }
      ];
      this.saveLeaderboardToStorage();
    }
    this.displayLeaderboard();
  }

  saveLeaderboardToStorage() {
    localStorage.setItem('slithify_leaderboard', JSON.stringify(this.leaderboard));
  }

  displayLeaderboard() {
    this.leaderboardList.innerHTML = '';
    const ranks = ['1ST', '2ND', '3RD', '4TH', '5TH'];
    
    this.leaderboard.slice(0, 5).forEach((entry, idx) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="rank">${ranks[idx]}</span>
        <span class="name">${entry.name}</span>
        <span class="score">${String(entry.score).padStart(4, '0')}</span>
      `;
      this.leaderboardList.appendChild(li);
    });
  }

  isLeaderboardScore(score) {
    if (score <= 0) return false;
    if (this.leaderboard.length < 5) return true;
    return score > this.leaderboard[this.leaderboard.length - 1].score;
  }

  saveHighScore() {
    const initials = this.playerNameInput.value.trim().toUpperCase() || 'AAA';
    const score = this.state.score;
    
    const entry = {
      name: initials.slice(0, 3),
      score: score,
      date: new Date().toLocaleDateString()
    };

    this.leaderboard.push(entry);
    // Sort descending
    this.leaderboard.sort((a, b) => b.score - a.score);
    // Slice to 5 items
    this.leaderboard = this.leaderboard.slice(0, 5);
    
    this.saveLeaderboardToStorage();
    this.displayLeaderboard();

    // Hide input and show restart button
    this.highScoreEntryForm.style.display = 'none';
    this.sounds.playClick();
  }

  /* --- Screen Shake Trigger --- */
  triggerScreenShake() {
    const bezel = document.querySelector('.cabinet-bezel');
    if (bezel) {
      bezel.classList.remove('shake-active');
      void bezel.offsetWidth; // Force reflow
      bezel.classList.add('shake-active');
      setTimeout(() => bezel.classList.remove('shake-active'), 400);
    }
  }

  /* --- Dynamic Floating Background Spawner --- */
  initFloatingBackground(theme) {
    if (!this.bgFloating) return;
    
    // Clear existing floating elements
    this.bgFloating.innerHTML = '';

    // Decide items by theme
    let icons = ['☁️', '🔔', '🎈', '☁️'];
    if (theme === 'doraemon') {
      icons = ['☁️', '🔔', '🎈', '☁️', '🔵'];
    } else if (theme === 'squidgame') {
      icons = ['◯', '△', '☐', '🦑', '💖', '📦'];
    } else if (theme === 'shinchan') {
      icons = ['⭐', '🦖', '🍬', '✨', '🐶', '🍑'];
    } else if (theme === 'tomjerry') {
      icons = ['🧀', '🐾', '🥛', '🧀', '🐭', '🐱'];
    }

    const maxItems = 12;
    for (let i = 0; i < maxItems; i++) {
      const item = document.createElement('div');
      item.className = 'floating-item';
      item.textContent = icons[Math.floor(Math.random() * icons.length)];
      
      // Randomize layout properties
      item.style.left = `${Math.random() * 100}vw`;
      // Stagger start delays so they enter progressively
      item.style.animationDelay = `${Math.random() * -14}s`;
      item.style.animationDuration = `${10 + Math.random() * 10}s`;
      
      const scale = 0.5 + Math.random() * 0.8;
      item.style.transform = `scale(${scale})`;
      item.style.opacity = `${0.04 + Math.random() * 0.12}`;
      
      this.bgFloating.appendChild(item);
    }
  }

  /* --- Procedural Wall Graphics Drawing --- */
  drawMazeWalls(ctx) {
    if (!this.state.mazeWalls || this.state.mazeWalls.length === 0) return;
    
    const size = this.cellSize;
    
    ctx.save();
    
    // Custom style per theme
    this.state.mazeWalls.forEach(wall => {
      const wx = wall.x * size;
      const wy = wall.y * size;
      
      if (this.state.theme === 'doraemon') {
        // Doraemon Wall: Blue brick blocks with white mortar lines
        ctx.fillStyle = '#007acc';
        ctx.strokeStyle = '#e8f3fc';
        ctx.lineWidth = 1;
        ctx.fillRect(wx, wy, size, size);
        ctx.strokeRect(wx, wy, size, size);
        
        // Brick horizontal division line
        ctx.beginPath();
        ctx.moveTo(wx, wy + size / 2);
        ctx.lineTo(wx + size, wy + size / 2);
        ctx.stroke();
        
        // Mortar vertical marks
        ctx.beginPath();
        ctx.moveTo(wx + size * 0.3, wy);
        ctx.lineTo(wx + size * 0.3, wy + size / 2);
        ctx.moveTo(wx + size * 0.7, wy + size / 2);
        ctx.lineTo(wx + size * 0.7, wy + size);
        ctx.stroke();

      } else if (this.state.theme === 'squidgame') {
        // Squid Game Wall: Magenta block with diagonal hazard stripes
        ctx.fillStyle = '#ff007f';
        ctx.fillRect(wx, wy, size, size);
        
        ctx.strokeStyle = '#0f0f12';
        ctx.lineWidth = 2.5;
        
        // Diagonal warning stripes
        ctx.beginPath();
        ctx.moveTo(wx, wy + 8);
        ctx.lineTo(wx + 8, wy);
        ctx.moveTo(wx, wy + size);
        ctx.lineTo(wx + size, wy);
        ctx.moveTo(wx + 12, wy + size);
        ctx.lineTo(wx + size, wy + 12);
        ctx.stroke();

      } else if (this.state.theme === 'shinchan') {
        // Shinchan Wall: Green hedge / bushes
        ctx.fillStyle = '#2db83d';
        ctx.strokeStyle = '#1b7a26';
        ctx.lineWidth = 1;
        
        // Draw overlapping circular leaf arcs
        ctx.beginPath();
        ctx.arc(wx + size * 0.25, wy + size * 0.25, size * 0.3, 0, Math.PI * 2);
        ctx.arc(wx + size * 0.75, wy + size * 0.25, size * 0.3, 0, Math.PI * 2);
        ctx.arc(wx + size * 0.25, wy + size * 0.75, size * 0.3, 0, Math.PI * 2);
        ctx.arc(wx + size * 0.75, wy + size * 0.75, size * 0.3, 0, Math.PI * 2);
        ctx.arc(wx + size * 0.5, wy + size * 0.5, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

      } else if (this.state.theme === 'tomjerry') {
        // Tom & Jerry Wall: Woodgrain cabinet panels
        ctx.fillStyle = '#7a4b1b'; // Wooden brown
        ctx.fillRect(wx, wy, size, size);
        
        ctx.strokeStyle = '#4a2c0f'; // Dark wood grain lines
        ctx.lineWidth = 1.2;
        ctx.strokeRect(wx + 2, wy + 2, size - 4, size - 4);
        
        // Subtle vertical wood fiber arcs
        ctx.beginPath();
        ctx.arc(wx - size * 0.5, wy + size * 0.5, size * 0.9, Math.PI * 1.8, Math.PI * 2.2);
        ctx.stroke();
      }
    });
    
    ctx.restore();
  }

  /* --- Maze Map Builders --- */
  createBoxMaze() {
    const list = [];
    // Top border rows
    for (let x = 6; x <= 23; x++) {
      if (x !== 14 && x !== 15) { // Leave a center gap
        list.push({ x, y: 5 });
      }
    }
    // Bottom border rows
    for (let x = 6; x <= 23; x++) {
      if (x !== 14 && x !== 15) { // Leave a center gap
        list.push({ x, y: 18 });
      }
    }
    // Left vertical columns
    for (let y = 6; y <= 17; y++) {
      if (y !== 11 && y !== 12) { // Leave vertical gap
        list.push({ x: 6, y });
      }
    }
    // Right vertical columns
    for (let y = 6; y <= 17; y++) {
      if (y !== 11 && y !== 12) { // Leave vertical gap
        list.push({ x: 23, y });
      }
    }
    return list;
  }

  createCrossMaze() {
    const list = [];
    // Vertical line down center column 15 (excluding center grid space)
    for (let y = 4; y <= 19; y++) {
      if (y < 9 || y > 14) {
        list.push({ x: 15, y });
      }
    }
    // Horizontal line across center row 12
    for (let x = 6; x <= 23; x++) {
      if (x < 12 || x > 17) {
        list.push({ x, y: 12 });
      }
    }
    return list;
  }

  createTunnelsMaze() {
    const list = [];
    // Column 1
    for (let y = 4; y <= 19; y++) {
      if (y !== 11 && y !== 12) {
        list.push({ x: 8, y });
      }
    }
    // Column 2
    for (let y = 4; y <= 19; y++) {
      if (y !== 11 && y !== 12) {
        list.push({ x: 21, y });
      }
    }
    return list;
  }

  createSpiralMaze() {
    const list = [];
    // Top border
    for (let x = 4; x <= 25; x++) list.push({ x, y: 4 });
    // Right border
    for (let y = 5; y <= 19; y++) list.push({ x: 25, y });
    // Bottom border
    for (let x = 4; x <= 24; x++) list.push({ x, y: 19 });
    // Left inner vertical
    for (let y = 8; y <= 18; y++) list.push({ x: 4, y });
    // Top inner horizontal
    for (let x = 5; x <= 21; x++) list.push({ x, y: 8 });
    // Right inner vertical
    for (let y = 9; y <= 15; y++) list.push({ x: 21, y });
    // Bottom inner horizontal
    for (let x = 8; x <= 20; x++) list.push({ x, y: 15 });
    return list;
  }
}

/* --- Round rectangle canvas helper --- */
function drawRoundRect(ctx, x, y, width, height, radius) {
  if (width < 2 * radius) radius = width / 2;
  if (height < 2 * radius) radius = height / 2;
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
}

/* ==========================================================================
   PARTICLE CLASS
   ========================================================================== */
class Particle {
  constructor(x, y, vx, vy, color) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.alpha = 1.0;
    this.decay = 0.035 + Math.random() * 0.02;
    this.size = 2 + Math.random() * 3;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.96; // drag
    this.vy *= 0.96;
    this.alpha -= this.decay;
    return this.alpha > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 4;
    ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
    ctx.restore();
  }
}

/* ==========================================================================
   SYNTHESIZER SOUND ENGINE (Web Audio API)
   ========================================================================== */
class SoundEngine {
  constructor() {
    this.ctx = null;
  }

  initAudio() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      this.ctx = new AudioContext();
    }
  }

  playOscillator(freqStart, freqEnd, duration, type = 'triangle', volume = 0.15) {
    if (!this.ctx) return;
    
    // Resume context if suspended (browser security blocks audio until click)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, this.ctx.currentTime);
    if (freqEnd && freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, this.ctx.currentTime + duration);
    }

    // Set Volume Envelope
    gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playMove(enabled) {
    if (!enabled) return;
    // Tiny low frequency pop sound
    this.playOscillator(120, 60, 0.05, 'triangle', 0.1);
  }

  playEat(isGolden, enabled) {
    if (!enabled) return;
    
    if (isGolden) {
      // Cute golden bell arpeggio twinkle sound
      const time = this.ctx ? this.ctx.currentTime : 0;
      this.playOscillator(600, 1200, 0.12, 'sine', 0.25);
      setTimeout(() => {
        this.playOscillator(900, 1800, 0.15, 'sine', 0.25);
      }, 70);
    } else {
      // Standard rising pitch beep
      this.playOscillator(300, 750, 0.12, 'square', 0.15);
    }
  }

  playCrash(enabled) {
    if (!enabled) return;
    if (!this.ctx) return;

    // Mixed noise and low sine pulse
    const now = this.ctx.currentTime;
    
    // Low rumble frequency
    this.playOscillator(150, 20, 0.5, 'sine', 0.35);

    // Short noise splash
    try {
      const bufferSize = this.ctx.sampleRate * 0.25; // 0.25s duration
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(50, now + 0.25);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      
      noise.start();
      noise.stop(now + 0.25);
    } catch (e) {
      // Fallback if buffer creation fails
      this.playOscillator(100, 10, 0.3, 'sawtooth', 0.2);
    }
  }

  playPause(enabled) {
    if (!enabled) return;
    // Falling tone
    this.playOscillator(440, 220, 0.15, 'sine', 0.15);
  }

  playResume(enabled) {
    if (!enabled) return;
    // Rising tone
    this.playOscillator(220, 440, 0.15, 'sine', 0.15);
  }

  playClick() {
    // Menu click is always enabled when clicking buttons
    this.playOscillator(600, 600, 0.05, 'triangle', 0.1);
  }

  playGameOver(enabled) {
    if (!enabled) return;
    // Downward sad retro sequence
    const t = 120; // note duration
    this.playOscillator(330, 330, 0.15, 'triangle', 0.18);
    setTimeout(() => this.playOscillator(294, 294, 0.15, 'triangle', 0.18), t);
    setTimeout(() => this.playOscillator(262, 262, 0.15, 'triangle', 0.18), t * 2);
    setTimeout(() => this.playOscillator(196, 130, 0.45, 'sawtooth', 0.15), t * 3);
  }

  playHighScore(enabled) {
    if (!enabled) return;
    // Happy retro arpeggio sequence
    const t = 100;
    this.playOscillator(262, 262, 0.08, 'square', 0.15);
    setTimeout(() => this.playOscillator(330, 330, 0.08, 'square', 0.15), t);
    setTimeout(() => this.playOscillator(392, 392, 0.08, 'square', 0.15), t * 2);
    setTimeout(() => this.playOscillator(523, 1046, 0.35, 'square', 0.12), t * 3);
  }
}

// Initialise Game on Window Load
window.addEventListener('load', () => {
  window.GameInstance = new SlithifyGame();
});
