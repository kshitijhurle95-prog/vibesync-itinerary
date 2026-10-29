import asyncio
import json
import subprocess
from pathlib import Path
import edge_tts

OUTPUT_DIR = Path(r"C:\Users\HP\Downloads\vibesync-itinerary\demo_video")
VOICE = "en-US-ChristopherNeural"
RATE = "+6%"

SCENES = [
    {
        "id": "scene_1",
        "title": "Problem & Vision",
        "text": (
            "Traditional travel guides give everyone the exact same tourist traps. "
            "But what if your weekend itinerary was shaped by your real aesthetic taste—the obscure anime, "
            "indie games, and cult records you love? "
            "Welcome to VibeSync, an autonomous cultural travel agent built for the Qloo Agentic Hackathon, "
            "pairing high-speed Groq reasoning with Qloo's cultural taste graph."
        )
    },
    {
        "id": "scene_2",
        "title": "Interactive Input & Multi-Day Planning",
        "text": (
            "Using VibeSync is effortless. You can switch between light and dark modes with a single click. "
            "In the taste input, enter any media you're passionate about—like cult anime, underground hip-hop, "
            "or synth-wave games—or click 'Try an example'. "
            "Pick any global destination like Tokyo, select your trip duration, and let the agent take over."
        )
    },
    {
        "id": "scene_3",
        "title": "Autonomous Agent Pipeline in Action",
        "text": (
            "Behind the scenes, our multi-stage agent pipeline kicks off. "
            "Groq extracts the deeper aesthetic undertones of your favorites, "
            "maps them to canonical cultural entities in Qloo's taste graph, "
            "retrieves affinity-scored venues across Tokyo, and mathematically sequences a zero-backtracking schedule."
        )
    },
    {
        "id": "scene_4",
        "title": "Aesthetic Profile & Qloo Taste Graph Grounding",
        "text": (
            "Here is our synthesized aesthetic profile: Tokyo Neon Noir Flux—capturing the cybernetic introspection "
            "of Serial Experiments Lain, the adrenaline of Hotline Miami, and the raw grit of MF DOOM. "
            "Notice how Qloo expanded our inputs into connected cultural touchstones like Akira and Blade Runner."
        )
    },
    {
        "id": "scene_5",
        "title": "Hour-by-Hour Itinerary & Taste-Match Precision",
        "text": (
            "Every stop is scheduled hour by hour with realistic pacing. "
            "Look at the precision: each location features a verified Qloo taste-match affinity score, full address, "
            "and a dedicated cultural explanation explaining exactly why this venue resonates with your personal aesthetic, "
            "complete with a direct Google Maps link."
        )
    },
    {
        "id": "scene_6",
        "title": "Candidate Places & Pipeline Transparency Trace",
        "text": (
            "On the right, VibeSync displays candidate venues ranked by Qloo affinity, "
            "diversified across categories so you don't just get a list of bars. "
            "And for full transparency, our agent trace exposes the exact latency of each step, "
            "achieving one hundred percent taste-matched place coverage."
        )
    },
    {
        "id": "scene_7",
        "title": "Multi-Day Navigation, Plain-Text Export & Wrap-up",
        "text": (
            "You can seamlessly toggle between itinerary days, and with one click of 'Copy plan', "
            "export your entire formatted weekend schedule directly to your clipboard. "
            "VibeSync transforms obscure passions into unforgettable real-world adventures. "
            "Experience your taste, mapped onto a city."
        )
    }
]

def get_duration(file_path: Path) -> float:
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(file_path)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return float(res.stdout.strip())

async def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    timings = []
    current_time = 0.0

    print("Generating voiceover audio files...")
    concat_list_file = OUTPUT_DIR / "audio_concat.txt"
    concat_lines = []

    for scene in SCENES:
        sid = scene["id"]
        raw_mp3 = OUTPUT_DIR / f"{sid}_raw.mp3"
        padded_mp3 = OUTPUT_DIR / f"{sid}.mp3"
        print(f"Synthesizing {sid}: {scene['title']}...")
        
        communicate = edge_tts.Communicate(scene["text"], VOICE, rate=RATE)
        await communicate.save(str(raw_mp3))
        
        raw_dur = get_duration(raw_mp3)
        pause_dur = 0.8
        
        # Add exact 0.8s silence pad using ffmpeg
        pad_cmd = [
            "ffmpeg", "-y", "-i", str(raw_mp3),
            "-af", f"apad=pad_dur={pause_dur}",
            str(padded_mp3)
        ]
        subprocess.run(pad_cmd, capture_output=True, check=True)
        padded_dur = get_duration(padded_mp3)
        
        timings.append({
            "id": sid,
            "title": scene["title"],
            "start": round(current_time, 2),
            "audio_duration": round(raw_dur, 2),
            "duration": round(padded_dur, 2),
            "end": round(current_time + padded_dur, 2)
        })
        
        current_time += padded_dur
        concat_lines.append(f"file '{padded_mp3.name}'")

    with open(concat_list_file, "w", encoding="utf-8") as f:
        f.write("\n".join(concat_lines))

    timings_file = OUTPUT_DIR / "scene_timings.json"
    with open(timings_file, "w", encoding="utf-8") as f:
        json.dump({
            "total_duration": round(current_time, 2),
            "scenes": timings
        }, f, indent=2)

    master_audio = OUTPUT_DIR / "master_voiceover.mp3"
    concat_cmd = [
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", str(concat_list_file),
        "-c", "copy",
        str(master_audio)
    ]
    subprocess.run(concat_cmd, check=True)
    master_dur = get_duration(master_audio)
    print(f"\nSUCCESS! Master voiceover: {master_audio}")
    print(f"Total synced duration: {master_dur:.2f}s (~{int(master_dur // 60)}m {int(master_dur % 60)}s)")

if __name__ == "__main__":
    asyncio.run(main())
