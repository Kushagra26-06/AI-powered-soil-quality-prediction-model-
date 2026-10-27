// Soil Quality Prediction System JavaScript

// API Configuration - use 127.0.0.1 on local machines to avoid Windows IPv6 resolution latency/refusal
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || !window.location.hostname)
    ? 'http://127.0.0.1:5000'
    : `http://${window.location.hostname}:5000`;

// DOM Elements
const form = document.getElementById('soilForm');
const resultsContainer = document.getElementById('resultsContainer');
const defaultResults = document.getElementById('defaultResults');
const loadingResults = document.getElementById('loadingResults');
const successResults = document.getElementById('successResults');
const errorResults = document.getElementById('errorResults');

// Sample data for testing - original 11 parameters
const sampleData = {
    N: 65.5,
    P: 28.3,
    K: 45.2,
    ph: 6.8,
    ec: 1.2,
    oc: 2.8,
    S: 15.4,
    zn: 2.1,
    fe: 25.6,
    cu: 1.8,
    B: 3.2
};

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM Content Loaded - Initializing application...');

    try {
        initializeForm();
        checkBackendConnection();
        initializeThemeToggle();

        // Ensure form starts completely empty
        clearFormCompletely();

        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error during initialization:', error);
        showToast('Error loading application. Please refresh the page.', 'error');
    }
});

// Clear form completely
function clearFormCompletely() {
    // Reset the form
    form.reset();

    // Clear any individual input values
    const inputs = form.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.value = '';
        input.removeAttribute('value');
    });

    // Hide any results
    hideAllResults();
    defaultResults.classList.remove('hidden');
}

// Form initialization
function initializeForm() {
    form.addEventListener('submit', handleFormSubmit);

    // Add input validation
    const inputs = form.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', function () {
            validateInput(this);
        });
    });
}

// Input validation
function validateInput(input) {
    const value = parseFloat(input.value);
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);

    if (isNaN(value)) {
        input.setCustomValidity('Please enter a valid number');
        return false;
    }

    if (min !== undefined && value < min) {
        input.setCustomValidity(`Value must be at least ${min}`);
        return false;
    }

    if (max !== undefined && value > max) {
        input.setCustomValidity(`Value must be no more than ${max}`);
        return false;
    }

    input.setCustomValidity('');
    return true;
}

// Backend Connection Management
let backendConnected = false;
let backendRetryCount = 0;
const MAX_BACKEND_RETRIES = 12; // 12 * 1.5s = 18s window for backend cold-start
const BACKEND_RETRY_INTERVAL = 1500;
let backendRetryTimer = null;

function updateBackendStatusUI(status, customText) {
    const badge = document.getElementById('backendStatusBadge');
    const icon = document.getElementById('backendStatusIcon');
    const text = document.getElementById('backendStatusText');
    if (!badge || !icon || !text) return;

    badge.className = 'px-3 py-1 rounded-full text-sm cursor-pointer transition-all duration-300 select-none text-white font-medium ';

    if (status === 'connected') {
        badge.className += 'bg-green-600 hover:bg-green-700 shadow-sm';
        icon.className = 'fas fa-check-circle mr-1 text-white';
        text.textContent = customText || 'Backend: Connected';
        badge.title = 'Backend server is active and connected. Click to recheck.';
    } else if (status === 'connecting') {
        badge.className += 'bg-yellow-500 shadow-sm';
        icon.className = 'fas fa-circle-notch fa-spin mr-1 text-white';
        text.textContent = customText || 'Backend: Connecting...';
        badge.title = 'Connecting to backend server...';
    } else {
        badge.className += 'bg-red-600 hover:bg-red-700 shadow-sm';
        icon.className = 'fas fa-exclamation-circle mr-1 text-white';
        text.textContent = customText || 'Backend: Offline (Click to Retry)';
        badge.title = 'Backend server is unreachable. Click to retry connection.';
    }
}

// Check backend connection with auto-retry
async function checkBackendConnection(isRetry = false, userClicked = false) {
    if (userClicked) {
        backendRetryCount = 0;
        if (backendRetryTimer) clearTimeout(backendRetryTimer);
        showToast('Checking connection to backend server...', 'info');
    }

    updateBackendStatusUI('connecting', backendRetryCount > 0 ? `Connecting (${backendRetryCount}/${MAX_BACKEND_RETRIES})...` : 'Backend: Connecting...');

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors',
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            console.log('Backend connection successful:', data);
            backendConnected = true;
            backendRetryCount = 0;
            updateBackendStatusUI('connected');
            if (isRetry || userClicked) {
                showToast('Backend server connected successfully!', 'success');
            }
            return true;
        } else {
            throw new Error(`Server returned status ${response.status}`);
        }
    } catch (error) {
        console.warn('Backend connection check failed:', error.message);
        backendConnected = false;

        if (backendRetryCount < MAX_BACKEND_RETRIES && !userClicked) {
            backendRetryCount++;
            updateBackendStatusUI('connecting', `Starting up (${backendRetryCount}/${MAX_BACKEND_RETRIES})...`);
            backendRetryTimer = setTimeout(() => checkBackendConnection(true), BACKEND_RETRY_INTERVAL);
        } else {
            updateBackendStatusUI('disconnected');
            if (userClicked || backendRetryCount >= MAX_BACKEND_RETRIES) {
                showToast('Cannot connect to backend server at ' + API_BASE_URL, 'error');
            }
        }
        return false;
    }
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
        showToast('Please fill in all required fields correctly', 'error');
        return;
    }

    showLoading();

    const formData = new FormData(form);
    const data = {};

    // Convert FormData to JSON object
    for (let [key, value] of formData.entries()) {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
            showError(`Invalid value for ${key}: ${value}`);
            hideLoading();
            return;
        }
        data[key] = numValue;
    }

    console.log('Sending data:', data);

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            mode: 'cors'
        });

        const result = await response.json();
        console.log('Response:', result);

        if (response.ok) {
            displayResults(result);
        } else {
            showError(result.error || 'Prediction failed');
        }
    } catch (error) {
        console.error('Prediction error:', error);
        showError('Network error. Please check your connection.');
    }
}

// Validate entire form
function validateForm() {
    const inputs = form.querySelectorAll('input[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!validateInput(input)) {
            isValid = false;
        }
    });

    return isValid;
}

// Show loading state
function showLoading() {
    hideAllResults();
    loadingResults.classList.remove('hidden');
}

// Display prediction results
function displayResults(result) {
    hideAllResults();
    successResults.classList.remove('hidden');

    // Store current result globally for chart coloring
    window.currentResult = result;

    // Keep original uniform card styling (no harsh solid red fill)
    successResults.classList.remove('prediction-results-less-fertile');

    // Update fertility status with impressive animations
    updateFertilityStatus(result);

    // Update confidence score with enhanced visualization
    updateConfidenceScore(result.confidence_scores);

    // Create impressive charts with proper error handling and data refresh
    try {
        console.log('Starting chart creation process...');

        // Force synchronous layout calculation immediately after unhiding
        document.body.offsetHeight; // Forces a synchronous reflow

        // Create new charts with fresh data
        createPieChart(result.confidence_scores);
        createParameterChart(result.input_values);
        console.log('Charts created successfully');
    } catch (error) {
        console.error('Chart creation error:', error);
        console.error('Error details:', error.stack);
        const pieCanvas = document.getElementById('confidencePieChart');
        if (pieCanvas && pieCanvas.parentElement) {
            pieCanvas.parentElement.innerHTML = `<div style="background: #ffebe9; border: 2px solid red; color: #900; padding: 15px; width: 100%; height: 100%; border-radius: 8px; overflow-y: auto;">
                <strong>CRITICAL CHART ERROR:</strong><br/>
                ${error.message}<br/><br/>
                <small>${error.stack}</small>
            </div>`;
        }
    }

    // Update detailed breakdown with progress bars
    updateDetailedBreakdown(result.confidence_scores);

    // Calculate and display soil quality score
    updateSoilQualityScore(result);

    // Update recommendations with enhanced styling
    updateRecommendations(result);

    // Animate results with impressive effects
    animateResults();
}

// Remove dynamic color theming function to keep original UI
// function applyColorTheme(prediction) { ... }

// Enhanced fertility status update
function updateFertilityStatus(result) {
    const fertilityStatus = document.getElementById('fertilityStatus');
    const fertilityLevel = document.getElementById('fertilityLevel');
    const fertilityIcon = document.getElementById('fertilityIcon');
    const fertilityBadge = document.getElementById('fertilityBadge');

    // Set basic icon and colors without dynamic theming
    let icon, badgeText;

    if (result.prediction === 2) { // Highly Fertile
        icon = 'fas fa-star';
        badgeText = 'HIGHLY FERTILE';
    } else if (result.prediction === 1) { // Fertile
        icon = 'fas fa-check-circle';
        badgeText = 'FERTILE';
    } else { // Less Fertile
        icon = 'fas fa-exclamation-triangle';
        badgeText = 'LESS FERTILE';
    }

    // Set colors based on fertility class
    let iconColor, statusColor, badgeColor;

    if (result.fertility_class === 'Fertile' || result.fertility_class === 'Highly Fertile') {
        iconColor = 'text-green-500';
        statusColor = 'text-green-600';
        badgeColor = 'bg-green-500';
    } else {
        iconColor = 'text-red-500';
        statusColor = 'text-red-600';
        badgeColor = 'bg-red-500';
    }

    fertilityIcon.className = `${icon} text-6xl mb-4 animate__animated animate__bounceIn ${iconColor}`;
    fertilityStatus.textContent = result.fertility_class;
    fertilityStatus.className = `text-3xl font-bold mb-2 animate__animated animate__fadeInUp ${statusColor}`;

    fertilityLevel.textContent = `Fertility Level: ${result.fertility_level} | Is Fertile: ${result.is_fertile ? 'Yes' : 'No'}`;

    fertilityBadge.textContent = badgeText;
    fertilityBadge.className = `inline-block px-4 py-2 rounded-full text-white font-bold animate__animated animate__pulse animate__infinite ${badgeColor}`;
}

// Enhanced confidence score update
function updateConfidenceScore(confidenceScores) {
    const confidenceBar = document.getElementById('confidenceBar');
    const confidenceText = document.getElementById('confidenceText');
    const confidenceMessage = document.getElementById('confidenceMessage');

    // Find the maximum confidence score
    const maxConfidence = Math.max(...Object.values(confidenceScores));
    const maxConfidencePercent = (maxConfidence * 100).toFixed(1);

    // Animate the confidence bar
    setTimeout(() => {
        confidenceBar.style.width = `${maxConfidencePercent}%`;
    }, 500);

    confidenceText.textContent = `${maxConfidencePercent}%`;
    confidenceText.className = 'text-lg font-bold confidence-percentage-green';

    // Add color coding and message
    let confidenceClass, message;
    if (maxConfidence >= 0.8) {
        confidenceClass = 'confidence-high';
        message = 'High confidence prediction - Very reliable results!';
    } else if (maxConfidence >= 0.6) {
        confidenceClass = 'confidence-medium';
        message = 'Moderate confidence - Results are reasonably reliable.';
    } else {
        confidenceClass = 'confidence-low';
        message = 'Low confidence - Consider additional soil testing.';
    }

    // Green confidence bar
    confidenceBar.className = 'h-6 rounded-full transition-all duration-1000 confidence-bar-green';
    confidenceMessage.textContent = message;
}

// Create impressive pie chart
function createPieChart(confidenceScores) {
    try {
        const canvas = document.getElementById('confidencePieChart');
        if (!canvas) return;

        // Ensure canvas has dimensions
        if (canvas.clientHeight === 0) canvas.style.height = '256px';
        if (canvas.clientWidth === 0) canvas.style.width = '100%';

        const ctx = canvas.getContext('2d');

        // Deep unhook from Chart internals if lingering
        const existingChart = Chart.getChart(canvas);
        if (existingChart) existingChart.destroy();

        // Semantic color mapping: Fertile -> Green, Highly Fertile -> Blue, Less Fertile -> Red
        const colorMap = {
            'Fertile': { bg: 'rgba(34, 197, 94, 0.85)', border: 'rgba(34, 197, 94, 1)' },         // Green
            'Highly Fertile': { bg: 'rgba(59, 130, 246, 0.85)', border: 'rgba(59, 130, 246, 1)' }, // Blue
            'Less Fertile': { bg: 'rgba(239, 68, 68, 0.85)', border: 'rgba(239, 68, 68, 1)' }     // Red
        };

        const labels = Object.keys(confidenceScores || {});
        const data = Object.values(confidenceScores || {});
        const bgColors = labels.map(label => colorMap[label]?.bg || 'rgba(156, 163, 175, 0.85)');
        const borderColors = labels.map(label => colorMap[label]?.border || 'rgba(156, 163, 175, 1)');

        window.appPieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: bgColors,
                    borderColor: borderColors,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#e2e8f0' } }
                }
            }
        });

        if (canvas.parentElement) canvas.parentElement.style.opacity = '1';
    } catch (err) {
        console.error('Pie Chart Failed:', err);
        throw err; // Let it bubble to the red box
    }
}

// Create parameter analysis bar chart
function createParameterChart(inputValues) {
    try {
        const ctx = document.getElementById('parameterBarChart');
        if (!ctx) return;

        // Ensure canvas has dimensions
        if (ctx.clientHeight === 0) ctx.style.height = '256px';
        if (ctx.clientWidth === 0) ctx.style.width = '100%';

        const context = ctx.getContext('2d');

        // Deep unhook from Chart internals if lingering
        const existingChart = Chart.getChart(ctx);
        if (existingChart) existingChart.destroy();

        const labels = Object.keys(inputValues || {});
        const values = Object.values(inputValues || {});

        window.appBarChart = new Chart(context, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Parameter Values',
                    data: values,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#e2e8f0' } },
                    x: { grid: { display: false }, ticks: { color: '#e2e8f0' } }
                },
                plugins: { legend: { display: false } }
            }
        });

        if (ctx.parentElement) ctx.parentElement.style.opacity = '1';
    } catch (err) {
        console.error('Bar Chart Failed:', err);
        throw err; // Let it bubble to the red box
    }
}

// Update soil quality score using backend continuous scoring
async function updateSoilQualityScore(result) {
    const soilScore = document.getElementById('soilScore');
    const scoreRating = document.getElementById('scoreRating');
    const scoreDescription = document.getElementById('scoreDescription');
    const scoreBar = document.getElementById('scoreBar');

    try {
        // Call backend continuous scoring function
        const response = await fetch(`${API_BASE_URL}/calculate_score`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                input_values: result.input_values
            }),
            mode: 'cors'
        });

        const scoreResult = await response.json();

        if (response.ok && scoreResult.score !== undefined) {
            const score = scoreResult.score;
            let rating, description, scoreClass, barColor;

            // Use simple colors instead of dynamic theming
            if (score >= 85) {
                rating = 'Excellent';
                description = 'Outstanding soil quality conditions';
                barColor = 'bg-green-500';
            } else if (score >= 60) {
                rating = 'Good';
                description = 'Healthy soil with good fertility';
                barColor = 'bg-blue-500';
            } else if (score >= 40) {
                rating = 'Fair';
                description = 'Soil has moderate fertility';
                barColor = 'bg-yellow-500';
            } else {
                rating = 'Poor';
                description = 'Soil needs significant improvement';
                barColor = 'bg-red-500';
            }

            // Animate score counter
            animateCounter(soilScore, 0, score, 2000);

            // Simple rating update
            setTimeout(() => {
                scoreRating.textContent = rating;
                scoreRating.className = 'text-lg font-semibold mb-1 text-gray-800';
                scoreDescription.textContent = description;
                scoreBar.className = `h-4 rounded-full transition-all duration-1000 ${barColor}`;
                scoreBar.style.width = `${score}%`;
                soilScore.className = 'text-5xl font-bold score-counter text-gray-800';
            }, 500);
        } else {
            console.error('Failed to calculate continuous score:', scoreResult.error || 'Unknown error');
            // Fallback with simple colors
            if (result.prediction === 2) {
                fallbackScore = 85;
                rating = 'Excellent';
                description = 'Outstanding soil quality conditions';
                barColor = 'bg-green-500';
            } else if (result.prediction === 1) {
                fallbackScore = 60;
                rating = 'Good';
                description = 'Healthy soil with good fertility';
                barColor = 'bg-blue-500';
            } else {
                fallbackScore = 30;
                rating = 'Poor';
                description = 'Soil needs significant improvement';
                barColor = 'bg-red-500';
            }

            animateCounter(soilScore, 0, fallbackScore, 2000);
            setTimeout(() => {
                scoreRating.textContent = rating;
                scoreRating.className = 'text-lg font-semibold mb-1 text-gray-800';
                scoreDescription.textContent = description;
                scoreBar.className = `h-4 rounded-full transition-all duration-1000 ${barColor}`;
                scoreBar.style.width = `${fallbackScore}%`;
                soilScore.className = 'text-5xl font-bold score-counter text-gray-800';
            }, 500);
        }

    } catch (error) {
        console.error('Error calculating continuous score:', error);
        // Show error message to user
        showToast('Score calculation failed', 'error');
    }
}

// Animate counter
function animateCounter(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            element.textContent = end;
            clearInterval(timer);
        } else {
            element.textContent = Math.round(current);
        }
    }, 16);
}

// Create Radar Chart for soil parameter comparison
function createRadarChart(inputValues) {
    const ctx = document.getElementById('radarChart').getContext('2d');

    // Define ideal ranges for each parameter
    const idealRanges = {
        ph: { min: 6.0, max: 7.5, optimal: 6.8 },
        N: { min: 40, max: 80, optimal: 60 },
        P: { min: 20, max: 40, optimal: 30 },
        K: { min: 30, max: 60, optimal: 45 },
        moisture: { min: 20, max: 40, optimal: 30 },
        oc: { min: 2.0, max: 4.0, optimal: 3.0 },
        ec: { min: 0.5, max: 2.0, optimal: 1.2 },
        temp: { min: 25, max: 35, optimal: 30 },
        ca: { min: 800, max: 1500, optimal: 1200 },
        mg: { min: 300, max: 600, optimal: 450 },
        S: { min: 10, max: 25, optimal: 15 },
        fe: { min: 15, max: 35, optimal: 25 },
        zn: { min: 1.0, max: 3.0, optimal: 2.0 },
        cu: { min: 1.0, max: 2.5, optimal: 1.8 },
        texture: { min: 25, max: 45, optimal: 35 },
        cec: { min: 15, max: 25, optimal: 20 },
        bd: { min: 1.2, max: 1.5, optimal: 1.35 },
        wh: { min: 25, max: 45, optimal: 35 },
        microbial: { min: 60, max: 90, optimal: 75 },
        B: { min: 2.0, max: 4.0, optimal: 3.0 }
    };

    const labels = Object.keys(inputValues);
    const actualValues = labels.map(key => {
        const value = inputValues[key];
        const range = idealRanges[key];
        // Normalize to 0-100 scale based on ideal range
        if (range) {
            const normalized = ((value - range.min) / (range.max - range.min)) * 100;
            return Math.max(0, Math.min(100, normalized));
        }
        return 50; // Default middle value
    });

    const optimalValues = labels.map(key => {
        const range = idealRanges[key];
        if (range) {
            const normalized = ((range.optimal - range.min) / (range.max - range.min)) * 100;
            return Math.max(0, Math.min(100, normalized));
        }
        return 50;
    });

    // Destroy existing radar chart
    if (window.radarChart) {
        window.radarChart.destroy();
    }

    window.radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels.map(key => key.toUpperCase()),
            datasets: [
                {
                    label: 'Your Soil Values',
                    data: actualValues,
                    backgroundColor: 'rgba(34, 197, 94, 0.2)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(34, 197, 94, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(34, 197, 94, 1)'
                },
                {
                    label: 'Ideal Values',
                    data: optimalValues,
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(59, 130, 246, 1)'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + ': ' + context.parsed.r.toFixed(1) + '%';
                        }
                    }
                }
            }
        }
    });

    // Update radar legend
    updateRadarLegend(labels, inputValues, idealRanges);
}

// Update radar legend with parameter details
function updateRadarLegend(labels, inputValues, idealRanges) {
    const legendContainer = document.getElementById('radarLegend');
    legendContainer.innerHTML = '';

    labels.forEach(key => {
        const value = inputValues[key];
        const range = idealRanges[key];
        const status = range ?
            (value >= range.min && value <= range.max ? 'optimal' : 'needs adjustment') : 'unknown';

        const statusColor = status === 'optimal' ? 'text-green-600' : 'text-yellow-600';
        const statusIcon = status === 'optimal' ? 'fa-check-circle' : 'fa-exclamation-triangle';

        const legendItem = document.createElement('div');
        legendItem.className = 'flex items-center justify-between p-2 bg-gray-50 rounded';
        legendItem.innerHTML = `
            <span class="font-medium text-gray-700">${key.toUpperCase()}</span>
            <div class="flex items-center space-x-2">
                <span class="text-sm">${value.toFixed(2)}</span>
                <i class="fas ${statusIcon} ${statusColor} text-sm"></i>
            </div>
        `;
        legendContainer.appendChild(legendItem);
    });
}

// Create Gauge Chart for soil quality score
function createGaugeChart(prediction, confidence) {
    const ctx = document.getElementById('gaugeChart').getContext('2d');

    // Calculate score based on prediction and confidence
    const baseScore = prediction === 2 ? 85 : prediction === 1 ? 60 : 35;
    const score = Math.round(baseScore + (confidence * 15));

    // Destroy existing gauge chart
    if (window.gaugeChart) {
        window.gaugeChart.destroy();
    }

    window.gaugeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [score, 100 - score],
                backgroundColor: [
                    score >= 80 ? 'rgba(34, 197, 94, 0.8)' :
                        score >= 60 ? 'rgba(251, 191, 36, 0.8)' :
                            'rgba(239, 68, 68, 0.8)',
                    'rgba(229, 231, 235, 0.3)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            rotation: -90,
            circumference: 180,
            cutout: '75%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            }
        }
    });

    // Update gauge details
    updateGaugeDetails(score, prediction, confidence);
}

// Update gauge details
function updateGaugeDetails(score, prediction, confidence) {
    document.getElementById('currentScore').textContent = score;
    document.getElementById('scoreConfidence').textContent = (confidence * 100).toFixed(1) + '%';

    const qualityLevels = ['Less Fertile', 'Fertile', 'Highly Fertile'];
    const qualityLevel = qualityLevels[prediction];
    const qualityElement = document.getElementById('qualityLevel');

    qualityElement.textContent = qualityLevel;
    qualityElement.className = 'font-semibold ' +
        (prediction === 2 ? 'text-green-600' :
            prediction === 1 ? 'text-yellow-600' :
                'text-red-600');
}

// Destroy charts to prevent memory leaks
function destroyCharts() {
    try {
        if (window.confidencePieChart && typeof window.confidencePieChart.destroy === 'function') {
            window.confidencePieChart.destroy();
            window.confidencePieChart = null;
        }
        if (window.parameterBarChart && typeof window.parameterBarChart.destroy === 'function') {
            window.parameterBarChart.destroy();
            window.parameterBarChart = null;
        }
        if (window.radarChart && typeof window.radarChart.destroy === 'function') {
            window.radarChart.destroy();
            window.radarChart = null;
        }
        if (window.gaugeChart && typeof window.gaugeChart.destroy === 'function') {
            window.gaugeChart.destroy();
            window.gaugeChart = null;
        }
    } catch (error) {
        console.warn('Error destroying charts:', error);
    }
}

// Get fertility color based on prediction
function getFertilityColor(prediction) {
    switch (prediction) {
        case 0: return 'text-red-600';  // Less Fertile
        case 1: return 'text-yellow-600'; // Fertile
        case 2: return 'text-green-600';  // Highly Fertile
        default: return 'text-gray-600';
    }
}


// Update detailed breakdown
function updateDetailedBreakdown(confidenceScores) {
    const breakdown = document.getElementById('detailedBreakdown');
    breakdown.innerHTML = '';

    const barColorMap = {
        'Fertile': 'bg-green-500',
        'Highly Fertile': 'bg-blue-500',
        'Less Fertile': 'bg-red-500'
    };

    Object.entries(confidenceScores).forEach(([className, score]) => {
        const percent = (score * 100).toFixed(1);
        const barColor = barColorMap[className] || 'bg-blue-500';
        const breakdownItem = document.createElement('div');
        breakdownItem.className = 'flex justify-between items-center';
        breakdownItem.innerHTML = `
            <span class="text-sm text-gray-600">${className}</span>
            <div class="flex items-center">
                <div class="w-24 bg-gray-200 rounded-full h-2 mr-2">
                    <div class="${barColor} h-2 rounded-full transition-all duration-500" style="width: ${percent}%"></div>
                </div>
                <span class="text-sm font-semibold">${percent}%</span>
            </div>
        `;
        breakdown.appendChild(breakdownItem);
    });
}

// Update recommendations based on results with enhanced styling
async function updateRecommendations(result) {
    const recommendations = document.getElementById('recommendations');

    try {
        // Fetch recommendations from backend
        const response = await fetch(`${API_BASE_URL}/recommendations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prediction: result.prediction,
                fertility_class: result.fertility_class,
                input_values: result.input_values
            })
        });

        if (response.ok) {
            const recommendationsData = await response.json();
            displayRecommendations(recommendationsData, result.prediction);
        } else {
            // Fallback to default recommendations if API fails
            displayDefaultRecommendations(result);
        }
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        displayDefaultRecommendations(result);
    }
}

// Display recommendations from backend with simple styling
function displayRecommendations(recs, prediction) {
    const recommendations = document.getElementById('recommendations');

    let recommendationsHTML = '';

    // Crops section
    if (recs.crops && recs.crops.length > 0) {
        recommendationsHTML += `
            <div class="mb-4">
                <h4 class="font-semibold text-gray-700 mb-2">
                    <i class="fas fa-seedling mr-2 text-green-500"></i>Recommended Crops
                </h4>
                <div class="flex flex-wrap gap-2">
                    ${recs.crops.map(crop => `
                        <span class="px-3 py-1 bg-green-600 text-white shadow-md rounded-full text-sm font-bold">
                            ${crop}
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Fertilizers section
    if (recs.fertilizers && recs.fertilizers.length > 0) {
        recommendationsHTML += `
            <div class="mb-4">
                <h4 class="font-semibold text-gray-700 mb-2">
                    <i class="fas fa-flask mr-2 text-blue-500"></i>Recommended Fertilizers
                </h4>
                <div class="flex flex-wrap gap-2">
                    ${recs.fertilizers.map(fert => `
                        <span class="px-3 py-1 bg-blue-600 text-white shadow-md rounded-full text-sm font-bold">
                            ${fert}
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Irrigation section
    if (recs.irrigation) {
        recommendationsHTML += `
            <div class="mb-4">
                <h4 class="font-semibold text-gray-700 mb-2">
                    <i class="fas fa-tint mr-2 text-cyan-500"></i>Irrigation Guidelines
                </h4>
                <p class="text-gray-600 text-sm">${recs.irrigation}</p>
            </div>
        `;
    }

    // Soil improvements section
    if (recs.soil_improvements && recs.soil_improvements.length > 0) {
        recommendationsHTML += `
            <div class="mb-4">
                <h4 class="font-semibold text-gray-700 mb-2">
                    <i class="fas fa-leaf mr-2 text-green-600"></i>Soil Improvement Tips
                </h4>
                <ul class="space-y-1">
                    ${recs.soil_improvements.map(improvement => `
                        <li class="text-gray-600 text-sm flex items-start">
                            <i class="fas fa-check text-green-500 mr-2 mt-1 text-xs"></i>
                            ${improvement}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    recommendations.innerHTML = recommendationsHTML;
}

// Fallback default recommendations
function displayDefaultRecommendations(result) {
    const recommendations = document.getElementById('recommendations');
    let recommendationsList = [];
    let iconClass, iconColor;

    if (result.prediction === 0) { // Less Fertile
        iconClass = 'fa-exclamation-triangle';
        iconColor = 'text-red-500';
        recommendationsList = [
            { icon: 'fa-compost', text: 'Add organic compost to improve soil structure', priority: 'high' },
            { icon: 'fa-flask', text: 'Test and adjust pH levels if necessary', priority: 'high' },
            { icon: 'fa-seedling', text: 'Add balanced NPK fertilizer based on soil test', priority: 'medium' },
            { icon: 'fa-leaf', text: 'Consider green manure crops to improve fertility', priority: 'medium' },
            { icon: 'fa-tint', text: 'Monitor moisture levels regularly', priority: 'low' }
        ];
    } else if (result.prediction === 1) { // Fertile
        iconClass = 'fa-check-circle';
        iconColor = 'text-blue-500';
        recommendationsList = [
            { icon: 'fa-calendar-check', text: 'Maintain current fertilization schedule', priority: 'medium' },
            { icon: 'fa-sync-alt', text: 'Consider crop rotation to maintain soil health', priority: 'medium' },
            { icon: 'fa-microscope', text: 'Monitor micronutrient levels periodically', priority: 'low' },
            { icon: 'fa-tractor', text: 'Practice conservation tillage if applicable', priority: 'low' },
            { icon: 'fa-clipboard-check', text: 'Regular soil testing recommended', priority: 'medium' }
        ];
    } else { // Highly Fertile
        iconClass = 'fa-star';
        iconColor = 'text-green-500';
        recommendationsList = [
            { icon: 'fa-trophy', text: 'Soil is in excellent condition for most crops', priority: 'high' },
            { icon: 'fa-balance-scale', text: 'Consider reducing fertilizer to prevent buildup', priority: 'medium' },
            { icon: 'fa-chart-line', text: 'Monitor for nutrient imbalances', priority: 'low' },
            { icon: 'fa-coins', text: 'Consider high-value crops that require rich soil', priority: 'high' },
            { icon: 'fa-water', text: 'Maintain good drainage practices', priority: 'medium' }
        ];
    }

    recommendations.innerHTML = recommendationsList.map((rec, index) => {
        const priorityColor = rec.priority === 'high' ? 'text-red-600' :
            rec.priority === 'medium' ? 'text-yellow-600' : 'text-green-600';
        const priorityBadge = rec.priority === 'high' ? 'HIGH' :
            rec.priority === 'medium' ? 'MEDIUM' : 'LOW';
        const badgeColor = rec.priority === 'high' ? 'bg-red-100 text-red-800' :
            rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800';

        return `
            <div class="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors animate__animated animate__fadeInLeft" style="animation-delay: ${index * 0.1}s">
                <i class="fas ${rec.icon} ${iconColor} text-lg mt-1"></i>
                <div class="flex-1">
                    <p class="text-sm font-medium text-gray-800">${rec.text}</p>
                    <span class="inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full ${badgeColor}">
                        ${priorityBadge} PRIORITY
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

// Animate results appearance
function animateResults() {
    const resultCards = successResults.querySelectorAll('.bg-gradient-to-r, .bg-blue-50, .bg-purple-50, .bg-yellow-50');
    resultCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';

        setTimeout(() => {
            card.style.transition = 'all 0.5s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Show error state
function showError(message) {
    hideAllResults();
    errorResults.classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message;
}

// Hide all result states
function hideAllResults() {
    defaultResults.classList.add('hidden');
    loadingResults.classList.add('hidden');
    successResults.classList.add('hidden');
    errorResults.classList.add('hidden');
}

// Load sample data with random values
function loadSampleData() {
    // Generate random values for each parameter
    const randomData = {
        N: (Math.random() * 80 + 20).toFixed(1),  // 20-100 mg/kg
        P: (Math.random() * 30 + 10).toFixed(1),  // 10-40 mg/kg
        K: (Math.random() * 50 + 20).toFixed(1),  // 20-70 mg/kg
        ph: (Math.random() * 3 + 5.5).toFixed(1), // 5.5-8.5
        ec: (Math.random() * 2 + 0.5).toFixed(2), // 0.5-2.5 dS/m
        oc: (Math.random() * 3 + 1).toFixed(2),   // 1-4 %
        S: (Math.random() * 20 + 5).toFixed(1),  // 5-25 mg/kg
        zn: (Math.random() * 3 + 0.5).toFixed(2), // 0.5-3.5 mg/kg
        fe: (Math.random() * 30 + 10).toFixed(1), // 10-40 mg/kg
        cu: (Math.random() * 2 + 0.5).toFixed(2), // 0.5-2.5 mg/kg
        B: (Math.random() * 3 + 1).toFixed(2)      // 1-4 mg/kg
    };

    Object.entries(randomData).forEach(([key, value]) => {
        const input = document.getElementById(key);
        if (input) {
            input.value = value;
            input.classList.add('animate__animated', 'animate__pulse');
            setTimeout(() => {
                input.classList.remove('animate__animated', 'animate__pulse');
            }, 1000);
        }
    });

    // No success toast message - just load the data silently
}

// Reset form
function resetForm() {
    form.reset();
    hideAllResults();
    defaultResults.classList.remove('hidden');
    showToast('Form reset successfully', 'info');
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = getToastIcon(type);
    toast.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${icon} mr-3"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(toast);

    // Position toast
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.zIndex = '9999';

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Get toast icon based on type
function getToastIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle text-green-500';
        case 'error': return 'fa-exclamation-circle text-red-500';
        case 'warning': return 'fa-exclamation-triangle text-yellow-500';
        case 'info': return 'fa-info-circle text-blue-500';
        default: return 'fa-info-circle text-gray-500';
    }
}

// Export results to PDF (placeholder function)
function exportToPDF() {
    showToast('PDF export feature coming soon!', 'info');
}

// Print results
function printResults() {
    window.print();
}

// Share results (placeholder function)
function shareResults() {
    if (navigator.share) {
        navigator.share({
            title: 'Soil Quality Prediction Results',
            text: 'Check out my soil quality prediction results!',
            url: window.location.href
        }).then(() => {
            showToast('Results shared successfully', 'success');
        }).catch((error) => {
            console.error('Error sharing:', error);
        });
    } else {
        showToast('Sharing not supported on this device', 'warning');
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function (event) {
    // Ctrl/Cmd + Enter to submit form
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        if (document.activeElement.form === form) {
            event.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    }

    // Escape to close modals
    if (event.key === 'Escape') {
        const modals = document.querySelectorAll('.fixed.inset-0');
        modals.forEach(modal => {
            if (modal.style.display === 'flex') {
                modal.style.display = 'none';
            }
        });
    }
});

// Auto-save form data to localStorage
function saveFormData() {
    const formData = new FormData(form);
    const data = {};

    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    localStorage.setItem('soilFormData', JSON.stringify(data));
}

// Load saved form data
function loadSavedFormData() {
    const savedData = localStorage.getItem('soilFormData');
    if (savedData) {
        const data = JSON.parse(savedData);
        Object.entries(data).forEach(([key, value]) => {
            const input = document.getElementById(key);
            if (input) {
                input.value = value;
            }
        });
    }
}

// Auto-save on input change
form.addEventListener('input', saveFormData);

// Load saved data on page load
window.addEventListener('load', loadSavedFormData);



// Initialize theme on page load
function initializeThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');

    // Get saved theme or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    let isDark = savedTheme === 'dark';

    // Set initial state
    if (isDark) {
        document.body.classList.add('dark-mode');
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    } else {
        document.body.classList.remove('dark-mode');
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    }

    // Handle theme toggle click
    themeToggle.addEventListener('click', function () {
        isDark = !isDark;

        if (isDark) {
            document.body.classList.add('dark-mode');
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        } else {
            document.body.classList.remove('dark-mode');
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }

        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}


function createRippleEffect(element) {
    const ripple = document.createElement('div');
    ripple.style.position = 'absolute';
    ripple.style.width = '20px';
    ripple.style.height = '20px';
    ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
    ripple.style.borderRadius = '50%';
    ripple.style.transform = 'translate(-50%, -50%)';
    ripple.style.pointerEvents = 'none';
    ripple.style.animation = 'ripple 0.6s ease-out';

    const rect = element.getBoundingClientRect();
    ripple.style.left = '50%';
    ripple.style.top = '50%';

    element.style.position = 'relative';
    element.appendChild(ripple);

    setTimeout(() => {
        element.removeChild(ripple);
    }, 600);
}

function updateMetaThemeColor(color) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.name = 'theme-color';
        document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = color;
}

// Add ripple animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            width: 100px;
            height: 100px;
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Detect system theme preference
function detectSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
}

// Listen for system theme changes
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        // Only auto-switch if user hasn't manually set a preference
        if (!localStorage.getItem('theme')) {
            if (e.matches) {
                enableDarkMode(false);
            } else {
                disableDarkMode();
            }
        }
    });
}

// Performance monitoring
function logPerformance() {
    if (window.performance && window.performance.timing) {
        const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
        console.log(`Page load time: ${loadTime}ms`);
    }
}

window.addEventListener('load', logPerformance);

// Error handling
window.addEventListener('error', function (event) {
    console.error('JavaScript error:', event.error);
    showToast('An unexpected error occurred', 'error');
});

// Service Worker registration for PWA (placeholder)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        // Service worker registration would go here
        console.log('Service Worker support detected');
    });
}
