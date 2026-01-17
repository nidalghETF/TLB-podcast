// TLB Visualizer - Archive.org Version
// ------------------------------------

let song;
let fft;
let isReady = false;

// YOUR DIRECT LINK FROM ARCHIVE.ORG
const AUDIO_URL = 'https://ia800505.us.archive.org/14/items/lebanon-real-estate-tokenization-bypasses-banks/Lebanon_Real_Estate_Tokenization_Bypasses_Banks.mp3';

// Visuals Setup
let buildings = [];
const NUM_BUILDINGS = 20;
let nodes = [];
const NUM_NODES = 15;

function setup() {
    // 1. Setup Canvas
    const container = document.getElementById('canvasContainer');
    const canvas = createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent('canvasContainer');

    // 2. Setup Audio (STREAMING)
    // We use createAudio for streaming large external files
    song = createAudio(AUDIO_URL);
    song.elt.crossOrigin = "anonymous"; // Essential for Visualizer to read data
    
    // When the stream connects and knows the duration:
    song.elt.onloadedmetadata = () => {
        console.log("Stream Connected!");
        isReady = true;
        
        // Hide loader
        const loader = document.getElementById('loadingScreen');
        if(loader) loader.style.display = 'none';

        // Update UI max time
        const dur = song.duration();
        document.getElementById('totalTime').innerText = formatTime(dur);
        document.getElementById('progressBar').max = dur;
    };

    // 3. Setup FFT (The Visualizer)
    fft = new p5.FFT(0.8, 64);
    fft.setInput(song);

    // 4. Create Visual Objects (City & Blockchain)
    let bWidth = width / NUM_BUILDINGS;
    for (let i = 0; i < NUM_BUILDINGS; i++) {
        buildings.push({
            x: i * bWidth,
            w: bWidth - 2,
            h: random(50, 200)
        });
    }

    for (let i = 0; i < NUM_NODES; i++) {
        nodes.push({
            x: random(width),
            y: random(height / 2),
            vx: random(-0.5, 0.5),
            vy: random(-0.5, 0.5),
            size: random(5, 15)
        });
    }

    // 5. Connect UI Buttons
    setupUI();
}

function draw() {
    background(10, 14, 23); // Dark Navy

    if (!isReady) return;

    // Analyze Audio Frequencies
    let spectrum = fft.analyze();
    let trebleEnergy = fft.getEnergy("treble");

    // --- DRAW NODES (Top Half) ---
    stroke(0, 255, 157, 50);
    for (let i = 0; i < nodes.length; i++) {
        let n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        
        // Bounce off walls
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height/2) n.vy *= -1;

        // Draw lines between close nodes
        for (let j = i + 1; j < nodes.length; j++) {
            let other = nodes[j];
            if (dist(n.x, n.y, other.x, other.y) < 150) {
                line(n.x, n.y, other.x, other.y);
            }
        }
        
        // Draw the Node dot (Pulses with Treble)
        noStroke();
        fill(0, 255, 157, map(trebleEnergy, 0, 255, 100, 255));
        circle(n.x, n.y, n.size + map(trebleEnergy, 0, 255, 0, 5));
    }

    // --- DRAW CITY (Bottom Half) ---
    noStroke();
    for (let i = 0; i < buildings.length; i++) {
        let b = buildings[i];
        
        // Map building to frequency spectrum
        let specIndex = floor(map(i, 0, NUM_BUILDINGS, 0, 16)); 
        let amp = spectrum[specIndex] || 0;
        
        // Grow height with music
        let currentH = b.h + map(amp, 0, 255, 0, height/3);

        // Building Body
        fill(0, 243, 255, 150); // Cyan
        rect(b.x, height - currentH, b.w, currentH);
        
        // Window Detail
        fill(255, 255, 255, 50);
        rect(b.x + 5, height - currentH + 10, b.w - 10, 5);
    }

    // Update Progress Bar if playing
    if (!song.elt.paused) {
        updateProgressBar();
    }
}

function windowResized() {
    const c = document.getElementById('canvasContainer');
    resizeCanvas(c.offsetWidth, c.offsetHeight);
}

// --- UI LOGIC ---
// ... keep everything above this line ...

// REPLACE THE 'setupUI' FUNCTION WITH THIS:
function setupUI() {
    const playBtn = document.getElementById('playBtn');
    const restartBtn = document.getElementById('restartBtn');
    const slider = document.getElementById('progressBar');
    const volSlider = document.getElementById('volSlider');

    // PLAY BUTTON LOGIC
    playBtn.addEventListener('click', () => {
        if (!isReady) return;

        // 1. WAKE UP THE AUDIO ENGINE (Crucial for Chrome/Safari)
        userStartAudio().then(() => {
            console.log("Audio Context Started");
        });

        // 2. TOGGLE PLAYBACK
        // We access the native HTML element (.elt) to bypass p5.js glitches
        if (song.elt.paused) {
            song.elt.play()
                .then(() => {
                    console.log("Playback started");
                    playBtn.innerText = "PAUSE";
                    playBtn.classList.add("main-play-active");
                })
                .catch(e => console.error("Play blocked:", e));
        } else {
            song.elt.pause();
            console.log("Playback paused");
            playBtn.innerText = "PLAY";
            playBtn.classList.remove("main-play-active");
        }
    });

    // RESTART BUTTON
    restartBtn.addEventListener('click', () => {
        if (!isReady) return;
        song.time(0);
        if (song.elt.paused) {
            song.elt.play();
            playBtn.innerText = "PAUSE";
            playBtn.classList.add("main-play-active");
        }
    });

    // SEEK BAR
    slider.addEventListener('input', () => {
        if (!isReady) return;
        // Pause while dragging for smoother performance
        song.time(parseFloat(slider.value));
    });

    // VOLUME SLIDER
    volSlider.addEventListener('input', () => {
        // Set volume on the native element (0.0 to 1.0)
        if (song) song.elt.volume = parseFloat(volSlider.value);
    });
}

// ... keep updateProgressBar and formatTime below ...

function updateProgressBar() {
    const slider = document.getElementById('progressBar');
    const timeDisplay = document.getElementById('currentTime');
    let curr = song.time();
    slider.value = curr;
    timeDisplay.innerText = formatTime(curr);
}

function formatTime(seconds) {
    let m = floor(seconds / 60);
    let s = floor(seconds % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
}
