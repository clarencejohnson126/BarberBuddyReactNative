#!/usr/bin/env python3
"""
Voice announcement script for Barber Buddy development updates.
Keeps the team informed of key progress milestones.
"""

import sys
import subprocess
import platform

def announce_completion(message):
    """
    Announce completion message using system text-to-speech.
    
    Args:
        message (str): The message to announce
    """
    try:
        system = platform.system()
        
        if system == "Darwin":  # macOS
            # Use macOS say command
            subprocess.run(['say', message], check=True)
        elif system == "Windows":
            # Use Windows SAPI
            subprocess.run(['powershell', '-Command', f'Add-Type -AssemblyName System.Speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $speak.Speak("{message}")'], check=True)
        elif system == "Linux":
            # Use espeak if available
            try:
                subprocess.run(['espeak', message], check=True)
            except FileNotFoundError:
                # Fallback to festival if espeak not available
                subprocess.run(['echo', message, '|', 'festival', '--tts'], shell=True, check=True)
        else:
            print(f"Unsupported system: {system}")
            print(f"Message: {message}")
            
    except subprocess.CalledProcessError as e:
        print(f"Error running text-to-speech: {e}")
        print(f"Message: {message}")
    except Exception as e:
        print(f"Unexpected error: {e}")
        print(f"Message: {message}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        message = " ".join(sys.argv[1:])
        announce_completion(message)
    else:
        announce_completion("Barber Buddy development milestone completed!")