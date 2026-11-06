import React, { useState, useEffect, useRef } from 'react';
import { 
    Mic, 
    MicOff, 
    Volume2, 
    VolumeX, 
    X, 
    Send, 
    Bot, 
    Car, 
    CheckCircle2, 
    AlertCircle, 
    Clock, 
    ChevronRight, 
    ChevronLeft, 
    ArrowRight, 
    ShieldCheck, 
    FileText, 
    Receipt, 
    Sparkles, 
    RotateCcw,
    Zap,
    Calendar,
    CalendarRange,
    ListFilter
} from 'lucide-react';
import { 
    isSpeechRecognitionSupported, 
    isSpeechSynthesisSupported, 
    createSpeechRecognizer, 
    speakText, 
    stopSpeaking, 
    playAudioChime, 
    findBestVehicleMatch, 
    interpretVoiceCommand,
    formatDatetimeLocal,
    parseVoiceDates
} from '@/utils/speechHelper';

const formatPHP = (amount) =>
    'PHP ' + parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const timestamp = () =>
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

export default function VoiceBookingAssistant({
    vehicles = [],
    promos = [],
    addOns = [],
    bookings = [],
    documents = [],
    auth = null,
    onSelectVehicle = null,
    onNavigateTab = null,
    bookingData = null,
    setBookingData = null,
    triggerSubmitBooking = null,
    initialOpen = false,
}) {
    const [isOpen, setIsOpen] = useState(initialOpen);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(true);
    const [ttsSupported, setTtsSupported] = useState(true);
    const [interimText, setInterimText] = useState('');
    const [inputText, setInputText] = useState('');
    const [messages, setMessages] = useState([]);
    const [matchedVehicle, setMatchedVehicle] = useState(null);
    const [activeGuideStep, setActiveGuideStep] = useState(1);
    const [guideMode, setGuideMode] = useState(false);
    const [hasGreeted, setHasGreeted] = useState(false);
    const [selectedStartDate, setSelectedStartDate] = useState(bookingData?.start_datetime || '');
    const [selectedEndDate, setSelectedEndDate] = useState(bookingData?.end_datetime || '');

    // Synchronize dates if bookingData changes externally
    useEffect(() => {
        if (bookingData?.start_datetime) setSelectedStartDate(bookingData.start_datetime);
        if (bookingData?.end_datetime) setSelectedEndDate(bookingData.end_datetime);
    }, [bookingData?.start_datetime, bookingData?.end_datetime]);

    const calculateRentalDays = (start, end) => {
        if (!start || !end) return 0;
        const diff = new Date(end) - new Date(start);
        if (diff <= 0) return 0;
        return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };

    const pushBotMessage = (text, chips = [], extra = null) => {
        setMessages(prev => [...prev, {
            role: 'bot',
            text,
            chips,
            extra,
            time: timestamp()
        }]);
    };

    const pushUserMessage = (text) => {
        setMessages(prev => [...prev, {
            role: 'user',
            text,
            time: timestamp()
        }]);
    };

    // ─────────────────────────────────────────────────────────────
    // Speech Synthesis Helper with Mute check
    // ─────────────────────────────────────────────────────────────
    const botSpeak = (text) => {
        if (isMuted || !ttsSupported) return;
        speakText(text, {
            onStart: () => setIsSpeaking(true),
            onEnd: () => setIsSpeaking(false)
        });
    };

    const handleApplyPresetDates = (presetKey) => {
        const now = new Date();
        let start = new Date(now);
        let end = new Date(now);

        if (presetKey === 'weekend') {
            const dayOfWeek = now.getDay();
            const daysUntilSat = (6 - dayOfWeek + 7) % 7 || 7;
            start.setDate(now.getDate() + (dayOfWeek === 6 ? 0 : daysUntilSat));
            start.setHours(9, 0, 0, 0);

            end = new Date(start);
            end.setDate(start.getDate() + 1);
            end.setHours(18, 0, 0, 0);
        } else if (presetKey === 'tomorrow-2d') {
            start.setDate(now.getDate() + 1);
            start.setHours(9, 0, 0, 0);

            end = new Date(start);
            end.setDate(start.getDate() + 2);
            end.setHours(9, 0, 0, 0);
        } else if (presetKey === 'next-3d') {
            start.setDate(now.getDate() + 1);
            start.setHours(9, 0, 0, 0);

            end = new Date(start);
            end.setDate(start.getDate() + 3);
            end.setHours(9, 0, 0, 0);
        } else if (presetKey === 'week-7d') {
            start.setDate(now.getDate() + 1);
            start.setHours(9, 0, 0, 0);

            end = new Date(start);
            end.setDate(start.getDate() + 7);
            end.setHours(9, 0, 0, 0);
        }

        const startStr = formatDatetimeLocal(start);
        const endStr = formatDatetimeLocal(end);
        setSelectedStartDate(startStr);
        setSelectedEndDate(endStr);

        if (setBookingData) {
            try {
                setBookingData('start_datetime', startStr);
                setBookingData('end_datetime', endStr);
            } catch {
                // ignore
            }
        }

        const days = calculateRentalDays(startStr, endStr);
        const total = matchedVehicle ? days * parseFloat(matchedVehicle.price_per_day) : null;

        pushBotMessage(
            `📅 **Dates Applied to Reservation:**\n\n• **Pickup:** \`${startStr.replace('T', ' ')}\`\n• **Return:** \`${endStr.replace('T', ' ')}\`\n• **Duration:** ${days} day${days > 1 ? 's' : ''}${total ? `\n• **Estimated Total (${matchedVehicle.name}):** ${formatPHP(total)}` : ''}`,
            ['Next: Driver\'s License 🪪', 'Browse All Fleet 🚗', 'Agree to Terms ✅'],
            { dates: { startDatetime: startStr, endDatetime: endStr, daysCount: days, estimatedTotal: total }, vehicle: matchedVehicle }
        );

        botSpeak(`Dates set for ${days} days.${total ? ` Estimated total for the ${matchedVehicle.name} is ${formatPHP(total)}.` : ''}`);
    };

    const recognizerRef = useRef(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Check browser compatibility on mount
    useEffect(() => {
        setSpeechSupported(isSpeechRecognitionSupported());
        setTtsSupported(isSpeechSynthesisSupported());
    }, []);

    // Scroll chat to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, interimText, matchedVehicle, guideMode]);

    // Handle initial open & query params
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const voiceGuideParam = params.get('voice_guide');
            const selectVehicleParam = params.get('select_vehicle');
            if (voiceGuideParam || selectVehicleParam) {
                setIsOpen(true);
                if (selectVehicleParam) {
                    const found = vehicles.find(v => v.id.toString() === selectVehicleParam.toString());
                    if (found) {
                        setMatchedVehicle(found);
                        setGuideMode(true);
                    }
                }
            }
        }

        const handleCustomOpen = (event) => {
            setIsOpen(true);
            if (event.detail?.triggerMic) {
                setTimeout(() => {
                    toggleListening();
                }, 300);
            }
            if (event.detail?.vehicle) {
                handleVehicleBookingFound(event.detail.vehicle);
            }
        };

        window.addEventListener('elfaa:open-voice-assistant', handleCustomOpen);
        return () => window.removeEventListener('elfaa:open-voice-assistant', handleCustomOpen);
    }, [vehicles]);

    // Greet user on first open
    useEffect(() => {
        if (isOpen && !hasGreeted) {
            setHasGreeted(true);
            const isAuthPage = typeof window !== 'undefined' && (window.location.pathname.includes('/login') || window.location.pathname.includes('/register'));

            const dynamicCarChips = vehicles.length > 0
                ? vehicles.slice(0, 3).map(v => `Book ${v.name.split(' 20')[0]} 🚗`)
                : ['Book a Car 🚗'];
            const firstCarName = vehicles[0]?.name?.split(' 20')[0] || 'a car';
            const secondCarName = vehicles[1]?.name?.split(' 20')[0] || 'Innova';

            let welcomeText = '';
            let chips = [...dynamicCarChips, '📅 Select Dates', 'Browse All Fleet 🚗', 'Show 3 Requirements 📄'];

            if (auth?.user) {
                welcomeText = `Hello ${auth.user.name.split(' ')[0]}! 👋 I'm your AI Voice Booking Assistant. You can speak commands like "Book ${firstCarName}", "Rent ${secondCarName} from tomorrow to Sunday", or click the microphone to begin.`;
            } else if (isAuthPage) {
                if (matchedVehicle) {
                    welcomeText = `Welcome! 👋 An ELFAA customer account is required to verify your driver's license and reserve the ${matchedVehicle.name}. Please sign in or register above to finalize your booking.`;
                    chips = ['📅 Select Dates', 'Show 3 Requirements 📄', 'View Car Specs 🔍', 'Browse All Fleet 🚗'];
                } else {
                    welcomeText = `Welcome to ELFAA Car Rental! 👋 A customer account is needed to reserve vehicles. Please log in or create an account, or speak a command like "Book ${firstCarName}" anytime.`;
                    chips = [...dynamicCarChips, '📅 Select Dates', 'Browse All Fleet 🚗', 'Show 3 Requirements 📄'];
                }
            } else {
                welcomeText = `Hello! 👋 Welcome to ELFAA Car Rental. I'm your AI Voice Booking Assistant. Say "Book ${firstCarName}", "Rent ${secondCarName} this weekend", or tap the microphone to reserve your ride.`;
            }

            pushBotMessage(welcomeText, chips);

            if (!isMuted) {
                speakText(welcomeText, {
                    onStart: () => setIsSpeaking(true),
                    onEnd: () => setIsSpeaking(false)
                });
            }
        }
    }, [isOpen, hasGreeted, auth, isMuted, matchedVehicle]);

    // Document Verification helpers
    const getDocStatus = (type) => {
        let doc = documents.find(d => d.type === type);
        if (type === 'proof_of_billing' && !doc) {
            doc = documents.find(d => d.type?.startsWith('proof_of_billing'));
        }
        if (!doc) return { status: 'missing', label: 'Missing / Required', badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
        if (doc.status === 'verified') return { status: 'verified', label: 'Verified & Approved', badge: 'bg-green-500/10 text-green-500 border-green-500/20' };
        if (doc.status === 'rejected') return { status: 'rejected', label: 'Rejected (Re-upload needed)', badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
        return { status: 'pending', label: 'Pending Admin Review', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    };

    const govId1 = getDocStatus('gov_id_1');
    const govId2 = getDocStatus('gov_id_2');
    const billingProof = getDocStatus('proof_of_billing');

    // ─────────────────────────────────────────────────────────────
    // Voice Guidance Steps Definitions
    // ─────────────────────────────────────────────────────────────
    const getGuidanceStepDetails = (step) => {
        switch (step) {
            case 1:
                return {
                    number: 1,
                    title: "Driver's License (Gov ID 1)",
                    subtitle: "Primary driver verification required by Philippine traffic law",
                    icon: ShieldCheck,
                    status: govId1,
                    voiceText: govId1.status === 'verified'
                        ? "Requirement 1 of 3: Your Driver's License is verified and approved. You are good to go on this step!"
                        : govId1.status === 'pending'
                        ? "Requirement 1 of 3: Your Driver's License is uploaded and currently under review by our admin team."
                        : "Requirement 1 of 3: Valid Driver's License. ELFAA requires a clear photo or PDF scan of your official driver's license before your car is released. You can upload it in your Identity Hub.",
                    instructions: "Upload a clear photo or PDF scan of your physical or digital Philippine Driver's License.",
                };
            case 2:
                return {
                    number: 2,
                    title: "Secondary Official Photo ID",
                    subtitle: "Passport, UMID, Postal ID, SSS, PhilHealth, or National ID",
                    icon: FileText,
                    status: govId2,
                    voiceText: govId2.status === 'verified'
                        ? "Requirement 2 of 3: Your Secondary Photo ID is verified and approved."
                        : govId2.status === 'pending'
                        ? "Requirement 2 of 3: Your Secondary Government ID is uploaded and awaiting confirmation."
                        : "Requirement 2 of 3: Secondary Government ID. We require a second official photo ID such as your Passport, UMID, Postal ID, PhilHealth, or Philippine National ID.",
                    instructions: "Ensure your full name matches your driver's license exactly for instant approval.",
                };
            case 3:
                return {
                    number: 3,
                    title: "Proof of Residential Billing",
                    subtitle: "Meralco electric, water utility, internet bill, or bank statement",
                    icon: Receipt,
                    status: billingProof,
                    voiceText: billingProof.status === 'verified'
                        ? "Requirement 3 of 3: Your Proof of Billing is verified and approved."
                        : billingProof.status === 'pending'
                        ? "Requirement 3 of 3: Your Proof of Billing has been submitted and is pending verification."
                        : "Requirement 3 of 3: Proof of Billing. Please provide a recent utility statement such as electricity, water, fiber internet bill, or barangay certificate matching your residential address.",
                    instructions: "Recent statement (within 3 months) showing your current home address.",
                };
            case 4:
                return {
                    number: 4,
                    title: "Reservation & Terms Agreement",
                    subtitle: "Schedule pickup, dropoff, payment method, and confirm agreement",
                    icon: Sparkles,
                    status: { status: 'final', label: 'Ready to finalize', badge: 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/30' },
                    voiceText: "Final Step! Please choose your pickup and return dates, select your preferred meetup hub, review the ELFAA Rental Agreement terms, and click Submit Booking.",
                    instructions: "Set your trip dates and agree to the rental terms to place your reservation request.",
                };
            default:
                return null;
        }
    };

    // ─────────────────────────────────────────────────────────────
    // Guide Step Voice Narrator
    // ─────────────────────────────────────────────────────────────
    const narrateGuideStep = (step) => {
        setActiveGuideStep(step);
        setGuideMode(true);
        const details = getGuidanceStepDetails(step);
        if (!details) return;

        pushBotMessage(
            `📋 **Step ${details.number} of 4: ${details.title}**\n\n${details.instructions}\n\n*Status: ${details.status.label}*`,
            step < 4 ? [`Next Step (${step + 1}) ➡️`, 'Repeat Audio 🔊', 'Book a Vehicle 🚗'] : ['Agree to Terms ✅', 'Submit Booking 🚀', 'Repeat Audio 🔊']
        );

        botSpeak(details.voiceText);
    };

    // ─────────────────────────────────────────────────────────────
    // Handle Vehicle Booking Match & Redirection (Supports dynamic cars & dates)
    // ─────────────────────────────────────────────────────────────
    const handleVehicleBookingFound = (vehicle, parsedDates = null) => {
        setMatchedVehicle(vehicle);
        setGuideMode(true);
        setActiveGuideStep(1);

        // Apply dates to booking form if parsed
        if (parsedDates && setBookingData) {
            setSelectedStartDate(parsedDates.startDatetime);
            setSelectedEndDate(parsedDates.endDatetime);
            try {
                setBookingData('start_datetime', parsedDates.startDatetime);
                setBookingData('end_datetime', parsedDates.endDatetime);
            } catch {
                // ignore
            }
        }

        const dateSentence = parsedDates 
            ? ` I have set your dates: ${parsedDates.spoken}.`
            : '';

        const days = parsedDates?.daysCount || calculateRentalDays(selectedStartDate, selectedEndDate) || 1;
        const estimatedTotal = days * parseFloat(vehicle.price_per_day);

        const announcement = `Great choice! I found the ${vehicle.name} at ${formatPHP(vehicle.price_per_day)} per day (${vehicle.transmission}, ${vehicle.seats} seats).${dateSentence}`;
        
        // If on Client Dashboard and handler is present
        if (onSelectVehicle) {
            onSelectVehicle(vehicle);
            const fullReply = `${announcement}\n\nI have prefilled **${vehicle.name}**${parsedDates ? ` from \`${parsedDates.startDatetime.replace('T', ' ')}\` to \`${parsedDates.endDatetime.replace('T', ' ')}\` (${days} days · Est. ${formatPHP(estimatedTotal)})` : ''} in your booking form.\n\nNow, let's review the **3 booking requirements** step-by-step to complete your reservation.`;
            pushBotMessage(fullReply, ['📅 Select Dates', 'Start Step 1: Driver\'s License 🪪', 'Browse All Fleet 🚗', 'View Car Specs 🔍'], { 
                vehicle, 
                dates: parsedDates ? { ...parsedDates, estimatedTotal } : null 
            });
            botSpeak(`${announcement} I have prefilled your booking form. Let's review the three booking requirements.`);
        } else {
            const isAuthPage = typeof window !== 'undefined' && (window.location.pathname.includes('/login') || window.location.pathname.includes('/register'));

            if (auth?.user) {
                const fullReply = `${announcement}\n\nRedirecting you to the Renter Workspace to finalize your reservation with prefilled details.`;
                pushBotMessage(fullReply, ['Go to Booking Form 🚗'], { vehicle, dates: parsedDates });
                botSpeak(`${announcement} Taking you to the booking form now.`);
                setTimeout(() => {
                    window.location.href = `/client/dashboard?tab=dashboard&select_vehicle=${vehicle.id}&voice_guide=1`;
                }, 1800);
            } else if (isAuthPage) {
                const fullReply = `${announcement}\n\n🔐 **Customer Account Required**:\nPlease sign in or register above to reserve the **${vehicle.name}**. Once logged in, your car will be prefilled automatically and I will guide you through the 3 rental requirements!`;
                pushBotMessage(fullReply, ['Show 3 Requirements 📄', 'Browse All Fleet 🚗', 'Contact Support 📍'], { vehicle, dates: parsedDates });
                botSpeak(`${announcement} An ELFAA customer account is required. Please log in with your email and password above to complete your booking.`);

                // Update URL search params so the login form carries the chosen vehicle & redirect
                if (typeof window !== 'undefined' && window.history?.replaceState) {
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.set('select_vehicle', vehicle.id);
                    newUrl.searchParams.set('redirect', `/client/dashboard?tab=dashboard&select_vehicle=${vehicle.id}&voice_guide=1`);
                    window.history.replaceState(null, '', newUrl.toString());
                }
            } else {
                const fullReply = `${announcement}\n\nTo reserve the **${vehicle.name}**, please log in or create a customer account.`;
                pushBotMessage(fullReply, ['Login to Book 🔐', 'Create Account 📝'], { vehicle, requiresAuth: true, dates: parsedDates });
                botSpeak(`${announcement} To reserve this car, please log in or sign up. Opening the login page.`);
                setTimeout(() => {
                    window.location.href = `/login?redirect=/client/dashboard?tab=dashboard&select_vehicle=${vehicle.id}&voice_guide=1&select_vehicle=${vehicle.id}`;
                }, 2200);
            }
        }
    };

    // ─────────────────────────────────────────────────────────────
    // Core Command Processor (Voice or Text)
    // ─────────────────────────────────────────────────────────────
    const processCommand = (userInput) => {
        const text = userInput.trim();
        if (!text) return;

        pushUserMessage(text);
        setInputText('');
        setInterimText('');

        const command = interpretVoiceCommand(text, {
            vehicles,
            documents,
            activeStep: activeGuideStep
        });

        // 1. Book vehicle with dates in one command
        if (command.type === 'BOOK_WITH_DATES') {
            handleVehicleBookingFound(command.vehicle, command.dates);
            return;
        }

        // 2. Book vehicle only
        if (command.type === 'BOOK_VEHICLE') {
            handleVehicleBookingFound(command.vehicle, null);
            return;
        }

        // 3. User provides dates only
        if (command.type === 'SET_DATES') {
            const dates = command.dates;
            setSelectedStartDate(dates.startDatetime);
            setSelectedEndDate(dates.endDatetime);
            if (setBookingData) {
                try {
                    setBookingData('start_datetime', dates.startDatetime);
                    setBookingData('end_datetime', dates.endDatetime);
                } catch {
                    // ignore
                }
            }

            if (matchedVehicle) {
                const days = dates.daysCount;
                const estimatedTotal = days * parseFloat(matchedVehicle.price_per_day);
                const reply = `📅 **Rental Dates Updated:**\n\n• **Pickup:** \`${dates.startDatetime.replace('T', ' ')}\`\n• **Return:** \`${dates.endDatetime.replace('T', ' ')}\`\n• **Duration:** ${days} day${days > 1 ? 's' : ''}\n• **Estimated Cost (${matchedVehicle.name}):** ${formatPHP(estimatedTotal)}\n\nDates have been applied to your booking form!`;
                pushBotMessage(reply, ['Next Step: Driver\'s License 🪪', 'Change Vehicle 🚗', 'Agree to Terms ✅'], { dates: { ...dates, estimatedTotal }, vehicle: matchedVehicle });
                botSpeak(`Dates set for ${dates.spoken}. Estimated rental cost for the ${matchedVehicle.name} is ${formatPHP(estimatedTotal)}.`);
            } else {
                const reply = `📅 **Dates Selected:** ${dates.spoken} (${dates.daysCount} days).\n\nNow, which vehicle from our fleet would you like to reserve? Choose below or speak its name:`;
                const carChips = vehicles.slice(0, 4).map(v => `Book ${v.name.split(' 20')[0]} 🚗`);
                pushBotMessage(reply, [...carChips, 'Browse All Fleet 🚗'], { dates, showAllVehicles: true });
                botSpeak(`Dates set for ${dates.spoken}. Which car from our fleet would you like to reserve?`);
            }
            return;
        }

        // 4. Request to list all database fleet
        if (command.type === 'LIST_ALL_VEHICLES') {
            const lines = vehicles.map(v => `• **${v.name}** (${v.type}) — ${formatPHP(v.price_per_day)}/day | ${v.transmission} | ${v.seats} seats`);
            const reply = `🚗 **Our Complete Fleet (${vehicles.length} Vehicles in Database):**\n\n${lines.join('\n')}\n\nSpeak any vehicle name (e.g. *"Book ${vehicles[0]?.name?.split(' 20')[0] || 'Vios'}"* or *"Rent ${vehicles[1]?.name?.split(' 20')[0] || 'Innova'}"*) or tap a card below to select:`;
            
            const carChips = vehicles.slice(0, 4).map(v => `Book ${v.name.split(' 20')[0]} 🚗`);
            pushBotMessage(reply, [...carChips, '📅 Set Dates', 'Show 3 Requirements 📄'], { showAllVehicles: true });
            botSpeak(`We have ${vehicles.length} vehicles available in our fleet: ${vehicles.slice(0, 3).map(v => v.name).join(', ')}, and more. Which car would you like to book?`);
            return;
        }

        if (command.type === 'STOP_SPEECH') {
            stopSpeaking();
            setIsSpeaking(false);
            pushBotMessage("Voice speech stopped. How else may I assist you?");
            return;
        }

        if (command.type === 'NAVIGATE_STEP') {
            narrateGuideStep(command.step);
            return;
        }

        if (command.type === 'REPEAT_STEP') {
            narrateGuideStep(activeGuideStep);
            return;
        }

        if (command.type === 'CHECK_DOCUMENTS') {
            const summary = `📄 **Document Verification Status:**\n\n• **Driver's License:** ${govId1.label}\n• **Secondary Photo ID:** ${govId2.label}\n• **Proof of Billing:** ${billingProof.label}\n\n${govId1.status === 'verified' && govId2.status === 'verified' && billingProof.status === 'verified' ? '🎉 All documents verified! You are fully authorized to rent.' : 'Please ensure all three documents are uploaded for quick rental confirmation.'}`;
            pushBotMessage(summary, ['Review Requirement 1 🪪', 'Browse All Fleet 🚗', 'Contact Support 📍']);
            botSpeak(`Your Driver's License is ${govId1.status}. Your Secondary ID is ${govId2.status}. Your Proof of Billing is ${billingProof.status}.`);
            return;
        }

        if (command.type === 'AGREE_TERMS') {
            if (setBookingData) {
                setBookingData('terms_agreed', true);
            }
            pushBotMessage("✅ **Rental terms accepted!** You can now proceed to submit your reservation.", ['Submit Booking 🚀', 'Browse All Fleet 🚗']);
            botSpeak("Terms and conditions agreed. Ready to submit your booking.");
            return;
        }

        if (command.type === 'SUBMIT_BOOKING') {
            if (triggerSubmitBooking) {
                triggerSubmitBooking();
                pushBotMessage("🚀 **Submitting your reservation request now...**");
                botSpeak("Submitting your reservation request now.");
            } else {
                const el = document.getElementById('booking-request-form');
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                    pushBotMessage("Please ensure dates and pickup location are filled, then tap Submit Booking on the form.");
                    botSpeak("Please check your dates and tap the submit button to complete your reservation.");
                } else {
                    pushBotMessage("Please navigate to the Reservation Hub to submit your booking.");
                    botSpeak("Please open the Reservation Hub to complete your booking.");
                }
            }
            return;
        }

        // Conversational Fallbacks
        const q = text.toLowerCase();
        if (/dates?|schedule|calendar|when can i|pickup date/.test(q)) {
            pushBotMessage(
                "📅 **Select Your Rental Dates:**\n\nYou can speak commands like:\n• *\"From tomorrow to Sunday\"*\n• *\"This weekend\"*\n• *\"For 3 days starting tomorrow\"*\n\nOr use the interactive date selector below:",
                ['📅 This Weekend', '📅 Tomorrow (2 Days)', '📅 Next 3 Days', '📅 1 Week'],
                { showDateSelector: true }
            );
            botSpeak("Please select your rental dates. You can say: this weekend, from tomorrow to Sunday, or pick your dates on screen.");
            return;
        }

        if (/requirements|what do i need|documents|requirements 1 2 3|step by step/.test(q)) {
            narrateGuideStep(1);
            return;
        }

        if (/rate|price|how much|cost|cheapest/.test(q)) {
            const sorted = [...vehicles].sort((a, b) => parseFloat(a.price_per_day) - parseFloat(b.price_per_day));
            const cheapest = sorted[0];
            const lines = sorted.slice(0, 5).map(v => `• **${v.name}** — ${formatPHP(v.price_per_day)}/day (${v.transmission})`);
            const reply = `💰 **ELFAA Vehicle Rates:**\n\n${lines.join('\n')}\n\nOur most affordable car is the **${cheapest?.name}** at **${formatPHP(cheapest?.price_per_day)}/day**. Speak or type *"Book me a ${cheapest?.name?.split(' 20')[0]}"* to reserve it!`;
            pushBotMessage(reply, [`Book ${cheapest?.name?.split(' 20')[0]} 🚗`, 'Browse All Fleet 🚗', '📅 Set Dates']);
            botSpeak(`Our rates start from ${formatPHP(cheapest?.price_per_day)} per day for the ${cheapest?.name}. Would you like to book it?`);
            return;
        }

        if (/promo|discount|voucher|deal/.test(q)) {
            const activePromos = promos.filter(p => p.status === 'active');
            if (activePromos.length === 0) {
                pushBotMessage("There are no active promos today, but our daily rates are always budget-friendly!", ['Browse All Fleet 🚗', '📅 Set Dates']);
                botSpeak("No active promos right now, but our daily rates are very competitive.");
            } else {
                const lines = activePromos.map(p => `• **${p.title}** — ${p.discount_text} (Code: \`${p.promo_code}\`)`);
                pushBotMessage(`🎉 **Active Promos:**\n\n${lines.join('\n')}\n\nEnter the promo code at checkout!`, ['Browse All Fleet 🚗', '📅 Set Dates']);
                botSpeak("We have active promos available! Check the promo codes on your screen.");
            }
            return;
        }

        // Generic intelligent fallback
        const match = findBestVehicleMatch(text, vehicles);
        if (match && match.vehicle) {
            handleVehicleBookingFound(match.vehicle, null);
            return;
        }

        const fallback = `I can help you find and reserve any vehicle in our fleet, set rental dates, or guide you through the 3 rental requirements. Try saying:\n\n• **"Book ${vehicles[0]?.name || 'a car'}"**\n• **"Book ${vehicles[1]?.name || 'a vehicle'} from tomorrow to Sunday"**\n• **"Show all available cars"**\n• **"Set dates for this weekend"**`;
        const carChips = vehicles.slice(0, 3).map(v => `Book ${v.name.split(' 20')[0]} 🚗`);
        pushBotMessage(fallback, [...carChips, 'Browse All Fleet 🚗', '📅 Set Dates', 'Show 3 Requirements 📄']);
        botSpeak("I can help you book any car in our fleet or select your dates. Ask to see our available cars or speak your preferred vehicle.");
    };

    // ─────────────────────────────────────────────────────────────
    // Speech Recognition Toggle
    // ─────────────────────────────────────────────────────────────
    const toggleListening = () => {
        if (!speechSupported) {
            pushBotMessage("⚠️ Speech recognition is not supported in this browser. Please use the text input below — it works just as fast!");
            return;
        }

        if (isListening) {
            if (recognizerRef.current) {
                recognizerRef.current.abort();
            }
            setIsListening(false);
            setInterimText('');
        } else {
            stopSpeaking();
            setIsSpeaking(false);
            setInterimText('');

            const recognizer = createSpeechRecognizer({
                onStart: () => setIsListening(true),
                onInterim: (text) => setInterimText(text),
                onResult: (finalText) => {
                    setIsListening(false);
                    setInterimText('');
                    processCommand(finalText);
                },
                onError: (err) => {
                    setIsListening(false);
                    setInterimText('');
                    if (err.error === 'not-allowed') {
                        pushBotMessage("⚠️ Microphone permission was denied. Please allow microphone access in your browser address bar to use voice commands, or simply type your message below.");
                    }
                },
                onEnd: () => {
                    setIsListening(false);
                    setInterimText('');
                }
            });

            recognizerRef.current = recognizer;
            try {
                recognizer.start();
            } catch {
                setIsListening(false);
            }
        }
    };

    const handleTextInputSubmit = (e) => {
        e?.preventDefault();
        if (!inputText.trim()) return;
        processCommand(inputText);
    };

    const currentStepDetails = getGuidanceStepDetails(activeGuideStep);

    return (
        <>
            {/* ── FLOATING VOICE ASSISTANT LAUNCHER ── */}
            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
                {/* Voice Callout Bubble when closed */}
                {!isOpen && (
                    <div 
                        onClick={() => setIsOpen(true)}
                        className="hidden sm:flex items-center gap-2.5 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-2xl cursor-pointer hover:border-[#FF3B30] transition-all group animate-bounce"
                        style={{ animationDuration: '3s' }}
                    >
                        <span className="w-2 h-2 rounded-full bg-[#FF3B30] animate-ping" />
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-[#FF3B30] transition-colors">
                            Say <span className="text-[#FF3B30] font-black">"Book {vehicles[0]?.name?.split(' 20')[0] || 'a car'}"</span> or <span className="text-[#FF3B30] font-black">"Set dates"</span> 🎙️
                        </span>
                    </div>
                )}

                <button
                    onClick={() => {
                        const nextState = !isOpen;
                        setIsOpen(nextState);
                        if (!nextState) {
                            stopSpeaking();
                            if (recognizerRef.current) recognizerRef.current.abort();
                            setIsListening(false);
                        }
                    }}
                    aria-label="Toggle AI Voice Booking Assistant"
                    className={`relative w-14 h-14 rounded-full flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95 shadow-2xl cursor-pointer ${
                        isOpen 
                            ? 'bg-zinc-800 hover:bg-zinc-700 text-white' 
                            : 'bg-[#FF3B30] hover:bg-red-700 shadow-[#FF3B30]/40'
                    }`}
                >
                    {isOpen ? (
                        <X className="w-6 h-6" />
                    ) : (
                        <>
                            <Mic className="w-6 h-6" />
                            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white dark:border-zinc-900" />
                        </>
                    )}
                </button>
            </div>

            {/* ── EXPANDED VOICE ASSISTANT WINDOW ── */}
            {isOpen && (
                <div 
                    className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[440px] max-h-[85vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200"
                    style={{ height: '620px' }}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#FF3B30] via-red-600 to-[#FF3B30] p-4 flex items-center justify-between text-white shrink-0 shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center shrink-0 border border-white/30">
                                <Bot className="w-5 h-5 text-white" />
                                {isListening && (
                                    <span className="absolute -inset-1 rounded-full border-2 border-white animate-ping opacity-75" />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-black text-sm tracking-wide">ELFAA AI Voice Assistant</h3>
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-white/25 text-white">
                                        Free Web Speech
                                    </span>
                                </div>
                                <div className="text-[11px] text-red-100 flex items-center gap-1.5 mt-0.5">
                                    <span className={`w-2 h-2 rounded-full ${
                                        isListening ? 'bg-amber-300 animate-pulse' : isSpeaking ? 'bg-green-300 animate-pulse' : 'bg-green-400'
                                    }`} />
                                    <span>
                                        {isListening ? 'Listening to speech...' : isSpeaking ? 'Speaking response...' : 'Ready for voice or text'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Audio Controls */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => {
                                    if (isSpeaking) stopSpeaking();
                                    setIsMuted(!isMuted);
                                }}
                                title={isMuted ? 'Unmute voice responses' : 'Mute voice responses'}
                                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                            >
                                {isMuted ? <VolumeX className="w-4 h-4 text-red-200" /> : <Volume2 className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Step-by-Step 3 Requirements Mode Toggle Banner */}
                    <div className="bg-zinc-100 dark:bg-zinc-950/80 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                                Step Guidance:
                            </span>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4].map((stepNum) => (
                                    <button
                                        key={stepNum}
                                        onClick={() => narrateGuideStep(stepNum)}
                                        className={`w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center transition-all ${
                                            activeGuideStep === stepNum && guideMode
                                                ? 'bg-[#FF3B30] text-white shadow-sm ring-2 ring-[#FF3B30]/30'
                                                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300'
                                        }`}
                                    >
                                        {stepNum}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setGuideMode(!guideMode);
                                if (!guideMode) narrateGuideStep(1);
                            }}
                            className="text-[11px] font-black text-[#FF3B30] hover:underline flex items-center gap-1"
                        >
                            <span>{guideMode ? 'Hide Stepper' : 'Open 3 Requirements'}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* STEPPER WIDGET (when guideMode is active) */}
                    {guideMode && currentStepDetails && (
                        <div className="p-3 bg-red-500/5 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-[#FF3B30]/15 text-[#FF3B30] flex items-center justify-center shrink-0">
                                        <currentStepDetails.icon className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-black text-zinc-900 dark:text-white">
                                                Step {currentStepDetails.number}: {currentStepDetails.title}
                                            </span>
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border uppercase ${currentStepDetails.status.badge}`}>
                                                {currentStepDetails.status.label}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                                            {currentStepDetails.instructions}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 text-xs">
                                <button
                                    onClick={() => narrateGuideStep(Math.max(1, activeGuideStep - 1))}
                                    disabled={activeGuideStep <= 1}
                                    className="px-2.5 py-1 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold disabled:opacity-30 text-[11px] flex items-center gap-1"
                                >
                                    <ChevronLeft className="w-3 h-3" /> Previous
                                </button>
                                <button
                                    onClick={() => botSpeak(currentStepDetails.voiceText)}
                                    className="px-2.5 py-1 rounded bg-[#FF3B30]/10 text-[#FF3B30] font-black text-[11px] flex items-center gap-1 hover:bg-[#FF3B30]/20"
                                >
                                    <Volume2 className="w-3 h-3" /> Read Aloud
                                </button>
                                <button
                                    onClick={() => narrateGuideStep(Math.min(4, activeGuideStep + 1))}
                                    disabled={activeGuideStep >= 4}
                                    className="px-2.5 py-1 rounded bg-[#FF3B30] text-white font-black disabled:opacity-30 text-[11px] flex items-center gap-1"
                                >
                                    Next <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-zinc-50 dark:bg-zinc-950/60">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'bot' && (
                                    <div className="w-7 h-7 rounded-full bg-[#FF3B30] text-white text-[10px] font-black flex items-center justify-center mr-2 mt-1 shrink-0">
                                        AI
                                    </div>
                                )}
                                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed shadow-sm text-left ${
                                    msg.role === 'user'
                                        ? 'bg-[#FF3B30] text-white rounded-tr-sm'
                                        : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-tl-sm border border-zinc-200 dark:border-zinc-700'
                                }`}>
                                    <div className="whitespace-pre-wrap">
                                        {msg.text.split(/(\*\*[^*]+\*\*|`[^`]+`|\n)/g).map((chunk, i) => {
                                            if (chunk.startsWith('**') && chunk.endsWith('**')) {
                                                return <strong key={i} className="font-extrabold">{chunk.slice(2, -2)}</strong>;
                                            }
                                            if (chunk.startsWith('`') && chunk.endsWith('`')) {
                                                return <code key={i} className="bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded font-mono text-[11px] text-[#FF3B30]">{chunk.slice(1, -1)}</code>;
                                            }
                                            if (chunk === '\n') return <br key={i} />;
                                            return <span key={i}>{chunk}</span>;
                                        })}
                                    </div>

                                    {/* Embedded Vehicle Card if matched */}
                                    {msg.extra?.vehicle && (
                                        <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-900/90 rounded-xl border border-zinc-200 dark:border-zinc-700 flex flex-col gap-2">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={msg.extra.vehicle.images?.[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=300'}
                                                    alt={msg.extra.vehicle.name}
                                                    className="w-16 h-12 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-xs font-black text-zinc-900 dark:text-white truncate">
                                                        {msg.extra.vehicle.name}
                                                    </h4>
                                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                                        {msg.extra.vehicle.type} · {msg.extra.vehicle.transmission} · {msg.extra.vehicle.seats} seats
                                                    </p>
                                                    <span className="text-xs font-black text-[#FF3B30]">
                                                        {formatPHP(msg.extra.vehicle.price_per_day)}/day
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 pt-1">
                                                <button
                                                    onClick={() => {
                                                        if (onSelectVehicle) {
                                                            onSelectVehicle(msg.extra.vehicle);
                                                            narrateGuideStep(1);
                                                        } else {
                                                            window.location.href = `/client/dashboard?tab=dashboard&select_vehicle=${msg.extra.vehicle.id}&voice_guide=1`;
                                                        }
                                                    }}
                                                    className="flex-1 h-8 bg-[#FF3B30] hover:bg-red-700 text-white rounded-lg font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                                                >
                                                    <Zap className="w-3.5 h-3.5" /> Book This Selection
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Embedded Dates Breakdown Card */}
                                    {msg.extra?.dates && (
                                        <div className="mt-2.5 p-3 rounded-xl bg-red-500/10 border border-[#FF3B30]/30 space-y-1.5 text-left">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase text-[#FF3B30] flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" /> Selected Rental Schedule
                                                </span>
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-[#FF3B30] text-white">
                                                    {msg.extra.dates.daysCount} Day{msg.extra.dates.daysCount > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-zinc-700 dark:text-zinc-300 font-mono space-y-0.5">
                                                <div><strong>Pickup:</strong> {msg.extra.dates.startDatetime?.replace('T', ' ')}</div>
                                                <div><strong>Return:</strong> {msg.extra.dates.endDatetime?.replace('T', ' ')}</div>
                                            </div>
                                            {msg.extra.dates.estimatedTotal && (
                                                <div className="pt-1.5 border-t border-[#FF3B30]/20 flex items-center justify-between text-xs">
                                                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Estimated Total:</span>
                                                    <span className="font-black text-[#FF3B30]">{formatPHP(msg.extra.dates.estimatedTotal)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Embedded Interactive Date Selector Card */}
                                    {msg.extra?.showDateSelector && (
                                        <div className="mt-3 p-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-3 text-left shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-[#FF3B30]" />
                                                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                                    Select Rental Dates
                                                </h4>
                                            </div>

                                            {/* Quick preset chips */}
                                            <div className="grid grid-cols-2 gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleApplyPresetDates('tomorrow-2d')}
                                                    className="px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-[#FF3B30] text-[10px] font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 text-left transition-colors cursor-pointer"
                                                >
                                                    📅 Tomorrow (2 Days)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleApplyPresetDates('weekend')}
                                                    className="px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-[#FF3B30] text-[10px] font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 text-left transition-colors cursor-pointer"
                                                >
                                                    📅 This Weekend
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleApplyPresetDates('next-3d')}
                                                    className="px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-[#FF3B30] text-[10px] font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 text-left transition-colors cursor-pointer"
                                                >
                                                    📅 Next 3 Days
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleApplyPresetDates('week-7d')}
                                                    className="px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-[#FF3B30] text-[10px] font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 text-left transition-colors cursor-pointer"
                                                >
                                                    📅 1 Week (7 Days)
                                                </button>
                                            </div>

                                            {/* Date inputs */}
                                            <div className="space-y-2 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                                                <div>
                                                    <label className="block text-[9px] font-black uppercase text-zinc-500 mb-1">Pickup Date & Time</label>
                                                    <input
                                                        type="datetime-local"
                                                        value={selectedStartDate}
                                                        onChange={(e) => setSelectedStartDate(e.target.value)}
                                                        className="w-full h-8 px-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[9px] font-black uppercase text-zinc-500 mb-1">Return Date & Time</label>
                                                    <input
                                                        type="datetime-local"
                                                        value={selectedEndDate}
                                                        onChange={(e) => setSelectedEndDate(e.target.value)}
                                                        className="w-full h-8 px-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (selectedStartDate && selectedEndDate) {
                                                        const days = calculateRentalDays(selectedStartDate, selectedEndDate);
                                                        if (setBookingData) {
                                                            try {
                                                                setBookingData('start_datetime', selectedStartDate);
                                                                setBookingData('end_datetime', selectedEndDate);
                                                            } catch {
                                                                // ignore
                                                            }
                                                        }
                                                        const total = matchedVehicle ? days * parseFloat(matchedVehicle.price_per_day) : null;
                                                        pushBotMessage(
                                                            `📅 **Dates Applied:**\n\n• **Pickup:** \`${selectedStartDate.replace('T', ' ')}\`\n• **Return:** \`${selectedEndDate.replace('T', ' ')}\`\n• **Duration:** ${days} day${days > 1 ? 's' : ''}${total ? `\n• **Estimated Total (${matchedVehicle.name}):** ${formatPHP(total)}` : ''}`,
                                                            ['Next: Driver\'s License 🪪', 'Browse All Fleet 🚗', 'Agree to Terms ✅'],
                                                            { dates: { startDatetime: selectedStartDate, endDatetime: selectedEndDate, daysCount: days, estimatedTotal: total }, vehicle: matchedVehicle }
                                                        );
                                                        botSpeak(`Applied custom dates for ${days} days.`);
                                                    }
                                                }}
                                                disabled={!selectedStartDate || !selectedEndDate}
                                                className="w-full h-8 rounded-lg bg-[#FF3B30] hover:bg-red-700 disabled:opacity-40 text-white font-black text-[11px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Apply Dates to Booking
                                            </button>
                                        </div>
                                    )}

                                    {/* Embedded All Database Fleet List */}
                                    {msg.extra?.showAllVehicles && (
                                        <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                                            {vehicles.map((v) => (
                                                <div
                                                    key={v.id}
                                                    className="p-2.5 bg-zinc-50 dark:bg-zinc-900/90 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-3 text-left hover:border-[#FF3B30]/40 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <img
                                                            src={v.images?.[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=200'}
                                                            alt={v.name}
                                                            className="w-12 h-10 rounded-lg object-cover border border-zinc-200 dark:border-zinc-800 shrink-0"
                                                        />
                                                        <div className="min-w-0">
                                                            <h5 className="text-xs font-black text-zinc-900 dark:text-white truncate">{v.name}</h5>
                                                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                                                {v.type} · {v.transmission} · {v.seats} seats
                                                            </p>
                                                            <span className="text-[11px] font-black text-[#FF3B30]">
                                                                {formatPHP(v.price_per_day)}/day
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleVehicleBookingFound(v, null)}
                                                        className="px-2.5 py-1.5 bg-[#FF3B30] hover:bg-red-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 transition-colors cursor-pointer"
                                                    >
                                                        Book
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className={`text-[9.5px] mt-1 text-right ${msg.role === 'user' ? 'text-red-200' : 'text-zinc-400'}`}>
                                        {msg.time}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Live interim spoken transcript */}
                        {isListening && (
                            <div className="flex justify-start">
                                <div className="w-7 h-7 rounded-full bg-[#FF3B30] text-white text-[10px] font-black flex items-center justify-center mr-2 mt-1 shrink-0 animate-pulse">
                                    🎤
                                </div>
                                <div className="bg-red-500/10 border border-[#FF3B30]/30 rounded-2xl rounded-tl-sm px-3.5 py-2 text-xs text-zinc-800 dark:text-zinc-200 italic shadow-sm flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#FF3B30] animate-ping shrink-0" />
                                    <span>{interimText || 'Listening to your voice... Speak clearly into your mic'}</span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick suggestion action chips (dynamically generated from database vehicles) */}
                    {messages.length > 0 && !isListening && (
                        <div className="p-2 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-wrap gap-1.5 shrink-0 max-h-24 overflow-y-auto">
                            {(messages[messages.length - 1]?.chips || [
                                ...(vehicles.slice(0, 3).map(v => `Book ${v.name.split(' 20')[0]} 🚗`)),
                                '📅 Select Dates',
                                'Browse All Fleet 🚗',
                                'Show 3 Requirements 📄'
                            ]).map((chip, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => processCommand(chip.replace(/[🚗📄💰🎉🪪🆔🧾🚀✅🔍🔐📝]/g, '').trim())}
                                    className="px-2.5 py-1 rounded-full border border-zinc-300 dark:border-zinc-700 hover:border-[#FF3B30] text-zinc-700 dark:text-zinc-300 hover:text-[#FF3B30] text-[11px] font-semibold transition-colors bg-zinc-50 dark:bg-zinc-800 shrink-0 cursor-pointer"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Microphone Action & Text Input Bar (Multi-modal with text fallback) */}
                    <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
                        {/* Audio wave visualization while listening */}
                        {isListening && (
                            <div className="flex items-center justify-center gap-1 mb-2.5 py-1 bg-red-500/10 border border-[#FF3B30]/20 rounded-xl">
                                <span className="text-[11px] font-black text-[#FF3B30] mr-2">LISTENING:</span>
                                {[40, 70, 30, 90, 60, 100, 50, 80, 45, 65].map((h, i) => (
                                    <span
                                        key={i}
                                        className="w-1 bg-[#FF3B30] rounded-full animate-pulse"
                                        style={{ height: `${h * 0.22}px`, animationDelay: `${i * 0.08}s`, animationDuration: '0.6s' }}
                                    />
                                ))}
                            </div>
                        )}

                        <form onSubmit={handleTextInputSubmit} className="flex items-center gap-2">
                            {/* Speech Recognition Mic Button */}
                            <button
                                type="button"
                                onClick={toggleListening}
                                title={isListening ? "Stop listening" : "Click to speak voice command"}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                                    isListening
                                        ? 'bg-[#FF3B30] text-white ring-4 ring-[#FF3B30]/30 animate-pulse'
                                        : 'bg-zinc-100 hover:bg-[#FF3B30]/15 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-[#FF3B30]'
                                }`}
                            >
                                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-[#FF3B30]" />}
                            </button>

                            {/* Fallback Text Input */}
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={isListening ? "Listening to your voice... or type command" : `Say or type "Book ${vehicles[0]?.name?.split(' 20')[0] || 'a car'}", "Set dates"...`}
                                className="flex-1 h-10 px-3.5 bg-zinc-100 dark:bg-zinc-800 border-0 rounded-full text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-2 focus:ring-[#FF3B30] outline-none"
                            />

                            {/* Send Button */}
                            <button
                                type="submit"
                                disabled={!inputText.trim()}
                                className="w-10 h-10 rounded-full bg-[#FF3B30] hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center shrink-0 transition-colors shadow-sm"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>

                        {/* Status bar info */}
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 px-1">
                            <span>
                                {speechSupported ? '🎙️ Web Speech API Active' : '⌨️ Text fallback mode active'}
                            </span>
                            <span>
                                100% Free · No paid API dependencies
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
