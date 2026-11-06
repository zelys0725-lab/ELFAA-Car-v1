import React from 'react';
import VoiceBookingAssistant from './VoiceBookingAssistant';

/**
 * ElfaaChatbot — AI Voice Booking Assistant Wrapper
 * Powered by browser-based Web Speech API (Speech Recognition & Speech Synthesis).
 * 100% Free, zero paid API dependencies. Supports both voice commands & text input.
 */
export default function ElfaaChatbot(props) {
    return <VoiceBookingAssistant {...props} />;
}
