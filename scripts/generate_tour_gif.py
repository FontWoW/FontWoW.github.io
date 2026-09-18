import os
import sys
import time
import subprocess
import shutil
from playwright.sync_api import sync_playwright

FFMPEG_PATH = r"C:\Users\Omid io\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.1-full_build\bin\ffmpeg.exe"
PORT = 5199
URL = f"http://localhost:{PORT}/#/app"

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    frames_dir = os.path.join(root_dir, "dist", "gif-frames")
    if os.path.exists(frames_dir):
        shutil.rmtree(frames_dir)
    os.makedirs(frames_dir, exist_ok=True)
    os.makedirs(os.path.join(root_dir, "docs"), exist_ok=True)
    os.makedirs(os.path.join(root_dir, "public", "docs"), exist_ok=True)

    print("Starting Vite preview/dev server...")
    vite_proc = subprocess.Popen(
        f"npx vite --port {PORT} --host 127.0.0.1",
        shell=True,
        cwd=root_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == "win32" else 0
    )

    try:
        print("Waiting for server to become responsive...")
        time.sleep(3)

        with sync_playwright() as p:
            print("Launching browser...")
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                viewport={"width": 430, "height": 780},
                device_scale_factor=2,
                locale="fa-IR"
            )
            page = context.new_page()

            print("Navigating to application...")
            page.goto(URL, wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(2000)

            # Clear guides & set initial sample text
            page.evaluate("""() => {
                localStorage.setItem('fontwow_dismissed_ios_prompt', 'true');
                localStorage.setItem('fontwow_app_tour_done', 'true');
            }""")

            frame_index = 1
            def capture(name, count=2):
                nonlocal frame_index
                for _ in range(count):
                    out_path = os.path.join(frames_dir, f"frame_{frame_index:03d}.png")
                    page.screenshot(path=out_path)
                    frame_index += 1
                print(f"[Captured] {name} ({count} frames)")

            # Scene 1: Initial editor canvas with modern text
            page.evaluate("""() => {
                const el = document.querySelector('.text-canvas');
                if (el) el.innerText = 'استودیو فونت‌واو ۲.۰';
            }""")
            page.wait_for_timeout(400)
            capture("Scene 1 - Editor Canvas", 3)

            # Scene 2: Open controls drawer (Font tab)
            grab_bar = page.locator(".controls-grab-bar")
            if grab_bar.is_visible():
                grab_bar.click()
                page.wait_for_timeout(700)
                capture("Scene 2 - Controls Drawer Open", 3)

            # Helper to click a tab by searching its label
            def switch_tab(label_text):
                return page.evaluate(f"""(txt) => {{
                    const tabs = Array.from(document.querySelectorAll('.controls-bar .tab'));
                    const target = tabs.find(t => t.textContent.includes(txt));
                    if (target) {{
                        target.click();
                        return true;
                    }}
                    return false;
                }}""", label_text)

            # Scene 3: Style tab (Effects & Neon Shaders)
            if switch_tab("استایل"):
                page.wait_for_timeout(600)
                # Click on one of the visual effect presets
                page.evaluate("""() => {
                    const preset = document.querySelector('.effect-card, .fx-item, .pill-tab');
                    if (preset) preset.click();
                }""")
                page.wait_for_timeout(400)
                capture("Scene 3 - Style & Neon Tab", 3)

            # Scene 4: Background tab (Enable background gradient & show drag badge)
            if switch_tab("پس‌زمینه"):
                page.wait_for_timeout(600)
                # Click the toggle or first gradient chip
                page.evaluate("""() => {
                    const toggle = document.querySelector('.bg-toggle-row button, .segmented-control button');
                    if (toggle) toggle.click();
                    const swatch = document.querySelector('.bg-swatch, .bg-preset-item');
                    if (swatch) swatch.click();
                }""")
                page.wait_for_timeout(600)
                # Drag the canvas text slightly to show snap guides
                text_el = page.locator(".text-canvas, .text-layer").first
                if text_el.is_visible():
                    box = text_el.bounding_box()
                    if box:
                        page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
                        page.mouse.down()
                        page.mouse.move(box["x"] + box["width"] / 2 + 15, box["y"] + box["height"] / 2 - 10)
                        page.wait_for_timeout(300)
                        capture("Scene 4 - Background Gradient & Draggable Text", 3)
                        page.mouse.up()
                else:
                    capture("Scene 4 - Background Gradient Active", 3)

            # Scene 5: Layout tab (Three structured cards)
            if switch_tab("چیدمان"):
                page.wait_for_timeout(600)
                capture("Scene 5 - Minimalist Layout Cards", 3)

            # Scene 6: Open Save Options modal
            save_btn = page.locator(".topbar .pill-btn").first
            if save_btn.is_visible():
                save_btn.click()
                page.wait_for_timeout(700)
                capture("Scene 6 - High-Res 900px Save Modal", 4)

            browser.close()

        print(f"All scenes captured ({frame_index - 1} frames). Encoding high-quality GIF with FFmpeg...")
        output_gif = os.path.join(root_dir, "docs", "tour-showcase.gif")
        public_gif = os.path.join(root_dir, "public", "docs", "tour-showcase.gif")

        input_pattern = os.path.join(frames_dir, "frame_%03d.png")
        cmd = f'"{FFMPEG_PATH}" -y -framerate 1.2 -i "{input_pattern}" -vf "scale=400:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" "{output_gif}"'
        res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if res.returncode != 0:
            print("FFmpeg Error:", res.stderr)
        else:
            shutil.copyfile(output_gif, public_gif)
            gif_size = os.path.getsize(output_gif) / (1024 * 1024)
            print(f"Successfully generated GIF at: {output_gif} ({gif_size:.2f} MB)")
            print(f"Copied to public at: {public_gif}")

    finally:
        print("Cleaning up Vite server...")
        if sys.platform == "win32":
            subprocess.run(f"taskkill /F /T /PID {vite_proc.pid}", shell=True, capture_output=True)
        else:
            vite_proc.terminate()

if __name__ == "__main__":
    main()
