// sketch.js - Multi-part Audio Visualizer
let soundFiles = {};
let currentPart = 'part1';
let fft;
let spectrum = [];

// Visualization parameters (same as before)
const BUILDING_COUNT = 32;
const NODE_COUNT = 18;
let buildings = [];
let blockchainNodes = [];
let blockchainConnections = [];

// Preload both audio files
function preload() {
    soundFiles.part1 = loadSound('audio-part1.mp3');
    soundFiles.part2 = loadSound('audio-part2.mp3');
}

function setup() {
    const canvasContainer = document.getElementById('canvasContainer');
    const canvas = createCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
    canvas.parent('canvasContainer');
    
    // Initialize FFT with first part
    fft = new p5.FFT(0.8, 1024);
    soundFiles.part1.connect(fft);
    
    // Make functions globally accessible
    window.playAudio = playAudio;
    window.pauseAudio = pauseAudio;
    window.switchPart = switchPart;
    window.getCurrentAudio = () => soundFiles[currentPart];
    
    // Initialize visualization elements
    initVisualization();
    
    // Setup part switching
    setupPartSwitching();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        resizeCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
    });
}

function initVisualization() {
    buildings = [];
    for (let i = 0; i < BUILDING_COUNT; i++) {
        buildings.push({
            x: (i / BUILDING_COUNT) * width,
            width: width / BUILDING_COUNT * 0.8,
            baseHeight: height * 0.6,
            color: [0, 180, 255]
        });
    }
    
    blockchainNodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
        blockchainNodes.push({
            x: random(width * 0.2, width * 0.8),
            y: random(height * 0.2, height * 0.5),
            size: random(8, 20),
            pulse: 0
        });
    }
    
    blockchainConnections = [];
    for (let i = 0; i < blockchainNodes.length; i++) {
        const connectionCount = floor(random(1, 4));
        for (let j = 0; j < connectionCount; j++) {
            const targetIndex = floor(random(blockchainNodes.length));
            if (targetIndex !== i) {
                blockchainConnections.push({
                    from: i,
                    to: targetIndex,
                    strength: random(0.3, 1)
                });
            }
        }
    }
}

function setupPartSwitching() {
    // This connects to the buttons in the HTML
    document.querySelectorAll('.part-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetPart = this.dataset.file.includes('part1') ? 'part1' : 'part2';
            switchPart(targetPart);
            
            // Update active button styles
            document.querySelectorAll('.part-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function switchPart(partName) {
    // Stop current audio
    if (soundFiles[currentPart].isPlaying()) {
        soundFiles[currentPart].stop();
    }
    
    // Disconnect old from FFT
    soundFiles[currentPart].disconnect();
    
    // Switch to new part
    currentPart = partName;
    soundFiles[partName].connect(fft);
    
    // Update UI indicator
    document.getElementById('partIndicator').textContent = 
        partName === 'part1' ? 'Part 1/2' : 'Part 2/2';
    
    console.log(`Switched to ${partName}`);
}

function playAudio() {
    soundFiles[currentPart].play();
}

function pauseAudio() {
    soundFiles[currentPart].pause();
}

function draw() {
    background(10, 14, 23);
    
    // Get spectrum from current audio
    spectrum = fft.analyze();
    
    drawSkyline();
    drawBlockchainNetwork();
    drawInfoOverlay();
}

// Keep all the drawing functions exactly the same as before
// (drawSkyline, drawBuildingWindows, drawBlockchainNetwork, etc.)

function drawInfoOverlay() {
    // Add part indicator to overlay
    fill(255, 255, 255, 200);
    textSize(16);
    textAlign(LEFT);
    text(`Playing: ${currentPart === 'part1' ? 'Part 1 (0:00-22:00)' : 'Part 2 (22:00-44:00)'}`, 20, height - 30);
    
    // Rest of overlay code remains the same...
}
