// sketch.js - Real Estate & Blockchain Audio Visualizer
let soundFile;
let fft;
let spectrum = [];
let buildings = [];
let blockchainNodes = [];
let blockchainConnections = [];

// Skyline (Real Estate) parameters
const BUILDING_COUNT = 32;
const BUILDING_COLOR = [0, 180, 255]; // Blue
const BUILDING_STROKE = [0, 120, 200];

// Blockchain network parameters
const NODE_COUNT = 18;
const NODE_COLOR = [0, 255, 150]; // Green
const NODE_STROKE = [0, 200, 100];
const MAX_CONNECTIONS = 3;

function preload() {
    // Load your audio file (replace 'your-audio.mp3' with your filename)
    soundFile = loadSound('your-audio.mp3');
}

function setup() {
    const canvasContainer = document.getElementById('canvasContainer');
    const canvas = createCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
    canvas.parent('canvasContainer');
    
    // Initialize FFT analysis
    fft = new p5.FFT(0.8, 1024);
    soundFile.connect(fft);
    
    // Make soundFile globally accessible for DOM controls
    window.soundFile = soundFile;
    
    // Initialize buildings (real estate skyline)
    for (let i = 0; i < BUILDING_COUNT; i++) {
        buildings.push({
            x: (i / BUILDING_COUNT) * width,
            width: width / BUILDING_COUNT * 0.8,
            baseHeight: height * 0.6,
            color: BUILDING_COLOR
        });
    }
    
    // Initialize blockchain nodes
    for (let i = 0; i < NODE_COUNT; i++) {
        blockchainNodes.push({
            x: random(width * 0.2, width * 0.8),
            y: random(height * 0.2, height * 0.5),
            size: random(8, 20),
            pulse: 0,
            connections: []
        });
    }
    
    // Create random connections between nodes (blockchain network)
    for (let i = 0; i < blockchainNodes.length; i++) {
        const node = blockchainNodes[i];
        const connectionCount = floor(random(1, MAX_CONNECTIONS + 1));
        for (let j = 0; j < connectionCount; j++) {
            const targetIndex = floor(random(blockchainNodes.length));
            if (targetIndex !== i && !node.connections.includes(targetIndex)) {
                node.connections.push(targetIndex);
                blockchainConnections.push({
                    from: i,
                    to: targetIndex,
                    strength: random(0.3, 1)
                });
            }
        }
    }
    
    // Handle window resizing
    window.addEventListener('resize', () => {
        resizeCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
    });
}

function draw() {
    // Dark gradient background
    background(10, 14, 23);
    
    // Get frequency spectrum
    spectrum = fft.analyze();
    
    // Draw real estate skyline (buildings)
    drawSkyline();
    
    // Draw blockchain network
    drawBlockchainNetwork();
    
    // Draw info overlay
    drawInfoOverlay();
}

function drawSkyline() {
    noStroke();
    for (let i = 0; i < BUILDING_COUNT; i++) {
        const building = buildings[i];
        
        // Use low-frequency bins (bass) for building height
        const freqIndex = floor(map(i, 0, BUILDING_COUNT, 0, spectrum.length * 0.3));
        const amplitude = spectrum[freqIndex] / 255;
        
        // Calculate building height
        const heightVariation = amplitude * height * 0.4;
        const buildingHeight = building.baseHeight + heightVariation;
        
        // Draw building
        fill(
            BUILDING_COLOR[0],
            BUILDING_COLOR[1],
            BUILDING_COLOR[2],
            180 + amplitude * 75
        );
        
        rect(
            building.x,
            height - buildingHeight,
            building.width,
            buildingHeight
        );
        
        // Draw building details (windows)
        drawBuildingWindows(building, buildingHeight, amplitude);
    }
}

function drawBuildingWindows(building, buildingHeight, amplitude) {
    const windowRows = floor(buildingHeight / 30);
    const windowCols = 4;
    const windowSize = building.width / (windowCols + 2);
    
    fill(255, 255, 200, 150 + amplitude * 100);
    for (let row = 0; row < windowRows; row++) {
        for (let col = 0; col < windowCols; col++) {
            // Animate windows with audio
            const blink = sin(frameCount * 0.05 + row * 0.5 + col * 0.3) > 0.8;
            if (blink) {
                rect(
                    building.x + (col + 1) * (building.width / (windowCols + 1)) - windowSize/2,
                    height - buildingHeight + row * 30 + 15,
                    windowSize * 0.8,
                    windowSize * 0.8
                );
            }
        }
    }
}

function drawBlockchainNetwork() {
    // Update node pulses based on high frequencies (treble)
    const highFreqStart = floor(spectrum.length * 0.7);
    let highFreqEnergy = 0;
    for (let i = highFreqStart; i < spectrum.length; i++) {
        highFreqEnergy += spectrum[i];
    }
    highFreqEnergy /= (spectrum.length - highFreqStart);
    
    // Draw connections first (so nodes appear on top)
    for (let conn of blockchainConnections) {
        const fromNode = blockchainNodes[conn.from];
        const toNode = blockchainNodes[conn.to];
        
        // Connection strength reacts to audio
        const pulseFactor = 0.5 + highFreqEnergy / 255;
        const alpha = 50 + conn.strength * highFreqEnergy;
        
        stroke(NODE_COLOR[0], NODE_COLOR[1], NODE_COLOR[2], alpha);
        strokeWeight(1 + pulseFactor * 2);
        line(fromNode.x, fromNode.y, toNode.x, toNode.y);
    }
    
    // Draw nodes
    for (let i = 0; i < blockchainNodes.length; i++) {
        const node = blockchainNodes[i];
        
        // Update pulse based on high frequencies
        node.pulse = highFreqEnergy / 255 * 15;
        
        // Draw node
        fill(NODE_COLOR[0], NODE_COLOR[1], NODE_COLOR[2], 200);
        noStroke();
        ellipse(node.x, node.y, node.size + node.pulse);
        
        // Draw node inner circle
        fill(255, 255, 255, 150);
        ellipse(node.x, node.y, (node.size + node.pulse) * 0.5);
        
        // Draw node ID (simulating blockchain address)
        fill(255, 255, 255, 100);
        textSize(10);
        textAlign(CENTER);
        text(shortenAddress(i), node.x, node.y + node.size + 15);
    }
}

function shortenAddress(index) {
    const hex = index.toString(16).toUpperCase();
    return `0x${hex}...${hex}`;
}

function drawInfoOverlay() {
    // Draw frequency energy indicators
    const lowFreqEnergy = spectrum.slice(0, spectrum.length * 0.3).reduce((a, b) => a + b) / (spectrum.length * 0.3);
    const highFreqEnergy = spectrum.slice(spectrum.length * 0.7).reduce((a, b) => a + b) / (spectrum.length * 0.3);
    
    // Real estate indicator (low freq)
    fill(BUILDING_COLOR[0], BUILDING_COLOR[1], BUILDING_COLOR[2], 150);
    rect(20, 20, 150, 40, 8);
    fill(255);
    textSize(14);
    textAlign(LEFT);
    text(`Real Estate (Bass): ${floor(lowFreqEnergy)}`, 30, 45);
    
    // Blockchain indicator (high freq)
    fill(NODE_COLOR[0], NODE_COLOR[1], NODE_COLOR[2], 150);
    rect(20, 70, 150, 40, 8);
    fill(255);
    text(`Blockchain (Treble): ${floor(highFreqEnergy)}`, 30, 95);
    
    // Playback status
    fill(255, 255, 255, 100);
    textSize(12);
    textAlign(RIGHT);
    const status = soundFile.isPlaying() ? '▶ Playing' : '⏸ Paused';
    text(`Status: ${status}`, width - 20, 30);
}

function windowResized() {
    const canvasContainer = document.getElementById('canvasContainer');
    resizeCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
}
