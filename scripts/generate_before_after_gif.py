import os
import sys
import time
import subprocess
import shutil
from playwright.sync_api import sync_playwright

FFMPEG_PATH = r"C:\Users\Omid io\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.1-full_build\bin\ffmpeg.exe"

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    frames_dir = os.path.join(root_dir, "dist", "compare-frames")
    if os.path.exists(frames_dir):
        shutil.rmtree(frames_dir)
    os.makedirs(frames_dir, exist_ok=True)

    before_img = os.path.join(root_dir, "docs", "compare-before.png").replace("\\", "/")
    after_img = os.path.join(root_dir, "docs", "compare-after.png").replace("\\", "/")

    # Generate standalone HTML template with modern before/after comparison slider
    html_content = f"""<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<style>
  * {{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }}
  body {{
    background: #0f1117;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-family: system-ui, -apple-system, sans-serif;
    overflow: hidden;
  }}
  .comparison-container {{
    position: relative;
    width: 413px;
    height: 854px;
    border-radius: 28px;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1);
  }}
  .img-layer {{
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }}
  .img-layer img {{
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }}
  .layer-before {{
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 50%;
    overflow: hidden;
    z-index: 2;
  }}
  .layer-before img {{
    width: 413px;
    max-width: none;
  }}
  /* Slider divider bar & handle */
  .slider-bar {{
    position: absolute;
    top: 0;
    bottom: 0;
    width: 3px;
    background: #ffffff;
    box-shadow: 0 0 12px rgba(255, 255, 255, 0.8), 0 0 20px rgba(99, 102, 241, 0.6);
    z-index: 10;
    transform: translateX(-50%);
  }}
  .slider-handle {{
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1e1b4b;
    font-size: 16px;
    font-weight: bold;
    user-select: none;
  }}
  /* Badge Labels */
  .badge {{
    position: absolute;
    top: 20px;
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.5px;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    z-index: 15;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }}
  .badge-after {{
    right: 18px;
    background: rgba(99, 102, 241, 0.85);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }}
  .badge-before {{
    left: 18px;
    background: rgba(239, 68, 68, 0.85);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }}
</style>
</head>
<body>

<div class="comparison-container">
  <!-- After Layer (Base) -->
  <div class="img-layer layer-after">
    <img src="file:///{after_img}" alt="After">
    <div class="badge badge-after">✨ نسخه جدید (FontWoW 2.0)</div>
  </div>

  <!-- Before Layer (Clipped) -->
  <div class="layer-before" id="beforeLayer">
    <img src="file:///{before_img}" alt="Before">
    <div class="badge badge-before">🔴 نسخه قدیمی (v1.x)</div>
  </div>

  <!-- Divider Line & Drag Handle -->
  <div class="slider-bar" id="sliderBar">
    <div class="slider-handle">⟷</div>
  </div>
</div>

<script>
  function setSlider(percent) {{
    const p = Math.max(0, Math.min(100, percent));
    document.getElementById('beforeLayer').style.width = p + '%';
    document.getElementById('sliderBar').style.left = p + '%';
  }}
</script>
</body>
</html>
"""

    html_file = os.path.join(root_dir, "dist", "compare_slider.html")
    with open(html_file, "w", encoding="utf-8") as f:
        f.write(html_content)

    print("Launching Playwright to animate Before/After slider...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 450, "height": 900},
            device_scale_factor=1
        )
        page = context.new_page()
        page.goto(f"file:///{html_file.replace(chr(92), '/')}")
        page.wait_for_timeout(1000)

        frame_idx = 1
        def snap(count=1):
            nonlocal frame_idx
            for _ in range(count):
                path = os.path.join(frames_dir, f"frame_{frame_idx:03d}.png")
                # Clip precisely to the phone container
                container = page.locator(".comparison-container")
                container.screenshot(path=path)
                frame_idx += 1

        # Keyframe Sequence:
        # 1. Start at 100% (Full Before image) - hold 3 frames
        page.evaluate("setSlider(100)")
        page.wait_for_timeout(200)
        snap(3)

        # 2. Smoothly sweep slider from 100% down to 0% (revealing After)
        # Using ease-in-out cosine curve
        steps = [95, 88, 78, 65, 50, 50, 35, 22, 12, 5, 0]
        for s in steps:
            page.evaluate(f"setSlider({s})")
            page.wait_for_timeout(60)
            snap(1 if s != 50 else 3) # Hold at 50% split view for 3 frames

        # 3. Hold at 0% (Full After image) - hold 4 frames
        page.evaluate("setSlider(0)")
        page.wait_for_timeout(200)
        snap(4)

        # 4. Smoothly sweep slider back from 0% to 100%
        return_steps = [10, 25, 40, 50, 65, 80, 92, 100]
        for s in return_steps:
            page.evaluate(f"setSlider({s})")
            page.wait_for_timeout(60)
            snap(1)

        browser.close()

    print(f"Captured {frame_idx - 1} frames. Compiling with FFmpeg...")
    out_gif = os.path.join(root_dir, "docs", "compare-slider.gif")
    public_gif = os.path.join(root_dir, "public", "docs", "compare-slider.gif")

    pattern = os.path.join(frames_dir, "frame_%03d.png")
    cmd = f'"{FFMPEG_PATH}" -y -framerate 4 -i "{pattern}" -vf "scale=380:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" "{out_gif}"'
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if res.returncode != 0:
        print("FFmpeg Error:", res.stderr)
    else:
        shutil.copyfile(out_gif, public_gif)
        size_mb = os.path.getsize(out_gif) / (1024 * 1024)
        print(f"Successfully generated Before/After Slider GIF at: {out_gif} ({size_mb:.2f} MB)")
        print(f"Copied to public at: {public_gif}")

if __name__ == "__main__":
    main()
