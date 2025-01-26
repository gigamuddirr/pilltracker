document.addEventListener('DOMContentLoaded', () => {
    const currentDateElement = document.getElementById('currentDate');
    const addPillBtn = document.getElementById('addPillBtn');
    const modal = document.getElementById('addPillModal');
    const savePillBtn = document.getElementById('savePillBtn');
    const cancelPillBtn = document.getElementById('cancelPillBtn');
    const pillsContainer = document.getElementById('pillsContainer');

    // Add new variables for weekly tracking
    const weekGrid = document.getElementById('weekGrid');
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Add new variables for date picker
    const datePickerBtn = document.getElementById('datePickerBtn');
    const calendar = document.getElementById('calendar');
    const monthYear = document.getElementById('monthYear');
    const calendarDays = document.getElementById('calendarDays');
    const prevMonth = document.getElementById('prevMonth');
    const nextMonth = document.getElementById('nextMonth');
    const todayBtn = document.getElementById('todayBtn');

    let selectedDate = new Date();
    let currentMonth = selectedDate.getMonth();
    let currentYear = selectedDate.getFullYear();

    // Update current date
    function updateDate() {
        currentDateElement.textContent = selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Load saved pills from localStorage
    function loadPills() {
        const savedPills = JSON.parse(localStorage.getItem('pills') || '[]');
        const today = new Date().toDateString();
        
        pillsContainer.innerHTML = '';
        savedPills.forEach(pill => {
            const pillElement = createPillElement(pill);
            pillsContainer.appendChild(pillElement);
        });
    }

    // Function to get the start of the week (Sunday)
    function getStartOfWeek(date) {
        const newDate = new Date(date);
        const day = newDate.getDay();
        newDate.setDate(newDate.getDate() - day);
        newDate.setHours(0, 0, 0, 0);
        return newDate;
    }

    // Function to get weekly history from localStorage
    function getWeeklyHistory() {
        return JSON.parse(localStorage.getItem('weeklyHistory') || '{}');
    }

    // Function to save weekly history
    function saveWeeklyHistory(history) {
        localStorage.setItem('weeklyHistory', JSON.stringify(history));
    }

    // Function to update weekly view
    function updateWeeklyView() {
        const weeklyHistory = getWeeklyHistory();
        const startOfWeek = getStartOfWeek(selectedDate);
        
        // Clear existing grid
        weekGrid.innerHTML = '';
        
        // Add header row
        const headerRow = document.createElement('div');
        headerRow.className = 'pill-row';
        headerRow.innerHTML = '<div class="week-header"></div>';
        
        // Add day headers
        daysOfWeek.forEach(day => {
            headerRow.innerHTML += `<div class="week-header">${day}</div>`;
        });
        weekGrid.appendChild(headerRow);

        // Get all pills
        const pills = JSON.parse(localStorage.getItem('pills') || '[]');
        
        // Create a row for each pill
        pills.forEach(pill => {
            const pillRow = document.createElement('div');
            pillRow.className = 'pill-row';
            
            // Add pill name
            pillRow.innerHTML = `<div class="pill-label">${pill.name}</div>`;
            
            // Add cells for each day
            for (let i = 0; i < 7; i++) {
                const currentDate = new Date(startOfWeek);
                currentDate.setDate(startOfWeek.getDate() + i);
                const dateString = currentDate.toISOString().split('T')[0];
                
                const isToday = currentDate.toDateString() === new Date().toDateString();
                const isFuture = currentDate > new Date();
                
                let cellClass = 'day-cell';
                let content = '•';
                
                if (weeklyHistory[dateString]?.[pill.name]) {
                    cellClass += ' taken';
                    content = '✓';
                } else if (!isFuture && currentDate < new Date()) {
                    cellClass += ' missed';
                    content = '×';
                } else if (isFuture) {
                    cellClass += ' future';
                }
                
                pillRow.innerHTML += `
                    <div class="${cellClass}">
                        ${content}
                    </div>
                `;
            }
            
            weekGrid.appendChild(pillRow);
        });
    }

    // Create pill element
    function createPillElement(pill) {
        const div = document.createElement('div');
        div.className = 'pill-item';
        div.innerHTML = `
            <div class="pill-info">
                <div class="pill-name">${pill.name}</div>
                <div class="pill-time">${pill.time}</div>
            </div>
            <div class="checkbox-wrapper">
                <input type="checkbox" ${pill.taken ? 'checked' : ''}>
            </div>
        `;

        // Add event listener for checkbox
        const checkbox = div.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', (e) => {
            pill.taken = e.target.checked;
            savePills();
            
            // Update weekly history
            const today = new Date().toISOString().split('T')[0];
            const weeklyHistory = getWeeklyHistory();
            
            if (!weeklyHistory[today]) {
                weeklyHistory[today] = {};
            }
            
            weeklyHistory[today][pill.name] = e.target.checked;
            saveWeeklyHistory(weeklyHistory);
            updateWeeklyView();
        });

        return div;
    }

    // Save pills to localStorage
    function savePills() {
        const pills = Array.from(pillsContainer.children).map(pillElement => {
            return {
                name: pillElement.querySelector('.pill-name').textContent,
                time: pillElement.querySelector('.pill-time').textContent,
                taken: pillElement.querySelector('input[type="checkbox"]').checked
            };
        });
        localStorage.setItem('pills', JSON.stringify(pills));
    }

    // Modal handlers
    addPillBtn.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    cancelPillBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    savePillBtn.addEventListener('click', () => {
        const name = document.getElementById('pillName').value;
        const time = document.getElementById('pillTime').value;

        if (name && time) {
            const pill = { name, time, taken: false };
            const pillElement = createPillElement(pill);
            pillsContainer.appendChild(pillElement);
            savePills();

            // Reset and close modal
            document.getElementById('pillName').value = '';
            document.getElementById('pillTime').value = '';
            modal.style.display = 'none';
        }
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Modify the scheduleReset function to handle weekly reset
    function scheduleReset() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const timeUntilMidnight = tomorrow - now;
        
        setTimeout(() => {
            const pills = JSON.parse(localStorage.getItem('pills') || '[]');
            pills.forEach(pill => pill.taken = false);
            localStorage.setItem('pills', JSON.stringify(pills));
            
            // If it's Sunday, clear old weekly history
            if (tomorrow.getDay() === 0) {
                const weeklyHistory = getWeeklyHistory();
                const oneWeekAgo = new Date(tomorrow);
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                
                // Remove entries older than one week
                Object.keys(weeklyHistory).forEach(date => {
                    if (new Date(date) < oneWeekAgo) {
                        delete weeklyHistory[date];
                    }
                });
                
                saveWeeklyHistory(weeklyHistory);
            }
            
            loadPills();
            updateWeeklyView();
            scheduleReset();
        }, timeUntilMidnight);
    }

    // Calendar functions
    function generateCalendar(month, year) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startingDay = firstDay.getDay();
        const monthLength = lastDay.getDate();
        
        monthYear.textContent = firstDay.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
        });

        calendarDays.innerHTML = '';
        
        // Previous month's days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDay - 1; i >= 0; i--) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day other-month';
            dayDiv.textContent = prevMonthLastDay - i;
            calendarDays.appendChild(dayDiv);
        }

        // Current month's days
        for (let i = 1; i <= monthLength; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.textContent = i;

            const currentDate = new Date(year, month, i);
            if (currentDate.toDateString() === selectedDate.toDateString()) {
                dayDiv.classList.add('selected');
            }
            if (currentDate.toDateString() === new Date().toDateString()) {
                dayDiv.classList.add('today');
            }

            dayDiv.addEventListener('click', () => {
                selectedDate = new Date(year, month, i);
                updateDate();
                loadPillsForDate(selectedDate);
                calendar.classList.remove('show');
                updateWeeklyView();
            });

            calendarDays.appendChild(dayDiv);
        }

        // Next month's days
        const remainingDays = 42 - (startingDay + monthLength); // 42 is 6 rows * 7 days
        for (let i = 1; i <= remainingDays; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day other-month';
            dayDiv.textContent = i;
            calendarDays.appendChild(dayDiv);
        }
    }

    // Modify loadPills to handle specific dates
    function loadPillsForDate(date) {
        const savedPills = JSON.parse(localStorage.getItem('pills') || '[]');
        const dateString = date.toISOString().split('T')[0];
        const weeklyHistory = getWeeklyHistory();
        
        pillsContainer.innerHTML = '';
        savedPills.forEach(pill => {
            const pillElement = createPillElement(pill, weeklyHistory[dateString]?.[pill.name] || false);
            pillsContainer.appendChild(pillElement);
        });
    }

    // Modify createPillElement to handle specific dates
    function createPillElement(pill, taken) {
        const div = document.createElement('div');
        div.className = 'pill-item';
        div.innerHTML = `
            <div class="pill-info">
                <div class="pill-name">${pill.name}</div>
                <div class="pill-time">${pill.time}</div>
            </div>
            <div class="checkbox-wrapper">
                <input type="checkbox" ${taken ? 'checked' : ''}>
            </div>
        `;

        const checkbox = div.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', (e) => {
            const dateString = selectedDate.toISOString().split('T')[0];
            const weeklyHistory = getWeeklyHistory();
            
            if (!weeklyHistory[dateString]) {
                weeklyHistory[dateString] = {};
            }
            
            weeklyHistory[dateString][pill.name] = e.target.checked;
            saveWeeklyHistory(weeklyHistory);
            updateWeeklyView();
        });

        return div;
    }

    // Event listeners for calendar
    datePickerBtn.addEventListener('click', () => {
        calendar.classList.toggle('show');
        generateCalendar(currentMonth, currentYear);
    });

    prevMonth.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        generateCalendar(currentMonth, currentYear);
    });

    nextMonth.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        generateCalendar(currentMonth, currentYear);
    });

    todayBtn.addEventListener('click', () => {
        selectedDate = new Date();
        currentMonth = selectedDate.getMonth();
        currentYear = selectedDate.getFullYear();
        updateDate();
        loadPillsForDate(selectedDate);
        calendar.classList.remove('show');
        updateWeeklyView();
    });

    // Close calendar when clicking outside
    document.addEventListener('click', (e) => {
        if (!calendar.contains(e.target) && !datePickerBtn.contains(e.target)) {
            calendar.classList.remove('show');
        }
    });

    // Initial load
    updateDate();
    loadPillsForDate(selectedDate);
    updateWeeklyView();
    scheduleReset();
}); 