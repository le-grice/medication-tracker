export class MedicationHelper {
    constructor(config, daysOrder) {
        this.config = config;
        this.daysOrder = daysOrder;
    }

    createCheckboxElement(id, index, dayIndex, config) {
        const wrapper = document.createElement('div');
        wrapper.className = 'checkbox-wrapper';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'checkbox';
        checkbox.id = `${id}-${dayIndex}-${index}`;

        // Only create label if hideLabels is not true
        if (!config.hideLabels) {
            const labelText = config.labels ? config.labels[index] :
                config.label ? config.label :
                    `Dose ${index + 1}`;

            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.className = 'checkbox-label';
            label.textContent = labelText;

            checkbox.setAttribute('aria-label', labelText);
        } else {
            checkbox.setAttribute('aria-label', `Dose ${index + 1}`);
        }

        wrapper.appendChild(checkbox);

        // Add label to wrapper if it exists and shouldn't be hidden
        if (!config.hideLabels) {
            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.className = 'checkbox-label';
            label.textContent = config.labels ? config.labels[index] :
                config.label ? config.label :
                    `Dose ${index + 1}`;
            wrapper.appendChild(label);
        }

        return wrapper;
    }

    createTimeInput(id, index, dayIndex) {
        const timeInput = document.createElement('input');
        timeInput.type = 'time';
        timeInput.className = 'time-input';
        timeInput.id = `${id}-time-${dayIndex}-${index}`;
        timeInput.setAttribute('aria-label', `Time for dose ${index + 1}`);
        return timeInput;
    }

    setupMedicationRow(rowId, config) {
        const row = document.getElementById(rowId);
        if (!row) {
            console.warn(`Row not found: ${rowId}`);
            return;
        }

        const cells = Array.from(row.getElementsByTagName('td')).slice(2);
        const isAdhoc = 'maxDoses' in config;

        cells.forEach((cell, dayIndex) => {
            cell.innerHTML = '';

            const dayWrapper = document.createElement('div');
            dayWrapper.className = 'day-doses';

            const dosesCount = isAdhoc ? config.maxDoses : config.times;

            for (let i = 0; i < dosesCount; i++) {
                const wrapper = this.createCheckboxElement(rowId, i, dayIndex, config);

                if (isAdhoc) {
                    const timeInput = this.createTimeInput(rowId, i, dayIndex);
                    wrapper.appendChild(timeInput);
                }

                dayWrapper.appendChild(wrapper);
            }

            cell.appendChild(dayWrapper);
        });
    }

    // Rest of the class remains the same
    setupDailyMedications() {
        this.config.daily.forEach(med => {
            this.setupMedicationRow(med.id, med);
        });
    }

    setupAdhocMedications() {
        this.config.adhoc.forEach(med => {
            this.setupMedicationRow(med.id, med);
        });
    }

    addTimeValidation() {
        document.querySelectorAll('input[type="time"]').forEach(input => {
            input.addEventListener('change', (e) => {
                const row = e.target.closest('tr');
                const rowId = row.id;
                const med = this.config.adhoc.find(m => m.id === rowId);

                if (med && med.interval) {
                    const previousTime = this.getPreviousDoseTime(row, e.target);
                    if (previousTime) {
                        const hoursDiff = this.getHoursDifference(previousTime, e.target.value);
                        if (hoursDiff < med.interval) {
                            alert(`Warning: This medication requires at least ${med.interval} hours between doses.`);
                            e.target.value = '';
                        }
                    }
                }
            });
        });
    }

    getPreviousDoseTime(row, currentInput) {
        const timeInputs = Array.from(row.querySelectorAll('input[type="time"]'));
        const currentIndex = timeInputs.indexOf(currentInput);
        const previousInputs = timeInputs.slice(0, currentIndex);

        for (let i = previousInputs.length - 1; i >= 0; i--) {
            if (previousInputs[i].value) {
                return previousInputs[i].value;
            }
        }
        return null;
    }

    getHoursDifference(time1, time2) {
        const [hours1, minutes1] = time1.split(':').map(Number);
        const [hours2, minutes2] = time2.split(':').map(Number);

        const date1 = new Date(2000, 0, 1, hours1, minutes1);
        const date2 = new Date(2000, 0, 1, hours2, minutes2);

        return Math.abs(date2 - date1) / (1000 * 60 * 60);
    }

    initialize() {
        return new Promise((resolve) => {
            // Setup all medication rows
            this.setupDailyMedications();
            this.setupAdhocMedications();

            // Add time validation for adhoc medications
            this.addTimeValidation();

            resolve();
        });
    }
}

export default new MedicationHelper();