/* ============================================================
   TIMER — Synchronized Timer Logic
   ============================================================ */

class MatchTimer {
    constructor() {
        this.callbacks = [];
        this.alarmCallbacks = [];
        this._intervalId = null;
        this._alarmTriggered = { 1: false, 2: false };
    }

    /**
     * Start the timer for a given field
     */
    start(fieldNum = 1) {
        const field = matchState.fields[fieldNum];
        if (field.timerRunning) return;
        
        field.timerRunning = true;
        field.timerStartTimestamp = Date.now() - (field.timerSeconds * 1000);
        field.status = 'live';
        broadcastState();
        this._ensureTicking();
    }

    /**
     * Pause the timer
     */
    pause(fieldNum = 1) {
        const field = matchState.fields[fieldNum];
        if (!field.timerRunning) return;
        
        field.timerRunning = false;
        field.timerSeconds = this.getElapsed(fieldNum);
        field.timerStartTimestamp = null;
        broadcastState();
    }

    /**
     * Toggle play/pause
     */
    toggle(fieldNum = 1) {
        const field = matchState.fields[fieldNum];
        if (field.timerRunning) {
            this.pause(fieldNum);
        } else {
            this.start(fieldNum);
        }
    }

    /**
     * Reset the timer
     */
    reset(fieldNum = 1) {
        const field = matchState.fields[fieldNum];
        field.timerRunning = false;
        field.timerSeconds = 0;
        field.timerStartTimestamp = null;
        field.timerBaseSeconds = 0;
        field.addedTime = 0;
        broadcastState();
    }

    /**
     * Set base seconds for period accumulation.
     * Called when transitioning between periods (e.g., 1st half -> 2nd half).
     * The base is added to the running elapsed time so the clock continues
     * from where the previous period's max was (e.g., 40:00 for a 40-min half).
     */
    setBaseForPeriod(baseSeconds, fieldNum = 1) {
        const field = matchState.fields[fieldNum];
        field.timerBaseSeconds = Math.max(0, baseSeconds);
        field.timerSeconds = 0;
        field.addedTime = 0;
        if (field.timerRunning) {
            field.timerStartTimestamp = Date.now();
        }
        broadcastState();
    }

    /**
     * Adjust the timer manually
     */
    adjust(seconds, fieldNum = 1) {
        const field = matchState.fields[fieldNum];
        if (field.timerRunning && field.timerStartTimestamp) {
            field.timerStartTimestamp -= (seconds * 1000);
        } else {
            field.timerSeconds += seconds;
            if (field.timerSeconds < 0) field.timerSeconds = 0;
        }
        broadcastState();
    }

    /**
     * Set the timer directly to a specific number of seconds
     */
    setManualTime(seconds, fieldNum = 1) {
        const field = matchState.fields[fieldNum];
        field.timerSeconds = seconds;
        if (field.timerRunning) {
            field.timerStartTimestamp = Date.now() - (seconds * 1000);
        }
        broadcastState();
    }

    /**
     * Get raw seconds since the timer was started (without base).
     * Used internally for calculations.
     */
    _getRawSeconds(fieldNum = 1) {
        const field = matchState.fields[fieldNum];
        if (field.timerRunning && field.timerStartTimestamp) {
            return Math.floor((Date.now() - field.timerStartTimestamp) / 1000);
        }
        return field.timerSeconds || 0;
    }

    /**
     * Get elapsed seconds (display value).
     * Progressive: base + rawSeconds (e.g., 40:00 base + 5:00 = 45:00)
     * Regressive: maxSeconds - rawSeconds (counting down from max)
     */
    getElapsed(fieldNum = 1) {
        const field = matchState.fields[fieldNum];
        const raw = this._getRawSeconds(fieldNum);
        const direction = field.timerDirection || 'up';
        const base = field.timerBaseSeconds || 0;

        if (direction === 'down') {
            // Regressive: count down from max (including added time if active)
            const maxSecs = field.timerMaxSeconds || 0;
            const remaining = maxSecs - raw;
            return Math.max(0, remaining);
        } else {
            // Progressive: base + elapsed
            return base + raw;
        }
    }

    /**
     * Check if the match is currently in added/injury time.
     * For progressive: elapsed > maxSeconds (period max + base)
     * For regressive: raw > maxSeconds (timer has gone past 0)
     */
    isInAddedTime(fieldNum = 1) {
        const field = matchState.fields[fieldNum];
        const raw = this._getRawSeconds(fieldNum);
        const direction = field.timerDirection || 'up';
        const maxSecs = field.timerMaxSeconds || 0;

        if (direction === 'down') {
            return raw > maxSecs;
        } else {
            const base = field.timerBaseSeconds || 0;
            return (base + raw) > (base + maxSecs);
        }
    }

    /**
     * Format seconds to MM:SS
     */
    format(totalSeconds) {
        const isNegative = totalSeconds < 0;
        const absSeconds = Math.abs(totalSeconds);
        const mins = Math.floor(absSeconds / 60);
        const secs = absSeconds % 60;
        return `${isNegative ? '-' : ''}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    /**
     * Set max duration in minutes
     */
    setDuration(minutes, fieldNum = 1) {
        matchState.fields[fieldNum].timerMaxSeconds = minutes * 60;
        broadcastState();
    }

    /**
     * Adjust added time
     */
    adjustAddedTime(minutes, fieldNum = 1) {
        const field = matchState.fields[fieldNum];
        field.addedTime = (field.addedTime || 0) + minutes;
        if (field.addedTime < 0) field.addedTime = 0;
        broadcastState();
    }

    /**
     * Set added time directly
     */
    setAddedTime(minutes, fieldNum = 1) {
        const field = matchState.fields[fieldNum];
        field.addedTime = Math.max(0, minutes);
        broadcastState();
    }

    /**
     * Check if timer has reached max (for the current period)
     */
    hasFinished(fieldNum = 1) {
        const field = matchState.fields[fieldNum];
        const raw = this._getRawSeconds(fieldNum);
        return raw >= (field.timerMaxSeconds || 0);
    }

    /**
     * Register a tick callback (called every second)
     */
    onTick(callback) {
        this.callbacks.push(callback);
    }

    /**
     * Register alarm callback (called when timer reaches max)
     */
    onAlarm(callback) {
        this.alarmCallbacks.push(callback);
    }

    /**
     * Ensure the internal interval is running
     */
    _ensureTicking() {
        if (this._intervalId) return;
        
        this._intervalId = setInterval(() => {
            let anyRunning = false;
            
            // Check both fields
            for (const fn of [1, 2]) {
                const field = matchState.fields[fn];
                if (field.timerRunning) {
                    anyRunning = true;
                    const elapsed = this.getElapsed(fn);
                    
                    // Check alarm
                    if (elapsed >= field.timerMaxSeconds) {
                        if (!this._alarmTriggered[fn]) {
                            this._alarmTriggered[fn] = true;
                            this.alarmCallbacks.forEach(cb => cb(fn, elapsed));
                        }
                    } else {
                        this._alarmTriggered[fn] = false;
                    }
                }
            }
            
            // Fire tick callbacks
            this.callbacks.forEach(cb => cb());
            
            // Stop interval if no timers running
            if (!anyRunning) {
                clearInterval(this._intervalId);
                this._intervalId = null;
            }
        }, 250); // 4 updates per second for smooth display
    }

    /**
     * Sync timer from external state (for display receiving broadcasts)
     */
    syncFromState() {
        for (const fn of [1, 2]) {
            const field = matchState.fields[fn];
            if (field.timerRunning && !this._intervalId) {
                this._ensureTicking();
            }
        }
    }
}

// Global timer instance
const matchTimer = new MatchTimer();
