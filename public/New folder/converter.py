import os
import subprocess
import sys

def convert_videos():
    # Get the current working directory where the script is located
    current_dir = os.getcwd()
    
    # List all files in the directory
    files = [f for f in os.listdir(current_dir) if f.lower().endswith('.mov')]

    if not files:
        print("No .mov files found in this directory.")
        return

    print(f"Found {len(files)} videos to convert...")

    for filename in files:
        # Construct the new filename with .webm extension
        # This preserves the xyz_ITA / xyz_ENG structure automatically
        name_without_ext = os.path.splitext(filename)[0]
        output_filename = f"{name_without_ext}.webm"

        print(f"Processing: {filename} -> {output_filename}")

        # Build the ffmpeg command as a list of arguments
        # We use the 'yuva420p' pixel format for transparency as requested
        command = [
            "ffmpeg",
            "-i", filename,            # Input file
            "-c:v", "libvpx-vp9",      # Video codec
            "-b:v", "0",               # Bitrate 0 (required for crf)
            "-crf", "32",              # Constant Rate Factor
            "-pix_fmt", "yuva420p",    # Pixel format (Alpha channel)
            "-row-mt", "1",            # Row based multithreading
            "-deadline", "good",       # Compression efficiency/speed
            "-threads", "4",           # Number of threads
            "-n",                      # -n: Do not overwrite output if it exists (safety)
            output_filename            # Output file
        ]

        try:
            # Run the command
            subprocess.run(command, check=True)
            print(f"✅ Finished: {output_filename}")
        except subprocess.CalledProcessError as e:
            print(f"❌ Error converting {filename}: {e}")
        
        print("-" * 30)

if __name__ == "__main__":
    convert_videos()