// Default coordinates for Los Angeles
const DEFAULT_LAT = 34.0522;
const DEFAULT_LON = -118.2437;

// Current date and time
const now = new Date();
const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
const currentTime = now.toTimeString().split(' ')[0].slice(0, 5); // HH:MM

// Presets for cities
const presets = {
    "Tokyo": { lat: 35.6895, lon: 139.6917 },
    "Paris": { lat: 48.8566, lon: 2.3522 },
    "Dubai": { lat: 25.2769, lon: 55.2962 },
    "New York": { lat: 40.7128, lon: -74.0060 }
};

// Get user's location with fallback to Los Angeles
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

// Geocode an address using Nominatim
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

// Initialize or update the star map
function updateStarmap(lat, lon, date, time) {
    if (!window.planetarium) {
        // Initial setup of the star map
        window.planetarium = $.virtualsky({
            id: 'starmap',
            lat: lat,
            long: lon,
            date: date,
            time: time,
            fov: 60,
            projection: 'stereo',
            background: '#000000',
            mouse: true // Explicitly enable mouse interactions for panning
        });
    } else {
        // Update existing star map instance
        window.planetarium.setLatitude(lat);
        window.planetarium.setLongitude(lon);
        const dateTimeString = `${date}T${time}:00`; // Format: YYYY-MM-DDTHH:MM:SS
        const dateTime = new Date(dateTimeString);
        window.planetarium.setClock(dateTime);
        window.planetarium.draw(); // Redraw the star map
    }
    console.log('Starmap updated with lat:', lat, 'lon:', lon, 'date:', date, 'time:', time);
}

// Initialize star map on page load
async function initStarmap() {
    const location = await getUserLocation();
    const lat = location.lat;
    const lon = location.lon;

    // Pre-fill date and time inputs
    document.getElementById('dateInput').value = currentDate;
    document.getElementById('timeInput').value = currentTime;

    updateStarmap(lat, lon, currentDate, currentTime);
}

// Handle submit button click
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
        updateStarmap(lat, lon, date, time);

        // Minimize overlay and show toggle button
        document.getElementById('overlay').style.display = 'none';
        document.getElementById('toggleButton').style.display = 'block';
    } catch (error) {
        alert(error.message);
    }
});

// Handle preset button clicks
document.querySelectorAll('.presetButton').forEach(button => {
    button.addEventListener('click', () => {
        const city = button.getAttribute('data-city');
        const { lat, lon } = presets[city];
        const date = document.getElementById('dateInput').value || currentDate;
        const time = document.getElementById('timeInput').value || currentTime;
        updateStarmap(lat, lon, date, time);

        // Minimize overlay and show toggle button
        document.getElementById('overlay').style.display = 'none';
        document.getElementById('toggleButton').style.display = 'block';
    });
});

// Handle toggle button click to show overlay
document.getElementById('toggleButton').addEventListener('click', () => {
    document.getElementById('toggleButton').style.display = 'none';
    document.getElementById('overlay').style.display = 'flex';
});

// Run initialization on page load
document.addEventListener('DOMContentLoaded', initStarmap);