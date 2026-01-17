// sketch.js - Complete Real Estate & Blockchain Audio Visualizer
let soundFiles = {};
let currentPart = 'part1';
let fft;
let spectrum = [];

// GitHub repository details (UPDATE THESE IF NEEDED)
const GITHUB_USER = 'nidalghETF';
const GITHUB_REPO = 'nidalghETF';
const GITHUB_BRANCH = 'main';

// Visualization parameters
const BUILDING_COUNT = 32;
const BUILDING_COLOR = [0, 180, 255];
const NODE_COUNT = 18;
const NODE_COLOR = [0, 255, 150];

let buildings = [];
let blockchainNodes = [];
let blockchainConnections = [];
let audioReady = false;

function setup() {
    console.log('Setting up visualizer...');
    
    // Create canvas
    const canvasContainer = document.getElementById('canvasContainer');
    const canvas = createCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
    canvas.parent('canvasContainer');
    
    // Initialize FFT for audio analysis
    fft = new p5.FFT(0.8, 512);
    
    // Build audio URLs
    // Build audio URLs - REPLACE WITH YOUR GOOGLE DRIVE LINKS
const audioURLs = {
    part1: 'https://drive.google.com/uc?export=download&id=1mC3gl5l7dD1mlJ5qhMsaneiu1lV5jWNg',
    part2: 'https://drive.google.com/uc?export=download&id=1fwlHhXz6OsGYgsMYFQYUNjMNJMdQtcnV'
};
    
    console.log('Loading audio from:', audioURLs);
    
    // Load audio files
    loadAudioFiles(audioURLs);
    
    // Initialize visualization
    initVisualization();
    
    // Setup button handlers
    setupButtonHandlers();
    
    // Expose functions to global scope for HTML buttons
    window.playAudio = playAudio;
    window.pauseAudio = pauseAudio;
    window.switchPart = switchPart;
    window.getCurrentAudio = () => soundFiles[currentPart];
    
    // Handle window resize
    window.addEventListener('resize', () => {
        resizeCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
    });
}

async function loadAudioFiles(urls) {
    try {
        console.log('Starting audio load...');
        
        // Load each audio file
        const loadPromises = [];
        
        for (const [part, url] of Object.entries(urls)) {
            loadPromises.push(
                new Promise((resolve) => {
                    soundFiles[part] = loadSound(
                        url,
                        () => {
                            console.log(`✓ Loaded: ${part}`);
                            soundFiles[part].setVolume(0.8);
                            resolve(true);
                        },
                        (error) => {
                            console.error(`✗ Failed to load ${part}:`, error);
                            console.log('Trying fallback method...');
                            loadAudioFallback(part, url).then(resolve);
                        }
                    );
                })
            );
        }
        
        await Promise.all(loadPromises);
        audioReady = true;
        console.log('✅ All audio files ready!');
        
        // Connect first part to FFT
        if (soundFiles.part1) {
            soundFiles.part1.connect(fft);
        }
        
        // Update UI
        document.getElementById('partIndicator').textContent = 'Part 1/2';
        
    } catch (error) {
        console.error('Audio loading failed completely:', error);
        alert('Failed to load audio files. Check console for details.');
    }
}

async function loadAudioFallback(part, url) {
    console.log(`Trying fallback method for ${part}...`);
    
    return new Promise((resolve) => {
        const audioEl = new Audio();
        audioEl.crossOrigin = 'anonymous';
        audioEl.preload = 'auto';
        audioEl.src = url;
        
        audioEl.addEventListener('canplaythrough', () => {
            console.log(`✓ Fallback loaded: ${part}`);
            // Properly create a p5.SoundFile from the audio element
            const soundFile = new p5.SoundFile(audioEl, () => {
                soundFiles[part] = soundFile;
                soundFiles[part].setVolume(0.8);
                resolve(true);
            });
        });
        
        audioEl.addEventListener('error', (e) => {
            console.error(`✗ Fallback failed for ${part}:`, e);
            // Create a silent placeholder to prevent crashes
            soundFiles[part] = new p5.SoundFile(); 
            resolve(false);
        });
        
        // Start loading
        audioEl.load();
    });
}
        
        audioEl.addEventListener('error', (e) => {
            console.error(`Fallback failed for ${part}:`, e);
            // Create a silent placeholder
            soundFiles[part] = {
                play: () => console.log('Placeholder play'),
                pause: () => console.log('Placeholder pause'),
                stop: () => console.log('Placeholder stop'),
                isPlaying: () => false,
                setVolume: () => {},
                connect: () => {},
                disconnect: () => {}
            };
            resolve(false);
        });
        
        // Start loading
        audioEl.load();
    });
}

function initVisualization() {
    // Initialize buildings (real estate skyline)
    buildings = [];
    for (let i = 0; i < BUILDING_COUNT; i++) {
        buildings.push({
            x: (i / BUILDING_COUNT) * width,
            width: width / BUILDING_COUNT * 0.8,
            baseHeight: height * 0.6,
            color: BUILDING_COLOR
        });
    }
    
    // Initialize blockchain nodes
    blockchainNodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
        blockchainNodes.push({
            x: random(width * 0.2, width * 0.8),
            y: random(height * 0.2, height * 0.5),
            size: random(8, 20),
            pulse: 0
        });
    }
    
    // Create connections between nodes
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
    
    console.log('Visualization initialized');
}

function setupButtonHandlers() {
    // Part selection buttons
    document.getElementById('part1Btn').addEventListener('click', () => {
        console.log('Part 1 clicked');
        switchPart('part1');
    });
    
    document.getElementById('part2Btn').addEventListener('click', () => {
        console.log('Part 2 clicked');
        switchPart('part2');
    });
    
    // Play/Pause buttons
    document.getElementById('playBtn').addEventListener('click', playAudio);
    document.getElementById('pauseBtn').addEventListener('click', pauseAudio);
    
    // Restart button
    document.getElementById('restartBtn').addEventListener('click', () => {
        if (audioReady && soundFiles[currentPart]) {
            soundFiles[currentPart].stop();
            soundFiles[currentPart].play();
        }
    });
    
    // Volume control
    document.getElementById('volumeSlider').addEventListener('input', (e) => {
        if (audioReady && soundFiles[currentPart]) {
            const volume = e.target.value / 100;
            soundFiles[currentPart].setVolume(volume);
            console.log('Volume set to:', volume);
        }
    });
    
    console.log('Button handlers set up');
}

function playAudio() {
    if (!audioReady) {
        console.log('Audio not ready yet');
        return;
    }
    
    if (soundFiles[currentPart]) {
        console.log('Playing audio:', currentPart);
        soundFiles[currentPart].play();
    } else {
        console.error('No audio file for:', currentPart);
    }
}

function pauseAudio() {
    if (audioReady && soundFiles[currentPart]) {
        console.log('Pausing audio');
        soundFiles[currentPart].pause();
    }
}

function switchPart(partName) {
    if (!audioReady) {
        console.log('Audio not ready for switching');
        return;
    }
    
    if (partName !== currentPart && soundFiles[partName]) {
        console.log(`Switching from ${currentPart} to ${partName}`);
        
        // Stop current audio if playing
        if (soundFiles[currentPart] && soundFiles[currentPart].isPlaying()) {
            soundFiles[currentPart].pause();
        }
        
        // Disconnect old from FFT
        soundFiles[currentPart].disconnect();
        
        // Switch to new part
        currentPart = partName;
        
        // Connect new part to FFT
        soundFiles[currentPart].connect(fft);
        
        // Update UI
        document.querySelectorAll('.part-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`part${partName === 'part1' ? '1' : '2'}Btn`).classList.add('active');
        document.getElementById('partIndicator').textContent = 
            currentPart === 'part1' ? 'Part 1/2' : 'Part 2/2';
        
        console.log('Switched successfully');
    }
}

function draw() {
    // Show loading message if audio isn't ready
    if (!audioReady) {
        background(0);
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(20);
        text('Loading audio files...', width/2, height/2);
        textSize(14);
        text('This may take a moment on GitHub Pages', width/2, height/2 + 30);
        return;
    }
    
    // Dark gradient background
    background(10, 14, 23);
    
    // Get frequency spectrum
    if (soundFiles[currentPart] && soundFiles[currentPart].isPlaying()) {
        spectrum = fft.analyze();
    } else {
        // Create dummy spectrum when not playing
        spectrum = Array(512).fill(50).map((val, i) => {
            return val + 50 * sin(frameCount * 0.01 + i * 0.1);
        });
    }
    
    // Draw visualization components
    drawSkyline();
    drawBlockchainNetwork();
    drawInfoOverlay();
}

// ========== VISUALIZATION FUNCTIONS ==========

function drawSkyline() {
    noStroke();
    
    for (let i = 0; i < BUILDING_COUNT; i++) {
        const building = buildings[i];
        
        // Map building index to frequency range (low frequencies for buildings)
        const freqIndex = floor(map(i, 0, BUILDING_COUNT, 0, spectrum.length * 0.3));
        const amplitude = spectrum[freqIndex] / 255;
        
        // Calculate building height based on audio
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
        
        // Draw building windows
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
    // Calculate high frequency energy (for blockchain activity)
    const highFreqStart = floor(spectrum.length * 0.7);
    let highFreqEnergy = 0;
    for (let i = highFreqStart; i < spectrum.length; i++) {
        highFreqEnergy += spectrum[i];
    }
    highFreqEnergy = highFreqEnergy / max(1, spectrum.length - highFreqStart);
    
    // Draw connections between nodes
    for (let conn of blockchainConnections) {
        const fromNode = blockchainNodes[conn.from];
        const toNode = blockchainNodes[conn.to];
        
        const pulseFactor = 0.5 + highFreqEnergy / 255;
        const alpha = 50 + conn.strength * highFreqEnergy;
        
        stroke(NODE_COLOR[0], NODE_COLOR[1], NODE_COLOR[2], alpha);
        strokeWeight(1 + pulseFactor * 2);
        line(fromNode.x, fromNode.y, toNode.x, toNode.y);
    }
    
    // Draw blockchain nodes
    for (let i = 0; i < blockchainNodes.length; i++) {
        const node = blockchainNodes[i];
        
        // Update pulse based on audio
        node.pulse = highFreqEnergy / 255 * 15;
        
        // Draw node outer circle
        fill(NODE_COLOR[0], NODE_COLOR[1], NODE_COLOR[2], 200);
        noStroke();
        ellipse(node.x, node.y, node.size + node.pulse);
        
        // Draw node inner circle
        fill(255, 255, 255, 150);
        ellipse(node.x, node.y, (node.size + node.pulse) * 0.5);
        
        // Draw node label (simulating blockchain address)
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
    // Calculate frequency energies
    const lowFreqEnergy = spectrum.slice(0, spectrum.length * 0.3)
        .reduce((a, b) => a + b, 0) / max(1, spectrum.length * 0.3);
    const highFreqEnergy = spectrum.slice(spectrum.length * 0.7)
        .reduce((a, b) => a + b, 0) / max(1, spectrum.length * 0.3);
    
    // Real Estate indicator (low freq/bass)
    fill(BUILDING_COLOR[0], BUILDING_COLOR[1], BUILDING_COLOR[2], 150);
    rect(20, 20, 180, 40, 8);
    fill(255);
    textSize(14);
    textAlign(LEFT);
    text(`🏢 Real Estate (Bass): ${floor(lowFreqEnergy)}/255`, 30, 45);
    
    // Blockchain indicator (high freq/treble)
    fill(NODE_COLOR[0], NODE_COLOR[1], NODE_COLOR[2], 150);
    rect(20, 70, 180, 40, 8);
    fill(255);
    text(`⛓️ Blockchain (Treble): ${floor(highFreqEnergy)}/255`, 30, 95);
    
    // Status indicator
    fill(255, 255, 255, 200);
    textSize(14);
    textAlign(RIGHT);
    
    let statusText;
    if (!audioReady) {
        statusText = '🔄 Loading...';
    } else if (soundFiles[currentPart] && soundFiles[currentPart].isPlaying()) {
        statusText = '▶ Playing';
    } else {
        statusText = '⏸ Paused';
    }
    
    text(`Status: ${statusText}`, width - 20, 30);
    
    // Current time indicator
    if (audioReady && soundFiles[currentPart]) {
        const currentTime = soundFiles[currentPart].currentTime();
        const duration = soundFiles[currentPart].duration();
        const mins = floor(currentTime / 60);
        const secs = floor(currentTime % 60);
        
        textAlign(CENTER);
        textSize(12);
        fill(200, 200, 255);
        text(
            `Time: ${mins}:${secs < 10 ? '0' : ''}${secs}`, 
            width / 2, 
            height - 20
        );
    }
}

function windowResized() {
    const canvasContainer = document.getElementById('canvasContainer');
    if (canvasContainer) {
        resizeCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
    }
}

// Global function for testing
console.log('sketch.js loaded successfully');
