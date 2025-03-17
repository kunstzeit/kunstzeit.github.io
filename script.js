// Default coordinates (Los Angeles)
const DEFAULT_LAT = 34.0522;
const DEFAULT_LON = -118.2437;

// Current date and time
const now = new Date();
const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
const currentTime = now.toTimeString().split(' ')[0].slice(0, 5); // HH:MM

// City presets
const presets = {
    "Tokyo": { lat: 35.6895, lon: 139.6917 },
    "Paris": { lat: 48.8566, lon: 2.3522 },
    "Dubai": { lat: 25.2769, lon: 55.2962 },
    "New York": { lat: 40.7128, lon: -74.0060 },
    "GOES-16 Satellite Image": { lat: DEFAULT_LAT, lon: DEFAULT_LON }
};

// Panning speed (degrees per second)
const PAN_SPEED = 0.4;

// Get user's location with fallback
function getUserLocation() {
    return new Promise((resolve) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
                () => resolve({ lat: DEFAULT_LAT, lon: DEFAULT_LON })
            );
        } else {
            resolve({ lat: DEFAULT_LAT, lon: DEFAULT_LON });
        }
    });
}

// Geocode an address
async function geocodeAddress(address) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const data = await response.json();
        if (data.length > 0) {
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
        throw new Error('Location not found');
    } catch (error) {
        console.error('Geocoding error:', error);
        throw error;
    }
}

// Initialize star map
async function initStarmap() {
    const location = await getUserLocation();
    document.getElementById('dateInput').value = currentDate;
    document.getElementById('timeInput').value = currentTime;

    window.planetarium = $.virtualsky({
        id: 'starmap',
        lat: location.lat,
        long: location.lon,
        date: currentDate,
        time: currentTime,
        fov: 60,
        projection: 'stereo',
        background: '#000000',
        mouse: true
    });

    setInterval(autoPan, 1000);
    setInterval(refreshLiveStream, 600000); // Refresh every 10 minutes
}

// Auto-panning function for star map (rotates left)
function autoPan() {
    if (window.planetarium && document.getElementById('starmap').style.display !== 'none') {
        let currentLon = window.planetarium.longitude;
        currentLon -= PAN_SPEED; // Decrease longitude to rotate left
        if (currentLon < -180) currentLon += 360; // Wrap around when below -180
        window.planetarium.setLongitude(currentLon);
        window.planetarium.draw();
    }
}

// Refresh live stream image
function refreshLiveStream() {
    const img = document.getElementById('liveStream');
    const newSrc = img.src.split('?')[0] + '?t=' + new Date().getTime();
    img.src = newSrc;
    return new Promise((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
    });
}

// Update star map
function updateStarmap(lat, lon, date, time) {
    if (window.planetarium) {
        window.planetarium.setLatitude(lat);
        window.planetarium.setLongitude(lon);
        const dateTimeString = `${date}T${time}:00`;
        window.planetarium.setClock(new Date(dateTimeString));
        window.planetarium.draw();
    }
}

// Submit button handler
document.getElementById('submitButton').addEventListener('click', async () => {
    const locationInput = document.getElementById('locationInput').value;
    const date = document.getElementById('dateInput').value || currentDate;
    const time = document.getElementById('timeInput').value || currentTime;

    try {
        let lat, lon;
        if (locationInput) {
            const coords = await geocodeAddress(locationInput);
            lat = coords.lat;
            lon = coords.lon;
        } else {
            const location = await getUserLocation();
            lat = location.lat;
            lon = location.lon;
        }
        document.getElementById('starmap').style.display = 'block';
        document.getElementById('liveStreamContainer').style.display = 'none';
        updateStarmap(lat, lon, date, time);
        document.getElementById('overlay').style.display = 'none';
        document.getElementById('toggleButton').style.display = 'block';
        document.getElementById('minimizeButton').style.display = 'none'; // Hide minimize
        document.getElementById('fullscreenButton').style.display = 'block';
    } catch (error) {
        alert(error.message);
    }
});

// Preset button handlers
document.querySelectorAll('.presetButton').forEach(button => {
    button.addEventListener('click', () => {
        const city = button.getAttribute('data-city');
        const { lat, lon } = presets[city];
        const date = document.getElementById('dateInput').value || currentDate;
        const time = document.getElementById('timeInput').value || currentTime;

        if (city === "GOES-16 Satellite Image") {
            document.getElementById('starmap').style.display = 'none';
            document.getElementById('liveStreamContainer').style.display = 'block';
            document.getElementById('refreshButton').style.display = 'block';
            document.getElementById('fullscreenButton').style.display = 'none';
            refreshLiveStream();
        } else {
            document.getElementById('starmap').style.display = 'block';
            document.getElementById('liveStreamContainer').style.display = 'none';
            document.getElementById('fullscreenButton').style.display = 'block';
            updateStarmap(lat, lon, date, time);
        }
        document.getElementById('overlay').style.display = 'none';
        document.getElementById('toggleButton').style.display = 'block';
        document.getElementById('minimizeButton').style.display = 'none'; // Hide minimize
    });
});

// Toggle button handler (show overlay)
document.getElementById('toggleButton').addEventListener('click', () => {
    document.getElementById('toggleButton').style.display = 'none';
    document.getElementById('fullscreenButton').style.display = 'none';
    document.getElementById('overlay').style.display = 'flex';
    document.getElementById('minimizeButton').style.display = 'flex'; // Show minimize
});

// Minimize button handler (hide overlay)
document.getElementById('minimizeButton').addEventListener('click', () => {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('toggleButton').style.display = 'block';
    document.getElementById('minimizeButton').style.display = 'none'; // Hide minimize
    if (document.getElementById('starmap').style.display === 'block') {
        document.getElementById('fullscreenButton').style.display = 'block';
    } else {
        document.getElementById('fullscreenButton').style.display = 'none';
    }
});

// Full-screen button handler
document.getElementById('fullscreenButton').addEventListener('click', () => {
    const starmap = document.getElementById('starmap');
    if (starmap.requestFullscreen) {
        starmap.requestFullscreen();
    } else if (starmap.mozRequestFullScreen) { // Firefox
        starmap.mozRequestFullScreen();
    } else if (starmap.webkitRequestFullscreen) { // Chrome, Safari, Opera
        starmap.webkitRequestFullscreen();
    } else if (starmap.msRequestFullscreen) { // IE/Edge
        starmap.msRequestFullscreen();
    }
});

// Initialize on load and add new features
document.addEventListener('DOMContentLoaded', function() {
    initStarmap();

    // Event listener for refresh button with loading animation and verification
    document.getElementById('refreshButton').addEventListener('click', async function() {
        const button = this;
        button.innerHTML = 'Loading...';
        button.disabled = true;
        button.classList.add('loading');

        const refreshSuccess = await refreshLiveStream();
        setTimeout(() => {
            button.classList.remove('loading');
            button.innerHTML = 'Refresh';
            button.disabled = false;
            button.style.display = 'none';
            if (!refreshSuccess) {
                alert('Failed to refresh the satellite image. Please try again.');
            }
        }, 1000);
    });

    // Event listener for image click to show refresh button
    document.getElementById('liveStream').addEventListener('click', function() {
        document.getElementById('refreshButton').style.display = 'block';
    });

    // Set up Hammer.js for swipe gestures
    const liveStreamContainer = document.getElementById('liveStreamContainer');
    const hammer = new Hammer(liveStreamContainer);
    hammer.on('swipeleft swiperight', function() {
        document.getElementById('starmap').style.display = 'block';
        document.getElementById('liveStreamContainer').style.display = 'none';
    });
});


document.addEventListener('DOMContentLoaded', function() {
    // Your existing code (e.g., initStarmap()) can stay here

    // Full-screen button handler
    document.getElementById('fullscreenButton').addEventListener('click', () => {
        const starmap = document.getElementById('starmap');
        if (starmap.requestFullscreen) {
            starmap.requestFullscreen();
        } else if (starmap.webkitRequestFullscreen) { // Chrome, Safari
            starmap.webkitRequestFullscreen();
        } else if (starmap.mozRequestFullScreen) { // Firefox
            starmap.mozRequestFullScreen();
        } else if (starmap.msRequestFullscreen) { // IE/Edge
            starmap.msRequestFullscreen();
        }
    });

    // Cursor hiding logic
    let cursorTimer; // Timer for hiding the cursor
    const cursorHideDelay = 3000; // 3 seconds

    // Hide the cursor
    function hideCursor() {
        const starmap = document.getElementById('starmap');
        if (starmap) {
            starmap.style.cursor = 'none';
            // Apply to child elements too
            const children = starmap.querySelectorAll('*');
            children.forEach(child => {
                child.style.cursor = 'none';
            });
        }
    }

    // Show the cursor
    function showCursor() {
        const starmap = document.getElementById('starmap');
        if (starmap) {
            starmap.style.cursor = 'default';
            // Reset child elements
            const children = starmap.querySelectorAll('*');
            children.forEach(child => {
                child.style.cursor = 'default';
            });
        }
    }

    // Reset timer on mouse move
    function resetCursorTimer() {
        clearTimeout(cursorTimer); // Clear old timer
        showCursor(); // Show cursor
        cursorTimer = setTimeout(hideCursor, cursorHideDelay); // Set new timer
    }

    // Mouse move handler
    function onMouseMove() {
        resetCursorTimer();
    }

    // Full-screen change event (works across browsers)
    let fullscreenChangeEvent = 'fullscreenchange';
    if (document.webkitFullscreenEnabled) {
        fullscreenChangeEvent = 'webkitfullscreenchange';
    } else if (document.mozFullscreenEnabled) {
        fullscreenChangeEvent = 'mozfullscreenchange';
    } else if (document.msFullscreenEnabled) {
        fullscreenChangeEvent = 'MSFullscreenChange';
    }

    // Handle full-screen mode changes
    document.addEventListener(fullscreenChangeEvent, () => {
        if (document.fullscreenElement) {
            // Entered full-screen
            resetCursorTimer();
            document.addEventListener('mousemove', onMouseMove);
        } else {
            // Exited full-screen
            clearTimeout(cursorTimer);
            showCursor();
            document.removeEventListener('mousemove', onMouseMove);
        }
    });
});