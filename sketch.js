// TLB Visualizer - Single Audio File Version
// Author: Nidal via Gemini
// ---------------------------------------------

let song;
let fft;
let isLoaded = false;

// THE AUDIO LINK (Combined File)
const AUDIO_URL = 'https://drive.google.com/uc?export=download&id=1z8DbrpZmgGi3PuCBhTK0cpuawqhKPAZy';

// Visuals: Building Arrays
let buildings = [];
const NUM_BUILDINGS = 20;

// Visuals: Blockchain Nodes
let nodes = [];
const NUM_NODES = 15;

function preload() {
    // We use a callback to handle when it's ready
    // We also set 'p5.sound' to handle the Google Drive redirect
    soundFormats('mp3', 'wav');
    
    // Attempt to load. 
    // Note: 'loadSound' works best if we trigger it, but for large files
    // on Drive, we might need to wait.
    song = loadSound(AUDIO_URL, 
        () => {
            console.log("Audio Loaded Successfully!");
            isLoaded = true;
            document.getElementById('loadingScreen').style.opacity = 0;
            setTimeout(() => {
                document.getElementById('loadingScreen').style.display = 'none';
            }, 500);
            
            // Set initial duration on UI
            const dur = song.duration();
            document.getElementById('totalTime').innerText = formatTime(dur);
            document.getElementById('progressBar').max = dur;
        },
        (err) => {
            console.error("Error loading audio:", err);
            document.querySelector('#loadingScreen h3').innerText = "ERROR LOADING AUDIO. REFRESH PAGE.";
        }
    );
}

function setup() {
    // Create Canvas to fill the container
    const container = document.getElementById('canvasContainer');
    const canvas = createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent('canvasContainer');

    // Initialize FFT (Fast Fourier Transform)
    fft = new p5.FFT(0.8, 64); // Smoothing 0.8, 64 bins

    // Initialize Buildings (Bass/Low Mids)
    let bWidth = width / NUM_BUILDINGS;
    for (let i = 0; i < NUM_BUILDINGS; i++) {
        buildings.push({
            x: i * bWidth,
            w: bWidth - 2,
            h: random(50, 200),
            color: color(0, 243, 255, 150) // Cyan
        });
    }

    // Initialize Nodes (Treble/Highs)
    for (let i = 0; i < NUM_NODES; i++) {
        nodes.push({
            x: random(width),
            y: random(height / 2),
            size: random(5, 15),
            vx: random(-0.5, 0.5),
            vy: random(-0.5, 0.5)
        });
    }

    // Setup UI Controls
    setupUI();
}

function draw() {
    background(10, 14, 23); // Dark Navy

    if (!isLoaded) return;

    // Analyze Audio
    let spectrum = fft.analyze();
    let bassEnergy = fft.getEnergy("bass");
    let midEnergy = fft.getEnergy("mid");
    let trebleEnergy = fft.getEnergy("treble");

    // 1. DRAW BLOCKCHAIN NODES (Background Network)
    stroke(0, 255, 157, 50); // Faint Green Lines
    for (let i = 0; i < nodes.length; i++) {
        let n = nodes[i];
        
        // Move nodes
        n.x += n.vx;
        n.y += n.vy;

        // Bounce edges
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height/2) n.vy *= -1;

        // Draw connections
        for (let j = i + 1; j < nodes.length; j++) {
            let other = nodes[j];
            let d = dist(n.x, n.y, other.x, other.y);
            if (d < 150) {
                line(n.x, n.y, other.x, other.y);
            }
        }

        // Draw Node (Reacts to Treble)
        noStroke();
        fill(0, 255, 157, map(trebleEnergy, 0, 255, 50, 255));
        circle(n.x, n.y, n.size + map(trebleEnergy, 0, 255, 0, 10));
    }

    // 2. DRAW CITYSCAPE (Reacts to Bass/Mid)
    noStroke();
    for (let i = 0; i < buildings.length; i++) {
        let b = buildings[i];
        
        // Calculate height based on spectrum bin
        // Map 'i' to a spectrum index
        let specIndex = floor(map(i, 0, NUM_BUILDINGS, 0, spectrum.length/2));
        let amp = spectrum[specIndex];
        
        // Base height + Audio reaction
        let currentH = b.h + map(amp, 0, 255, 0, height/2);

        // Draw Building
        // Gradient effect using alpha
        fill(0, 243, 255, map(amp, 0, 255, 50, 200)); 
        rect(b.x, height - currentH, b.w, currentH);
        
        // Building "Windows" or detail
        fill(255, 255, 255, 30);
        rect(b.x + 5, height - currentH + 10, b.w - 10, 5);
    }

    // 3. UI UPDATES (Progress Bar Sync)
    if (song.isPlaying()) {
        updateProgressBar();
    }
}

function windowResized() {
    resizeCanvas(document.getElementById('canvasContainer').offsetWidth, document.getElementById('canvasContainer').offsetHeight);
}

// ---------------------------------------
// UI LOGIC (Connecting HTML to P5)
// ---------------------------------------

function setupUI() {
    const playBtn = document.getElementById('playBtn');
    const restartBtn = document.getElementById('restartBtn');
    const slider = document.getElementById('progressBar');
    const volSlider = document.getElementById('volSlider');

    // Play/Pause Toggle
    playBtn.addEventListener('click', () => {
        if (!isLoaded) return;
        
        if (song.isPlaying()) {
            song.pause();
            playBtn.innerText = "PLAY";
            playBtn.classList.remove("playing");
        } else {
            song.play();
            playBtn.innerText = "PAUSE";
            playBtn.classList.add("playing");
        }
    });

    // Restart
    restartBtn.addEventListener('click', () => {
        if (!isLoaded) return;
        song.jump(0);
        if (!song.isPlaying()) {
            song.play();
            playBtn.innerText = "PAUSE";
        }
    });

    // Seek (Slider Drag)
    slider.addEventListener('input', () => {
        if (!isLoaded) return;
        song.jump(parseFloat(slider.value));
    });

    // Volume
    volSlider.addEventListener('input', () => {
        if(song) song.setVolume(parseFloat(volSlider.value));
    });
}

function updateProgressBar() {
    const slider = document.getElementById('progressBar');
    const timeDisplay = document.getElementById('currentTime');
    
    let curr = song.currentTime();
    slider.value = curr;
    timeDisplay.innerText = formatTime(curr);
}

function formatTime(seconds) {
    let m = floor(seconds / 60);
    let s = floor(seconds % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
}
