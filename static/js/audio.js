/**
 * Audio Manager for Mini Games: Strategy & Board
 * Handles all sound effects and audio functionality
 */

class AudioManager {
    constructor() {
        this.sounds = new Map();
        this.enabled = true;
        this.volume = 0.3;
        this.init();
    }

    init() {
        // Initialize audio elements
        this.loadSounds();
        this.setupVolumeControls();
    }

    loadSounds() {
        // Define sound effects with their purposes
        const soundEffects = {
            'move': {
                element: 'move-sound',
                description: 'Piece movement sound'
            },
            'capture': {
                element: 'capture-sound',
                description: 'Piece capture sound'
            },
            'dice': {
                element: 'dice-sound',
                description: 'Dice roll sound'
            },
            'win': {
                element: 'win-sound',
                description: 'Victory sound'
            }
        };

        // Load each sound effect
        for (const [key, config] of Object.entries(soundEffects)) {
            const audio = document.getElementById(config.element);
            if (audio) {
                audio.volume = this.volume;
                audio.preload = 'auto';
                this.sounds.set(key, {
                    audio: audio,
                    description: config.description
                });
            }
        }

        // Create synthetic sounds for games that need them
        this.createSyntheticSounds();
    }

    createSyntheticSounds() {
        // Create Web Audio API context for synthetic sounds
        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            try {
                this.audioContext = new (AudioContext || webkitAudioContext)();
                this.createBeepSound();
                this.createClickSound();
                this.createWooshSound();
            } catch (e) {
                console.log('Web Audio API not available, using fallback sounds');
            }
        }
    }

    createBeepSound() {
        // Create a simple beep sound for UI interactions
        const beep = (frequency = 800, duration = 100) => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.1, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration / 1000);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + duration / 1000);
        };

        this.sounds.set('beep', {
            audio: { play: () => beep() },
            description: 'UI beep sound'
        });
    }

    createClickSound() {
        // Create a click sound for button interactions
        const click = () => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.1);
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(this.volume * 0.05, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1);
        };

        this.sounds.set('click', {
            audio: { play: () => click() },
            description: 'Button click sound'
        });
    }

    createWooshSound() {
        // Create a whoosh sound for animations
        const woosh = () => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.3);
            oscillator.type = 'sawtooth';
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
            filter.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(this.volume * 0.08, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.3);
        };

        this.sounds.set('woosh', {
            audio: { play: () => woosh() },
            description: 'Animation woosh sound'
        });
    }

    setupVolumeControls() {
        // Load saved volume setting
        const savedVolume = localStorage.getItem('gameVolume');
        if (savedVolume !== null) {
            this.volume = parseFloat(savedVolume);
            this.updateAllVolumes();
        }

        // Load sound enabled setting
        const savedEnabled = localStorage.getItem('soundEnabled');
        if (savedEnabled !== null) {
            this.enabled = JSON.parse(savedEnabled);
        }
    }

    updateAllVolumes() {
        // Update volume for all loaded sounds
        this.sounds.forEach(sound => {
            if (sound.audio && sound.audio.volume !== undefined) {
                sound.audio.volume = this.volume;
            }
        });
    }

    play(soundName, options = {}) {
        if (!this.enabled) return;

        const sound = this.sounds.get(soundName);
        if (!sound) {
            console.warn(`Sound '${soundName}' not found`);
            return;
        }

        try {
            // Reset audio to beginning
            if (sound.audio.currentTime !== undefined) {
                sound.audio.currentTime = 0;
            }

            // Apply any volume override
            if (options.volume !== undefined && sound.audio.volume !== undefined) {
                sound.audio.volume = Math.min(options.volume, this.volume);
            }

            // Play the sound
            const playPromise = sound.audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('Audio play failed:', error);
                });
            }

        } catch (error) {
            console.log('Error playing sound:', error);
        }
    }

    // Convenience methods for common game sounds
    playMove() {
        this.play('move');
    }

    playCapture() {
        this.play('capture');
    }

    playDice() {
        this.play('dice');
    }

    playWin() {
        this.play('win');
    }

    playClick() {
        this.play('click');
    }

    playBeep() {
        this.play('beep');
    }

    playWoosh() {
        this.play('woosh');
    }

    // Game-specific sound sequences
    playCheckmate() {
        // Play a sequence of sounds for checkmate
        this.playCapture();
        setTimeout(() => this.playWin(), 300);
    }

    playGameStart() {
        // Play sounds for game start
        this.playBeep();
        setTimeout(() => this.playClick(), 200);
    }

    playTurnChange() {
        // Subtle sound for turn changes
        this.play('beep', { volume: 0.1 });
    }

    playError() {
        // Error sound using rapid beeps
        this.playBeep();
        setTimeout(() => this.playBeep(), 100);
    }

    playSuccess() {
        // Success sound sequence
        this.playClick();
        setTimeout(() => this.playWoosh(), 150);
    }

    // Volume and settings controls
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
        localStorage.setItem('gameVolume', this.volume.toString());
    }

    getVolume() {
        return this.volume;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        localStorage.setItem('soundEnabled', JSON.stringify(this.enabled));
    }

    isEnabled() {
        return this.enabled;
    }

    toggle() {
        this.setEnabled(!this.enabled);
        return this.enabled;
    }

    // Audio context resume for mobile browsers
    resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // Cleanup method
    cleanup() {
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.sounds.clear();
    }
}

// Global audio manager instance
let audioManager;

// Initialize audio manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    audioManager = new AudioManager();
    
    // Resume audio context on first user interaction (for mobile browsers)
    const resumeAudio = () => {
        audioManager.resumeAudioContext();
        document.removeEventListener('touchstart', resumeAudio);
        document.removeEventListener('click', resumeAudio);
    };
    
    document.addEventListener('touchstart', resumeAudio);
    document.addEventListener('click', resumeAudio);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
}