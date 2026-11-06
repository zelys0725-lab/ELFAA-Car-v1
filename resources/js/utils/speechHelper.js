/**
 * ELFAA Car Rental — Web Speech API & Voice Assistant Utilities
 * 100% Free browser-based Speech Recognition & Speech Synthesis without paid API dependencies.
 */

// ─────────────────────────────────────────────────────────────
// 1. Browser Support Detection
// ─────────────────────────────────────────────────────────────

export const isSpeechRecognitionSupported = () => {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
};

export const isSpeechSynthesisSupported = () => {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance !== 'undefined';
};

// ─────────────────────────────────────────────────────────────
// 2. Web Audio API Feedback Chimes (Zero external sound files)
// ─────────────────────────────────────────────────────────────

let audioCtx = null;
const getAudioContext = () => {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) {
        audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }
    return audioCtx;
};

export const playAudioChime = (type = 'start') => {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const gainNode = ctx.createGain();
        gainNode.connect(ctx.destination);

        if (type === 'start') {
            // Pleasant upward double-beep indicating mic is active
            const osc1 = ctx.createOscillator();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(440, now);
            osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);

            gainNode.gain.setValueAtTime(0.001, now);
            gainNode.gain.linearRampToValueAtTime(0.12, now + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

            osc1.connect(gainNode);
            osc1.start(now);
            osc1.stop(now + 0.22);
        } else if (type === 'success') {
            // Elegant 3-note ascending chime (C5 -> E5 -> G5)
            const notes = [523.25, 659.25, 783.99];
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const noteGain = ctx.createGain();
                const noteStart = now + idx * 0.08;

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, noteStart);

                noteGain.gain.setValueAtTime(0.001, noteStart);
                noteGain.gain.linearRampToValueAtTime(0.12, noteStart + 0.02);
                noteGain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.25);

                osc.connect(noteGain);
                noteGain.connect(ctx.destination);

                osc.start(noteStart);
                osc.stop(noteStart + 0.26);
            });
        } else if (type === 'error') {
            // Gentle low downward tone
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(260, now);
            osc.frequency.exponentialRampToValueAtTime(160, now + 0.18);

            gainNode.gain.setValueAtTime(0.001, now);
            gainNode.gain.linearRampToValueAtTime(0.08, now + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

            osc.connect(gainNode);
            osc.start(now);
            osc.stop(now + 0.24);
        }
    } catch {
        // Silently ignore audio context restrictions
    }
};

// ─────────────────────────────────────────────────────────────
// 3. Speech Recognition Engine
// ─────────────────────────────────────────────────────────────

export const createSpeechRecognizer = ({
    onResult,
    onInterim,
    onStart,
    onEnd,
    onError,
    lang = 'en-US',
} = {}) => {
    if (!isSpeechRecognitionSupported()) return null;

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
        playAudioChime('start');
        if (onStart) onStart();
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        if (interimTranscript && onInterim) {
            onInterim(interimTranscript);
        }

        if (finalTranscript) {
            playAudioChime('success');
            if (onResult) onResult(finalTranscript.trim());
        }
    };

    recognition.onerror = (event) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
            playAudioChime('error');
        }
        if (onError) onError(event);
    };

    recognition.onend = () => {
        if (onEnd) onEnd();
    };

    return recognition;
};

// ─────────────────────────────────────────────────────────────
// 4. Speech Synthesis Engine (Clean Voice Output)
// ─────────────────────────────────────────────────────────────

let currentUtterance = null;

// Clean markdown and symbols for voice pronunciation
export const cleanTextForSpeech = (text = '') => {
    if (!text) return '';
    return text
        // Remove markdown bold/italic/code
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        // Clean markdown list bullets and headers
        .replace(/^[\s*•\-#]+\s*/gm, '')
        // Clean emojis (simplifies speech engine pronunciation)
        .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
        // Convert currency format to spoken words
        .replace(/PHP\s*([\d,]+(?:\.\d+)?)/gi, '$1 pesos')
        .replace(/₱\s*([\d,]+(?:\.\d+)?)/gi, '$1 pesos')
        // Replace multiple newlines or spaces with single space
        .replace(/\s+/g, ' ')
        .trim();
};

export const stopSpeaking = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
        window.speechSynthesis.cancel();
        currentUtterance = null;
    } catch {
        // ignore
    }
};

export const speakText = (text, {
    onStart,
    onEnd,
    rate = 1.02,
    pitch = 1.0,
    volume = 1.0,
    lang = 'en-US'
} = {}) => {
    if (!isSpeechSynthesisSupported()) {
        if (onEnd) onEnd();
        return;
    }

    const clean = cleanTextForSpeech(text);
    if (!clean) {
        if (onEnd) onEnd();
        return;
    }

    try {
        stopSpeaking();

        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;
        utterance.lang = lang;

        // Choose the highest quality natural English voice available
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
            const preferred = voices.find(v => 
                (v.lang.startsWith('en') || v.lang.includes('PH')) &&
                (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Jenny') || v.name.includes('Zira') || v.name.includes('Victoria'))
            ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

            if (preferred) {
                utterance.voice = preferred;
            }
        }

        utterance.onstart = () => {
            currentUtterance = utterance;
            if (onStart) onStart();
        };

        utterance.onend = () => {
            currentUtterance = null;
            if (onEnd) onEnd();
        };

        utterance.onerror = () => {
            currentUtterance = null;
            if (onEnd) onEnd();
        };

        window.speechSynthesis.speak(utterance);
    } catch {
        if (onEnd) onEnd();
    }
};

// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// 5. Intelligent Date & Duration Parser
// ─────────────────────────────────────────────────────────────

const padNumber = (n) => (n < 10 ? `0${n}` : `${n}`);

export const formatDatetimeLocal = (date) => {
    const y = date.getFullYear();
    const m = padNumber(date.getMonth() + 1);
    const d = padNumber(date.getDate());
    const h = padNumber(date.getHours());
    const min = padNumber(date.getMinutes());
    return `${y}-${m}-${d}T${h}:${min}`;
};

export const parseVoiceDates = (rawText = '') => {
    if (!rawText) return null;
    const q = rawText.toLowerCase();

    const now = new Date();
    let startDate = null;
    let endDate = null;
    let daysCount = 1;

    // 1. "this weekend" / "the weekend" (Saturday 9:00 AM to Sunday 6:00 PM)
    if (/(this|the)\s+weekend|weekend/.test(q) && !/next weekend/.test(q)) {
        const dayOfWeek = now.getDay(); // 0 = Sun, 6 = Sat
        const daysUntilSat = (6 - dayOfWeek + 7) % 7 || 7;
        const sat = new Date(now);
        sat.setDate(now.getDate() + (dayOfWeek === 6 ? 0 : daysUntilSat));
        sat.setHours(9, 0, 0, 0);

        const sun = new Date(sat);
        sun.setDate(sat.getDate() + 1);
        sun.setHours(18, 0, 0, 0);

        return {
            startDatetime: formatDatetimeLocal(sat),
            endDatetime: formatDatetimeLocal(sun),
            daysCount: 2,
            label: 'This Weekend (Sat 9:00 AM – Sun 6:00 PM)',
            spoken: 'This weekend from Saturday 9:00 AM to Sunday 6:00 PM',
        };
    }

    // 2. "next weekend"
    if (/next weekend/.test(q)) {
        const dayOfWeek = now.getDay();
        const daysUntilSat = ((6 - dayOfWeek + 7) % 7 || 7) + 7;
        const sat = new Date(now);
        sat.setDate(now.getDate() + daysUntilSat);
        sat.setHours(9, 0, 0, 0);

        const sun = new Date(sat);
        sun.setDate(sat.getDate() + 1);
        sun.setHours(18, 0, 0, 0);

        return {
            startDatetime: formatDatetimeLocal(sat),
            endDatetime: formatDatetimeLocal(sun),
            daysCount: 2,
            label: 'Next Weekend (Sat 9:00 AM – Sun 6:00 PM)',
            spoken: 'Next weekend from Saturday 9:00 AM to Sunday 6:00 PM',
        };
    }

    // 3. Day to Day ranges (e.g. "from Friday to Sunday", "Monday to Thursday")
    const daysMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
    const rangeMatch = q.match(/(?:from\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+to\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);

    if (rangeMatch) {
        const startDayName = rangeMatch[1].toLowerCase();
        const endDayName = rangeMatch[2].toLowerCase();
        const targetStartDay = daysMap[startDayName];
        const targetEndDay = daysMap[endDayName];

        const daysUntilStart = (targetStartDay - now.getDay() + 7) % 7 || 7;
        startDate = new Date(now);
        startDate.setDate(now.getDate() + daysUntilStart);
        startDate.setHours(9, 0, 0, 0);

        let daysUntilEnd = (targetEndDay - startDate.getDay() + 7) % 7;
        if (daysUntilEnd === 0) daysUntilEnd = 7;
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + daysUntilEnd);
        endDate.setHours(18, 0, 0, 0);

        const diffTime = Math.abs(endDate - startDate);
        daysCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

        return {
            startDatetime: formatDatetimeLocal(startDate),
            endDatetime: formatDatetimeLocal(endDate),
            daysCount,
            label: `${startDayName.charAt(0).toUpperCase() + startDayName.slice(1)} to ${endDayName.charAt(0).toUpperCase() + endDayName.slice(1)} (${daysCount} days)`,
            spoken: `From ${startDayName} at 9:00 AM to ${endDayName} at 6:00 PM (${daysCount} days)`,
        };
    }

    // 4. Duration checking: "for X days", "for 1 week", "for 3 days"
    const durationMatch = q.match(/for\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|a)\s+(day|days|week|weeks)/i)
        || q.match(/(\d+)\s+days?\s*(rental|trip|booking)?/i);

    if (durationMatch) {
        const numStr = (durationMatch[1] || '').toLowerCase();
        const unit = (durationMatch[2] || 'day').toLowerCase();
        let count = 1;
        const numMap = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, a: 1 };
        if (numMap[numStr]) count = numMap[numStr];
        else count = parseInt(numStr, 10) || 1;

        if (unit.startsWith('week')) count *= 7;
        daysCount = Math.max(1, count);
    }

    const hasTomorrow = /\btomorrow\b/i.test(q);
    const hasToday = /\btoday\b/i.test(q);

    if (hasTomorrow) {
        startDate = new Date(now);
        startDate.setDate(now.getDate() + 1);
        startDate.setHours(9, 0, 0, 0);
    } else if (hasToday) {
        startDate = new Date(now);
        startDate.setHours(Math.min(20, now.getHours() + 2), 0, 0, 0);
    }

    if (startDate) {
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + daysCount);
        endDate.setHours(startDate.getHours(), 0, 0, 0);

        return {
            startDatetime: formatDatetimeLocal(startDate),
            endDatetime: formatDatetimeLocal(endDate),
            daysCount,
            label: `${hasTomorrow ? 'Tomorrow' : 'Today'} for ${daysCount} day${daysCount > 1 ? 's' : ''}`,
            spoken: `${hasTomorrow ? 'Tomorrow' : 'Today'} at ${startDate.getHours()}:00 for ${daysCount} day${daysCount > 1 ? 's' : ''}`,
        };
    }

    if (durationMatch) {
        startDate = new Date(now);
        startDate.setDate(now.getDate() + 1);
        startDate.setHours(9, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + daysCount);
        endDate.setHours(9, 0, 0, 0);

        return {
            startDatetime: formatDatetimeLocal(startDate),
            endDatetime: formatDatetimeLocal(endDate),
            daysCount,
            label: `Starting tomorrow for ${daysCount} day${daysCount > 1 ? 's' : ''}`,
            spoken: `Starting tomorrow for ${daysCount} day${daysCount > 1 ? 's' : ''}`,
        };
    }

    return null;
};

// ─────────────────────────────────────────────────────────────
// 6. Intelligent Vehicle Matcher (Dynamically matches any vehicle in DB)
// ─────────────────────────────────────────────────────────────

export const findBestVehicleMatch = (rawQuery = '', vehicles = []) => {
    if (!rawQuery || !vehicles || vehicles.length === 0) {
        return null;
    }

    const q = rawQuery.toLowerCase().trim();

    // Strip date expressions before matching vehicle words
    const cleanQuery = q
        .replace(/^(can you|please|kindly|i want to|i'd like to|i would like to|help me|could you)\s+/i, '')
        .replace(/^(book|reserve|rent|borrow|get|hire|choose|select|find|search for)\s+(me\s+)?(a\s+|an\s+|the\s+)?/i, '')
        .replace(/(?:from\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+to\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))?/gi, '')
        .replace(/\b(tomorrow|today|this weekend|next weekend|weekend)\b/gi, '')
        .replace(/for\s+\d+\s+days?/gi, '')
        .replace(/for\s+(a|one|two|three|four|five|six|seven)\s+(days?|weeks?)/gi, '')
        .replace(/starting\s+(tomorrow|today|next week)/gi, '')
        .replace(/\s+(please|now|car|vehicle)$/i, '')
        .trim();

    if (!cleanQuery) return null;

    // 1. Direct name match or exact containment across all database vehicles
    for (const vehicle of vehicles) {
        const vName = vehicle.name.toLowerCase();
        if (vName === cleanQuery || cleanQuery === vName) {
            return { vehicle, confidence: 1.0, matchType: 'exact' };
        }
        if (vName.includes(cleanQuery) && cleanQuery.length >= 3) {
            return { vehicle, confidence: 0.95, matchType: 'substring' };
        }
    }

    // 2. Token-based / Model keyword matching for any car in the database
    let bestVehicle = null;
    let highestScore = 0;

    for (const vehicle of vehicles) {
        const vName = vehicle.name.toLowerCase();
        const vType = (vehicle.type || '').toLowerCase();
        let score = 0;

        const words = cleanQuery.split(/\s+/).filter(w => w.length > 2);
        for (const word of words) {
            if (vName.includes(word)) {
                score += 30;
            }
            if (vType.includes(word)) {
                score += 15;
            }
        }

        // Check for specific brand mentions
        if (q.includes('toyota') && vName.includes('toyota')) score += 10;
        if (q.includes('mitsubishi') && vName.includes('mitsubishi')) score += 10;
        if (q.includes('ford') && vName.includes('ford')) score += 10;
        if (q.includes('honda') && vName.includes('honda')) score += 10;
        if (q.includes('nissan') && vName.includes('nissan')) score += 10;
        if (q.includes('hyundai') && vName.includes('hyundai')) score += 10;

        if (score > highestScore) {
            highestScore = score;
            bestVehicle = vehicle;
        }
    }

    if (bestVehicle && highestScore >= 20) {
        return { vehicle: bestVehicle, confidence: highestScore / 50, matchType: 'keyword' };
    }

    // 3. Category queries (e.g. "sedan", "suv", "mpv", "pickup", "van")
    const types = ['sedan', 'suv', 'mpv', 'pickup', 'van', 'hatchback'];
    for (const type of types) {
        if (q.includes(type)) {
            const match = vehicles.find(v => (v.type || '').toLowerCase() === type && v.status === 'available')
                || vehicles.find(v => (v.type || '').toLowerCase() === type);
            if (match) {
                return { vehicle: match, confidence: 0.75, matchType: 'type' };
            }
        }
    }

    // 4. Seating capacity query (e.g. "7 seater", "5 seats", "7 passengers")
    if (q.includes('7') || q.includes('seven')) {
        const match = vehicles.find(v => v.seats >= 7 && v.status === 'available')
            || vehicles.find(v => v.seats >= 7);
        if (match) {
            return { vehicle: match, confidence: 0.7, matchType: 'seats' };
        }
    }

    // 5. Cheapest / Lowest price query ("cheapest car", "affordable car", "lowest rate")
    if (/cheap|cheapest|affordable|lowest|budget/.test(q)) {
        const sorted = [...vehicles].sort((a, b) => parseFloat(a.price_per_day) - parseFloat(b.price_per_day));
        if (sorted.length > 0) {
            return { vehicle: sorted[0], confidence: 0.8, matchType: 'price' };
        }
    }

    return null;
};

// ─────────────────────────────────────────────────────────────
// 7. Voice Command Interpreter
// ─────────────────────────────────────────────────────────────

export const interpretVoiceCommand = (rawText = '', { vehicles = [], documents = [], activeStep = 1 } = {}) => {
    const text = rawText.trim();
    const q = text.toLowerCase();

    // 1. Check for Date extraction first
    const parsedDates = parseVoiceDates(q);

    // 2. Direct booking command or vehicle match
    const matchResult = findBestVehicleMatch(q, vehicles);

    if (matchResult && matchResult.vehicle) {
        return {
            type: parsedDates ? 'BOOK_WITH_DATES' : 'BOOK_VEHICLE',
            vehicle: matchResult.vehicle,
            dates: parsedDates,
            confidence: matchResult.confidence,
            matchType: matchResult.matchType,
            text: text,
        };
    }

    // 3. User is setting or changing dates only (without naming a car)
    if (parsedDates && (/pickup|return|rent for|dates|from|schedule|starting|days\b|weekend/.test(q))) {
        return {
            type: 'SET_DATES',
            dates: parsedDates,
            text: text,
        };
    }

    // 4. Request to list all database cars
    if (/all cars|list cars|show cars|available cars|show fleet|what cars|fleet list|browse fleet|see cars/.test(q)) {
        return {
            type: 'LIST_ALL_VEHICLES',
            text: text,
        };
    }

    // 5. Stop voice speech command
    if (/^(stop|quiet|be quiet|shut up|mute|silence|stop talking|pause)\b/i.test(q)) {
        return { type: 'STOP_SPEECH' };
    }

    // 6. Step navigation commands
    if (/next (step|requirement|page|item)|proceed|continue|move on/i.test(q)) {
        return { type: 'NAVIGATE_STEP', step: Math.min(4, activeStep + 1) };
    }
    if (/previous (step|requirement)|back|go back|last step/i.test(q)) {
        return { type: 'NAVIGATE_STEP', step: Math.max(1, activeStep - 1) };
    }
    if (/step 1|first requirement|requirement 1|driver'?s? license/i.test(q)) {
        return { type: 'NAVIGATE_STEP', step: 1 };
    }
    if (/step 2|second requirement|requirement 2|secondary id|photo id|government id/i.test(q)) {
        return { type: 'NAVIGATE_STEP', step: 2 };
    }
    if (/step 3|third requirement|requirement 3|proof of billing|billing|utility bill/i.test(q)) {
        return { type: 'NAVIGATE_STEP', step: 3 };
    }
    if (/step 4|final step|submit booking|review reservation|dates step/i.test(q)) {
        return { type: 'NAVIGATE_STEP', step: 4 };
    }

    // 7. Repeat / Read aloud current step
    if (/repeat|say again|read (out loud|again|step|requirement)|tell me again/i.test(q)) {
        return { type: 'REPEAT_STEP' };
    }

    // 8. Check document verification status
    if (/check (my )?(docs|documents|status|verification)|are my documents verified|am i verified/i.test(q)) {
        return { type: 'CHECK_DOCUMENTS' };
    }

    // 9. Agreement to Terms
    if (/agree( to terms)?|i agree|accept terms|check terms/i.test(q)) {
        return { type: 'AGREE_TERMS' };
    }

    // 10. Submit reservation
    if (/submit( my)? (booking|reservation)|complete (booking|reservation)|confirm booking/i.test(q)) {
        return { type: 'SUBMIT_BOOKING' };
    }

    // 11. General inquiry or fallback
    return {
        type: 'CONVERSATION',
        text: text,
    };
};
