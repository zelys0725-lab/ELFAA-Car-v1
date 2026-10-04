import React, { useState, useRef, useEffect } from 'react';

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
const formatPHP = (amount) =>
    'PHP ' + parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const timestamp = () =>
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

// ─────────────────────────────────────────────
//  Intent Engine
// ─────────────────────────────────────────────
const buildEngine = ({ vehicles = [], promos = [], addOns = [], bookings = [] }) => {
    const fleet = vehicles.filter(v => v.status === 'available' || v.status === 'rented' || v.status === 'reserved');

    const respond = (text) => {
        const q = text.toLowerCase();

        // ── Greetings ──────────────────────────────────
        if (/^(hi|hello|hey|good morning|good afternoon|good evening|musta|kamusta|yo|sup)\b/.test(q)) {
            return {
                text: "Hello! 👋 Welcome to **ELFAA Car Rental**! I'm your virtual assistant. How can I help you today?",
                chips: ['Book a Car 🚗', 'View Fleet & Rates 💰', 'Requirements 📄', 'Promos 🎉', 'Contact Us 📍'],
            };
        }

        // ── Booking Guide ──────────────────────────────
        if (/book|reserv|rent|how (do|can) (i|we)|borrow/.test(q)) {
            return {
                text: `**How to Book a Car at ELFAA:**\n\n1. **Register / Log In** to your account\n2. Go to **Browse Fleet** on your dashboard\n3. Select your preferred vehicle\n4. Click **"Book Selection"** and fill in pick-up dates\n5. Choose your **payment method** (Cash on Delivery / Online)\n6. Submit — our team will confirm your booking shortly! ✅\n\nNeed help choosing a vehicle?`,
                chips: ['View Fleet & Rates 💰', 'Available Vehicles 🚗', 'Payment Methods 💳'],
            };
        }

        // ── Vehicle List ──────────────────────────────
        if (/vehicle|fleet|car|suv|sedan|van|truck|available|show.*car|list.*car/.test(q)) {
            if (fleet.length === 0) {
                return { text: 'Sorry, there are currently no available vehicles in our fleet. Please check back soon!', chips: ['Contact Us 📍'] };
            }
            const lines = fleet.slice(0, 8).map(v =>
                `• **${v.name}** (${v.type}) — ${formatPHP(v.price_per_day)}/day | ${v.seats} seats | ${v.transmission}`
            );
            return {
                text: `🚗 **Our Available Fleet:**\n\n${lines.join('\n')}\n\n${fleet.length > 8 ? `...and ${fleet.length - 8} more on the fleet page.` : ''}\n\nWould you like details on any specific vehicle?`,
                chips: ['Book a Car 🚗', 'Check Rates 💰', 'Requirements 📄'],
            };
        }

        // ── Pricing / Rates ────────────────────────────
        if (/price|rate|cost|fee|how much|magkano|per day|daily/.test(q)) {
            if (fleet.length === 0) {
                return { text: 'Our pricing info is not available at the moment. Please contact us directly.', chips: ['Contact Us 📍'] };
            }
            const sorted = [...fleet].sort((a, b) => parseFloat(a.price_per_day) - parseFloat(b.price_per_day));
            const cheapest = sorted[0];
            const mostExpensive = sorted[sorted.length - 1];
            const lines = sorted.slice(0, 6).map(v =>
                `• **${v.name}** — ${formatPHP(v.price_per_day)}/day`
            );
            return {
                text: `💰 **ELFAA Rate Card:**\n\n${lines.join('\n')}\n\nRates range from **${formatPHP(cheapest.price_per_day)}** to **${formatPHP(mostExpensive.price_per_day)}** per day depending on the vehicle type.\n\n_Note: Prices may vary with active promos._`,
                chips: ['View Promos 🎉', 'Book a Car 🚗', 'Payment Methods 💳'],
            };
        }

        // ── Promos / Discounts ─────────────────────────
        if (/promo|discount|deal|voucher|coupon|sale|offer/.test(q)) {
            const activePromos = promos.filter(p => p.status === 'active');
            if (activePromos.length === 0) {
                return { text: "There are no active promos at the moment. Stay tuned — great deals are coming soon! 🎉", chips: ['View Fleet & Rates 💰', 'Contact Us 📍'] };
            }
            const lines = activePromos.map(p =>
                `• **${p.title}** — ${p.discount_text}${p.promo_code ? ` | Code: \`${p.promo_code}\`` : ''}`
            );
            return {
                text: `🎉 **Active Promos:**\n\n${lines.join('\n')}\n\nEnter the promo code at checkout to apply the discount!`,
                chips: ['Book a Car 🚗', 'View Fleet & Rates 💰'],
            };
        }

        // ── Requirements / Documents ───────────────────
        if (/require|document|id|license|driver|valid|gov|verify|identif|submit/.test(q)) {
            return {
                text: `📄 **Rental Requirements:**\n\nTo rent a vehicle at ELFAA, you need to submit:\n\n1. **Valid Government-Issued ID** (Passport, SSS, PhilHealth, UMID, Voter's ID)\n2. **Driver's License Number**\n3. **Proof of Billing** (utility bill, bank statement)\n\n**How to Submit:**\nGo to your **Dashboard → Identity & Documents** tab, upload your files, and our team will verify them within 24 hours.\n\n_All documents are reviewed and approved by our admin team before your first booking._`,
                chips: ['Book a Car 🚗', 'Contact Us 📍'],
            };
        }

        // ── Payment Methods ────────────────────────────
        if (/pay|payment|method|gcash|cash|online|transfer|cod/.test(q)) {
            return {
                text: `💳 **Payment Methods Accepted:**\n\n🔸 **Cash on Delivery (COD)** — Pay in person at pickup\n🔸 **Online Payment** — GCash, bank transfer, or e-wallet\n\nFor online payments, you'll need to upload your **payment screenshot/proof** on your dashboard after submitting the booking.\n\nOur admin will verify your payment and confirm the booking.`,
                chips: ['Book a Car 🚗', 'View Promos 🎉'],
            };
        }

        // ── Add-ons / Extra Goods ──────────────────────
        if (/add.?on|extra|goods|accessory|gps|seat|child|dash|camera/.test(q)) {
            const activeAddOns = addOns.filter(a => a.status === 'available');
            if (activeAddOns.length === 0) {
                return { text: "We don't have any add-ons/extra goods listed right now. Please contact us for special arrangements.", chips: ['Contact Us 📍'] };
            }
            const lines = activeAddOns.map(a =>
                `• **${a.name}** — ${formatPHP(a.price_per_day)}/day${a.description ? `\n  _(${a.description})_` : ''}`
            );
            return {
                text: `➕ **Available Add-ons:**\n\n${lines.join('\n')}\n\nAdd-ons can be selected during booking checkout.`,
                chips: ['Book a Car 🚗', 'View Fleet & Rates 💰'],
            };
        }

        // ── Booking Status (logged-in) ─────────────────
        if (/my booking|status|active booking|pending|confirm|current/.test(q)) {
            if (bookings.length === 0) {
                return {
                    text: "You don't have any bookings yet! Ready to make your first reservation? 🚗",
                    chips: ['Book a Car 🚗', 'View Fleet & Rates 💰'],
                };
            }
            const active = bookings.filter(b => ['pending', 'confirmed'].includes(b.status));
            const completed = bookings.filter(b => b.status === 'completed').length;
            const lines = active.slice(0, 3).map(b =>
                `• **${b.vehicle?.name ?? 'Vehicle'}** — Status: \`${b.status.toUpperCase()}\``
            );
            return {
                text: `📋 **Your Booking Summary:**\n\n${active.length > 0 ? `Active:\n${lines.join('\n')}` : 'No active bookings.'}\n\nCompleted trips: **${completed}**\n\nView your full booking history in the **My Bookings** tab.`,
                chips: ['Book a Car 🚗', 'Contact Us 📍'],
            };
        }

        // ── Cancellation Policy ────────────────────────
        if (/cancel|cancell|refund/.test(q)) {
            return {
                text: `🔴 **Cancellation Policy:**\n\nYou may cancel a **pending** booking directly from your dashboard under the **My Bookings** tab.\n\n⚠️ Once a booking is **confirmed**, please contact us directly to process the cancellation.\n\n_Refund eligibility depends on cancellation timing and our team's review._`,
                chips: ['Contact Us 📍', 'My Bookings'],
            };
        }

        // ── Location / Contact ─────────────────────────
        if (/contact|location|address|where|hub|find|phone|email|reach/.test(q)) {
            return {
                text: `📍 **ELFAA Car Rental**\n\n🏢 **Hub Location:** Sto. Tomas Hub *(see map on our homepage)*\n📞 **Phone:** Contact us via our platform messaging\n📧 **Email:** Available on the Contact section of our landing page\n\n⏰ **Operating Hours:** 7:00 AM – 7:00 PM daily\n\nFeel free to message us anytime through the platform!`,
                chips: ['Book a Car 🚗', 'Requirements 📄'],
            };
        }

        // ── About ELFAA ────────────────────────────────
        if (/who|what is elfaa|about|company|service/.test(q)) {
            return {
                text: `🚗 **About ELFAA Car Rental**\n\nELFAA is a trusted car rental service providing quality vehicles for personal, business, and leisure travel.\n\nWe offer:\n✅ A wide fleet of well-maintained vehicles\n✅ Flexible rental durations\n✅ Easy online booking\n✅ Competitive rates and seasonal promos\n✅ 24/7 customer support\n\nHow can I assist you today?`,
                chips: ['View Fleet & Rates 💰', 'Book a Car 🚗', 'Contact Us 📍'],
            };
        }

        // ── Thank you ──────────────────────────────────
        if (/thank|thanks|salamat|ty|appreciate/.test(q)) {
            return {
                text: 'You\'re welcome! 😊 It\'s a pleasure to assist you. Is there anything else I can help you with?',
                chips: ['Book a Car 🚗', 'View Fleet & Rates 💰', 'Contact Us 📍'],
            };
        }

        // ── Goodbye ─────────────────────────────────────
        if (/bye|goodbye|see you|later|exit|close/.test(q)) {
            return {
                text: 'Thank you for chatting with ELFAA! 👋 Have a great day and safe travels! 🚗',
                chips: [],
            };
        }

        // ── Fallback ────────────────────────────────────
        return {
            text: `I'm not quite sure about that. 🤔 Here are some things I can help you with:`,
            chips: ['Book a Car 🚗', 'View Fleet & Rates 💰', 'Requirements 📄', 'Promos 🎉', 'Contact Us 📍'],
        };
    };

    // Map chip labels to intent strings
    const chipIntent = (chip) => {
        const map = {
            'Book a Car 🚗': 'how do i book a car',
            'View Fleet & Rates 💰': 'show available vehicles',
            'Check Rates 💰': 'what are the rates',
            'View Fleet & Rates 💰': 'list all cars and prices',
            'Requirements 📄': 'what are the requirements to rent',
            'Promos 🎉': 'are there any promos',
            'View Promos 🎉': 'are there any promos',
            'Contact Us 📍': 'where is the location and contact',
            'Payment Methods 💳': 'what payment methods are accepted',
            'Available Vehicles 🚗': 'show available cars',
            'My Bookings': 'what is my booking status',
        };
        return map[chip] || chip;
    };

    return { respond, chipIntent };
};

// ─────────────────────────────────────────────
//  Typing Indicator
// ─────────────────────────────────────────────
const TypingDots = () => (
    <div className="flex items-end gap-1 py-1 px-2">
        {[0, 1, 2].map(i => (
            <span key={i} className="block w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }} />
        ))}
    </div>
);

// ─────────────────────────────────────────────
//  Message Bubble
// ─────────────────────────────────────────────
const MessageBubble = ({ msg }) => {
    const isBot = msg.role === 'bot';

    // Basic markdown-ish rendering: **bold**, `code`, line breaks
    const renderText = (text) => {
        const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\n)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
                return <code key={i} className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded text-[11px] font-mono">{part.slice(1, -1)}</code>;
            }
            if (part === '\n') return <br key={i} />;
            return <span key={i}>{part}</span>;
        });
    };

    return (
        <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-3`}>
            {isBot && (
                <div className="w-7 h-7 rounded-full bg-[#FF3B30] flex items-center justify-center text-white text-[10px] font-black mr-2 mt-1 shrink-0">
                    EI
                </div>
            )}
            <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-[12.5px] leading-relaxed shadow-sm ${
                isBot
                    ? 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-tl-sm border border-zinc-200 dark:border-zinc-700'
                    : 'bg-[#FF3B30] text-white rounded-tr-sm'
            }`}>
                <div>{renderText(msg.text)}</div>
                <div className={`text-[10px] mt-1 ${isBot ? 'text-zinc-400' : 'text-red-200'}`}>{msg.time}</div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
//  Main Chatbot Component
// ─────────────────────────────────────────────
export default function ElfaaChatbot({ vehicles = [], promos = [], addOns = [], bookings = [] }) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [thinking, setThinking] = useState(false);
    const [hasOpened, setHasOpened] = useState(false);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const engine = buildEngine({ vehicles, promos, addOns, bookings });

    // Initial greeting on first open
    useEffect(() => {
        if (open && !hasOpened) {
            setHasOpened(true);
            setThinking(true);
            setTimeout(() => {
                setThinking(false);
                pushBotMessage({
                    text: "Hello! 👋 I'm **ELFA**, your ELFAA Car Rental assistant. How can I help you today?",
                    chips: ['Book a Car 🚗', 'View Fleet & Rates 💰', 'Requirements 📄', 'Promos 🎉', 'Contact Us 📍'],
                });
            }, 800);
        }
    }, [open]);

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, thinking]);

    // Focus input when opened
    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 200);
    }, [open]);

    const pushBotMessage = (msg) => {
        setMessages(prev => [...prev, { role: 'bot', text: msg.text, chips: msg.chips || [], time: timestamp() }]);
    };

    const handleSend = (text) => {
        const trimmed = (text || input).trim();
        if (!trimmed) return;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: trimmed, chips: [], time: timestamp() }]);
        setThinking(true);
        setTimeout(() => {
            const reply = engine.respond(trimmed);
            setThinking(false);
            pushBotMessage(reply);
        }, 600 + Math.random() * 400);
    };

    const handleChip = (chip) => {
        const intentText = engine.chipIntent(chip);
        handleSend(intentText);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Last bot message chips
    const lastBotMsg = [...messages].reverse().find(m => m.role === 'bot');

    return (
        <>
            {/* ── Floating Bubble ── */}
            <button
                onClick={() => setOpen(o => !o)}
                aria-label="Open ELFAA chat support"
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#FF3B30] shadow-xl flex items-center justify-center text-white transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                style={{ boxShadow: '0 0 0 0 rgba(255,59,48,0.7)' }}
            >
                {open ? (
                    /* Close X */
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    /* Chat icon */
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                )}
                {/* Ping animation when closed */}
                {!open && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-ping" />
                )}
            </button>

            {/* ── Chat Window ── */}
            {open && (
                <div
                    className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 flex flex-col overflow-hidden"
                    style={{ maxHeight: '520px' }}
                >
                    {/* Header */}
                    <div className="bg-[#FF3B30] px-4 py-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-sm shrink-0">
                            EI
                        </div>
                        <div>
                            <div className="text-white font-bold text-sm leading-none">ELFA</div>
                            <div className="text-red-100 text-[10px] mt-0.5 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-300 rounded-full inline-block" />
                                AI Customer Assistant • Always Online
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-3 pt-3 pb-1 space-y-0.5 bg-zinc-50 dark:bg-zinc-950"
                        style={{ minHeight: '240px', maxHeight: '340px' }}>
                        {messages.map((msg, i) => (
                            <MessageBubble key={i} msg={msg} />
                        ))}
                        {thinking && (
                            <div className="flex justify-start mb-3">
                                <div className="w-7 h-7 rounded-full bg-[#FF3B30] flex items-center justify-center text-white text-[10px] font-black mr-2 mt-1 shrink-0">EI</div>
                                <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm">
                                    <TypingDots />
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Quick Reply Chips */}
                    {lastBotMsg?.chips?.length > 0 && !thinking && (
                        <div className="px-3 py-2 flex flex-wrap gap-1.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                            {lastBotMsg.chips.map((chip, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleChip(chip)}
                                    className="text-[11px] px-2.5 py-1 rounded-full border border-[#FF3B30] text-[#FF3B30] hover:bg-[#FF3B30] hover:text-white transition-colors font-medium whitespace-nowrap"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Bar */}
                    <div className="px-3 py-2.5 border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message..."
                            className="flex-1 text-[13px] bg-zinc-100 dark:bg-zinc-800 rounded-full px-4 py-2 outline-none text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-[#FF3B30]/30"
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || thinking}
                            className="w-9 h-9 rounded-full bg-[#FF3B30] text-white flex items-center justify-center shrink-0 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            aria-label="Send message"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-[10px] text-zinc-400 dark:text-zinc-600 py-1 bg-white dark:bg-zinc-900">
                        Powered by ELFAA AI • Responses are based on platform data
                    </div>
                </div>
            )}
        </>
    );
}
