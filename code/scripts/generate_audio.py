import sys
import os
import hashlib
from gtts import gTTS

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 generate_audio.py <text> <output_path>")
        sys.exit(1)
        
    text = sys.argv[1].strip()
    out_path = sys.argv[2]
    
    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    
    if os.path.exists(out_path) and os.path.getsize(out_path) > 0:
        print(f"CACHE_HIT:{out_path}")
        return
        
    try:
        tts = gTTS(text=text, lang="de")
        tts.save(out_path)
        print(f"SUCCESS:{out_path}")
    except Exception as e:
        print(f"ERROR:{e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
