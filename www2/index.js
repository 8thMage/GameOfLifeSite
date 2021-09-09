import init, { Universe, Cell, start } from "../pkg/wasm_game_of_life.js";
const initOutput = await init("../pkg/wasm_game_of_life_bg.wasm");
// import { Universe, Cell, start } from "../pkg/wasm_game_of_life.js";
// import { memory } from "../pkg/wasm_game_of_life_bg.wasm";

const fps = new class {
    constructor() {
        this.fps = document.getElementById("fps");
        this.frames = [];
        this.lastFrameTimeStamp = performance.now();
    }


    render() {
        // Convert the delta time since the last frame render into a measure
        // of frames per second.
        const now = performance.now();
        const delta = now - this.lastFrameTimeStamp;
        this.lastFrameTimeStamp = now;
        const fps = 1 / delta * 1000;

        // Save only the latest 100 timings.
        this.frames.push(fps);
        if (this.frames.length > 100) {
            this.frames.shift();
        }

        // Find the max, min, and mean of our 100 latest timings.
        let min = Infinity;
        let max = -Infinity;
        let sum = 0;
        for (let i = 0; i < this.frames.length; i++) {
            sum += this.frames[i];
            min = Math.min(this.frames[i], min);
            max = Math.max(this.frames[i], max);
        }
        let mean = sum / this.frames.length;

        // Render the statistics.
        this.fps.textContent = `
  Frames per Second:
           latest = ${Math.round(fps)}
  avg of last 100 = ${Math.round(mean)}
  min of last 100 = ${Math.round(min)}
  max of last 100 = ${Math.round(max)}
  `.trim();
    }
};

let animationId = null;
const CELL_SIZE = 5
const GRID_COLOR = "#CCCCCC"
const DEAD_COLOR = "#FFFFFF"
const Alive_COLOR = "#000000"

const canvas = document.getElementById("game-of-life-canvas");
const universe = Universe.new();
const width = universe.width();
const height = universe.height();
canvas.height = (CELL_SIZE + 1) * height + 1
canvas.width = (CELL_SIZE + 1) * width + 1
// const ctx = canvas.getContext('2d')

const playButton = document.getElementById("play-pause");

const context = start();

const play = () => {
    playButton.textContent = "⏸";
    renderLoop();
}

const pause = () => {
    debugger;
    playButton.textContent = "▶";
    cancelAnimationFrame(animationId);
    animationId = null;
}

playButton.addEventListener("click", event => {
    if (isPaused()) {
        play();
    } else {
        pause();
    }
});

const drawGrid = () => {
    ctx.beginPath();
    ctx.strokeStyle = GRID_COLOR;
    for (let i = 0; i <= width; i++) {
        ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
        ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
    }

    for (let i = 0; i <= height; i++) {
        ctx.moveTo(0, i * (CELL_SIZE + 1) + 1);
        ctx.lineTo((CELL_SIZE + 1) * width + 1, i * (CELL_SIZE + 1) + 1);
    }
    ctx.stroke();
}

const getIndex = (row, column) => {
    return column + row * width;
}

const drawCells = () => {
    const cellsPtr = universe.cells();
    const cells = new Uint8Array(memory.buffer, cellsPtr, width * height);
    ctx.beginPath()
    ctx.fillStyle = DEAD_COLOR
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const idx = getIndex(row, col);
            if (cells[idx] == Cell.Dead) {
                ctx.fillRect(
                    col * (CELL_SIZE + 1) + 1,
                    row * (CELL_SIZE + 1) + 1,
                    CELL_SIZE,
                    CELL_SIZE)
            }
        }
    }
    ctx.fillStyle = Alive_COLOR
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const idx = getIndex(row, col);
            if (cells[idx] == Cell.Alive) {
                ctx.fillRect(
                    col * (CELL_SIZE + 1) + 1,
                    row * (CELL_SIZE + 1) + 1,
                    CELL_SIZE,
                    CELL_SIZE)
            }
        }
    }
    
    ctx.stroke();
}

canvas.addEventListener("click", event => {
    const boundingRect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / boundingRect.width;
    const scaleY = canvas.height / boundingRect.height;
    const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
    const canvasTop = (event.clientY - boundingRect.top) * scaleY;
    const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
    const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);
    universe.toggle_cell(col, row);
    // drawGrid();
    // drawCells();
})

const isPaused = () => {
    return animationId == null;
}

const renderLoop = () => {
    fps.render();
    universe.tick();
    universe.render(context);
    // drawGrid();
    // drawCells();
    animationId = requestAnimationFrame(renderLoop);
};
play();
