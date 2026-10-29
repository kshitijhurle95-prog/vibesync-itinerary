import subprocess
import json
import shutil
from pathlib import Path

DEMO_DIR = Path(r"C:\Users\HP\Downloads\vibesync-itinerary\demo_video")
DOWNLOADS_DIR = Path(r"C:\Users\HP\Downloads")
ARTIFACT_DIR = Path(r"C:\Users\HP\.gemini\antigravity\brain\346891d4-8085-4d11-8069-7f4e6ccad874")

RAW_VIDEO = DEMO_DIR / "raw_screencast.mp4"
AUDIO_FILE = DEMO_DIR / "master_voiceover.mp3"
FINAL_VIDEO = DEMO_DIR / "VibeSync_Itinerary_Official_Demo.mp4"

def get_duration(file_path: Path) -> float:
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(file_path)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return float(res.stdout.strip())

def main():
    print("Finalizing VibeSync Demo Video...")
    if not RAW_VIDEO.exists():
        print(f"Error: {RAW_VIDEO} not found!")
        return
    if not AUDIO_FILE.exists():
        print(f"Error: {AUDIO_FILE} not found!")
        return

    v_dur = get_duration(RAW_VIDEO)
    a_dur = get_duration(AUDIO_FILE)
    print(f"Raw Video Duration: {v_dur:.2f}s")
    print(f"Master Audio Duration: {a_dur:.2f}s")

    # Calculate exact PTS scale factor
    pts_scale = a_dur / v_dur if v_dur > 0 else 1.0
    print(f"Applying PTS stretch factor: {pts_scale:.6f} to guarantee frame-accurate sync...")

    # Mux video with audio
    # -filter_complex adjusts video PTS to match audio duration exactly
    mux_cmd = [
        "ffmpeg", "-y",
        "-i", str(RAW_VIDEO),
        "-i", str(AUDIO_FILE),
        "-filter_complex", f"[0:v]setpts={pts_scale:.6f}*PTS,scale=1920:1080:flags=lanczos,format=yuv420p[v]",
        "-map", "[v]",
        "-map", "1:a",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "18",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        str(FINAL_VIDEO)
    ]
    print("Running FFmpeg mux...")
    subprocess.run(mux_cmd, check=True)

    final_dur = get_duration(FINAL_VIDEO)
    print(f"Successfully generated: {FINAL_VIDEO} (duration: {final_dur:.2f}s)")

    # Copy to Downloads and Artifacts directory
    dest_downloads = DOWNLOADS_DIR / "VibeSync_Itinerary_Official_Demo.mp4"
    shutil.copyfile(FINAL_VIDEO, dest_downloads)
    print(f"Copied to: {dest_downloads}")

    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    dest_artifact = ARTIFACT_DIR / "VibeSync_Itinerary_Official_Demo.mp4"
    shutil.copyfile(FINAL_VIDEO, dest_artifact)
    print(f"Copied to artifact: {dest_artifact}")

    print("\nALL DELIVERABLES READY!")

if __name__ == "__main__":
    main()
