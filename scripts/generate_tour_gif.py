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

    print("Starting Vite server...")
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
                viewport={"width": 420, "height": 760},
                device_scale_factor=2,
                locale="fa-IR"
            )
            page = context.new_page()

            print("Navigating to application...")
            page.goto(URL, wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(2000)

            # Dismiss onboarding popups
            page.evaluate("""() => {
                localStorage.setItem('fontwow_dismissed_ios_prompt', 'true');
                localStorage.setItem('fontwow_app_tour_done', 'true');
            }""")

            frame_index = 1
            def capture(label, count=2):
                nonlocal frame_index
                for _ in range(count):
                    out_path = os.path.join(frames_dir, f"frame_{frame_index:03d}.png")
                    page.screenshot(path=out_path)
                    frame_index += 1
                print(f"[Captured] {label} ({count} frames)")

            def switch_tab(tab_name):
                return page.evaluate(f"""(name) => {{
                    const tabs = Array.from(document.querySelectorAll('.controls-bar .tab'));
                    const target = tabs.find(t => t.textContent.includes(name));
                    if (target) {{
                        target.click();
                        return true;
                    }}
                    return false;
                }}""", tab_name)

            # =========================================================================
            # مرحله ۱: همون صفحه اول بدون باز شدن منو ها
            # =========================================================================
            print("\n--- Step 1: Initial Page (Menus closed) ---")
            page.evaluate("""() => {
                const el = document.querySelector('.text-canvas');
                if (el) el.innerText = 'فونت‌واو ۲.۰';
            }""")
            # Ensure bottom sheet is closed
            page.evaluate("""() => {
                const controls = document.querySelector('.controls');
                if (controls && !controls.classList.contains('is-closed')) {
                    const grab = document.querySelector('.controls-grab-bar');
                    if (grab) grab.click();
                }
            }""")
            page.wait_for_timeout(600)
            capture("1. Initial Canvas - Menus Closed", 3)

            # =========================================================================
            # مرحله ۲: باز شدن منو -> گردش توی منو ها -> فونت - استایل - جعبه متن
            # =========================================================================
            print("\n--- Step 2: Open Menu & Tour Tabs (Font -> Style -> Text Box) ---")
            # 2.1 باز شدن منو
            grab_bar = page.locator(".controls-grab-bar")
            if grab_bar.is_visible():
                grab_bar.click()
                page.wait_for_timeout(700)
            
            # تب ۱: فونت
            switch_tab("فونت")
            page.wait_for_timeout(600)
            # کمی اسکرول در لیست فونت‌ها برای نمایش تنوع فونت‌ها
            page.evaluate("""() => {
                const fontList = document.querySelector('.fonts-grid, .fonts-scroll-track, .fonts-list');
                if (fontList) fontList.scrollBy({ left: 120, behavior: 'smooth' });
            }""")
            page.wait_for_timeout(500)
            capture("2.1 Menu Tour - Font Tab", 3)

            # تب ۲: استایل
            switch_tab("استایل")
            page.wait_for_timeout(600)
            # کلیک روی یکی از افکت‌های نئونی/سایبر
            page.evaluate("""() => {
                const fxItems = Array.from(document.querySelectorAll('.effect-card, .fx-preset-card, .pill-tab'));
                const neon = fxItems.find(el => el.textContent.includes('نئون') || el.textContent.includes('سایبر')) || fxItems[1];
                if (neon) neon.click();
            }""")
            page.wait_for_timeout(600)
            capture("2.2 Menu Tour - Style & Neon Effects", 3)

            # تب ۳: جعبه متن
            switch_tab("جعبه متن")
            page.wait_for_timeout(600)
            # انتخاب یک استایل کادر شیشه‌ای / کریستال
            page.evaluate("""() => {
                const boxItems = document.querySelectorAll('.box-style-card, .box-style-btn');
                if (boxItems.length > 2) boxItems[2].click();
            }""")
            page.wait_for_timeout(600)
            capture("2.3 Menu Tour - Text Box Styles", 3)

            # =========================================================================
            # مرحله ۳: بخش پس زمینه رو یبار روشن و خاموش میکنی دیده بشه
            # =========================================================================
            print("\n--- Step 3: Background Tab - Toggle ON then OFF ---")
            switch_tab("پس‌زمینه")
            page.wait_for_timeout(600)

            # روشن کردن پس‌زمینه
            bg_switch = page.locator(".bg-switch-btn")
            if bg_switch.is_visible():
                bg_switch.click()
                page.wait_for_timeout(800)
                capture("3.1 Background Tab - Turned ON (Indigo Gradient & Drag Guide)", 3)

                # خاموش کردن مجدد پس‌زمینه
                bg_switch.click()
                page.wait_for_timeout(800)
                capture("3.2 Background Tab - Turned OFF (Transparent Canvas)", 3)
            else:
                capture("3. Background Tab", 3)

            # بستن دراور پایین برای تمیز شدن صفحه
            page.evaluate("""() => {
                const grab = document.querySelector('.controls-grab-bar');
                if (grab) grab.click();
            }""")
            page.wait_for_timeout(600)

            # =========================================================================
            # مرحله ۴: منو تنظیمات رو باز میکنی میبندی
            # =========================================================================
            print("\n--- Step 4: Open Settings Modal then Close ---")
            settings_btn = page.locator(".topbar .header-actions button[aria-label*='تنظیمات'], button[aria-label='تنظیمات'], button[title*='تنظیمات']").first
            if settings_btn.is_visible():
                settings_btn.click()
                page.wait_for_timeout(700)
                capture("4.1 Settings Modal - Open (v2.0, Dark Mode, Diagnostics)", 3)

                # بستن پنجره تنظیمات
                close_btn = page.locator(".sheet-header button[aria-label='close']").first
                if close_btn.is_visible():
                    close_btn.click()
                    page.wait_for_timeout(600)
                capture("4.2 Settings Modal - Closed", 2)
            else:
                print("Settings button not found directly, clicking via header action...")
                page.evaluate("""() => {
                    const btn = Array.from(document.querySelectorAll('.topbar button')).find(b => b.getAttribute('aria-label') === 'تنظیمات');
                    if (btn) btn.click();
                }""")
                page.wait_for_timeout(600)
                capture("4.1 Settings Modal - Open", 3)
                page.locator(".sheet-header button[aria-label='close']").first.click()
                page.wait_for_timeout(600)

            # =========================================================================
            # مرحله ۵: بخش ذخیره رو باز میکنی میبندی
            # =========================================================================
            print("\n--- Step 5: Open Save Modal then Close ---")
            save_btn = page.locator(".topbar .pill-btn").filter(has_text="ذخیره").first
            if not save_btn.is_visible():
                save_btn = page.locator(".topbar .pill-btn").first
            
            if save_btn.is_visible():
                save_btn.click()
                page.wait_for_timeout(700)
                capture("5.1 Save Modal - Open (High-Res 900px, Transparent, WebP/PNG)", 3)

                # بستن پنجره ذخیره
                close_save = page.locator(".sheet-header button[aria-label='close']").first
                if close_save.is_visible():
                    close_save.click()
                    page.wait_for_timeout(600)
                capture("5.2 Save Modal - Closed (Back to Studio Canvas)", 3)

            browser.close()

        print(f"\nAll 5 steps successfully captured ({frame_index - 1} frames). Encoding GIF with FFmpeg...")
        output_gif = os.path.join(root_dir, "docs", "tour-showcase.gif")
        public_gif = os.path.join(root_dir, "public", "docs", "tour-showcase.gif")

        # Compile GIF with smooth 1.3 fps so each step is clearly readable
        input_pattern = os.path.join(frames_dir, "frame_%03d.png")
        cmd = f'"{FFMPEG_PATH}" -y -framerate 1.3 -i "{input_pattern}" -vf "scale=400:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" "{output_gif}"'
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
