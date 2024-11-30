import { MedicationHelper } from './medication-helpers.js';

const DAYS_ORDER = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];

const MEDICATIONS_CONFIG = {
    daily: [
        {
            id: 'synthroid-row',
            times: 1,
            label: 'Morning'
        },
        {
            id: 'myloc-row',
            times: 1,
            label: 'Morning'
        },
        {
            id: 'pamol-row',
            times: 4,
            labels: ['7am', '11am', '3pm', '7pm']
        },
        {
            id: 'ibuprofen-row',
            times: 3,
            labels: ['Breakfast', 'Lunch', 'Dinner']
        },
        {
            id: 'clindamycin-row',
            times: 2,
            label: 'Every 12 hours'
        },
        {
            id: 'amitriptyline-row',
            times: 1,
            label: 'Bedtime'
        },
        {
            id: 'ensure-row',
            times: 8,
            hideLabels: true
        }
    ],
    adhoc: [
        {
            id: 'oxycodone-row',
            maxDoses: 4,
            interval: 4,
            hideLabels: true
        },
        {
            id: 'ondansetron-row',
            maxDoses: 3,
            hideLabels: true
        },
        {
            id: 'zopiclone-row',
            times: 1,
            label: 'Bedtime'
        }
    ]
};

class MedicationTracker {
    constructor() {
        this.storageKey = 'medicationData';
        this.helper = new MedicationHelper(MEDICATIONS_CONFIG, DAYS_ORDER);
        this.init();
    }

    async init() {
        await this.helper.initialize();
        this.setupEventListeners();
        this.loadSavedState();
        this.setupAutoReset();
        this.highlightCurrentDay();
        this.registerServiceWorker();

        // Update current day highlight every hour
        setInterval(() => this.highlightCurrentDay(), 3600000);
    }

    setupEventListeners() {
        document.addEventListener('change', (e) => {
            if (e.target.matches('input[type="checkbox"], input[type="time"]')) {
                this.handleInputChange();
            }
        });
    }

    loadSavedState() {
        try {
            const savedData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
            const inputs = document.querySelectorAll('input[type="checkbox"], input[type="time"]');

            inputs.forEach(input => {
                const value = savedData[input.id];
                if (value !== undefined) {
                    if (input.type === 'checkbox') {
                        input.checked = value;
                    } else {
                        input.value = value;
                    }
                }
            });
        } catch (error) {
            console.error('Error loading saved state:', error);
            localStorage.removeItem(this.storageKey);
        }
    }

    saveState() {
        const state = {};
        const inputs = document.querySelectorAll('input[type="checkbox"], input[type="time"]');

        inputs.forEach(input => {
            state[input.id] = input.type === 'checkbox' ? input.checked : input.value;
        });

        state.lastUpdate = new Date().toISOString();
        localStorage.setItem(this.storageKey, JSON.stringify(state));
    }

    setupAutoReset() {
        const checkReset = () => {
            const savedData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
            const lastUpdate = new Date(savedData.lastUpdate || 0);
            const now = new Date();

            if (this.shouldResetWeek(lastUpdate, now)) {
                this.resetAll();
            }
        };

        setInterval(checkReset, 60000); // Check every minute
        checkReset(); // Initial check
    }

    shouldResetWeek(lastUpdate, now) {
        // Reset when we reach Saturday (6 is Saturday in JavaScript's getDay())
        // and it's after midnight (00:01)
        return now.getDay() === 6 && // Saturday
            now.getHours() >= 0 &&
            now.getMinutes() >= 1 &&
            (lastUpdate.getDay() !== 6 || // Different day
                lastUpdate.getDate() !== now.getDate() || // Different date
                lastUpdate.getMonth() !== now.getMonth() || // Different month
                lastUpdate.getFullYear() !== now.getFullYear()); // Different year
    }

    resetAll() {
        document.querySelectorAll('input[type="checkbox"]')
            .forEach(checkbox => checkbox.checked = false);

        document.querySelectorAll('input[type="time"]')
            .forEach(timeInput => timeInput.value = '');

        this.saveState();
    }

    highlightCurrentDay() {
        const today = new Date().getDay();
        const dayIndex = (today + 1) % 7; // Adjust for Saturday start
        const dayName = DAYS_ORDER[dayIndex];

        document.querySelectorAll(`[data-day]`).forEach(cell => {
            cell.classList.remove('current-day', 'past-day');

            const cellDay = cell.getAttribute('data-day');
            const cellIndex = DAYS_ORDER.indexOf(cellDay);

            if (cellDay === dayName) {
                cell.classList.add('current-day');
            } else if (cellIndex < dayIndex) {
                cell.classList.add('past-day');
            }
        });
    }

    handleInputChange() {
        this.saveState();
    }

    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) return;

        try {
            await Promise.all(
                (await navigator.serviceWorker.getRegistrations())
                    .map(registration => registration.unregister())
            );

            await navigator.serviceWorker.register('./service-worker.js', {
                scope: './'
            });
            console.log('Service Worker registered successfully');
        } catch (error) {
            console.error('Service worker registration failed:', error);
        }
    }
}

// Initialize the tracker
new MedicationTracker();