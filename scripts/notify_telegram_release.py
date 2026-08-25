#!/usr/bin/env python3
"""
Notify FontWoW Telegram Channel on New Release
Sends release notes, APK download link, and discussion links.
"""

import os
import sys
import json
import urllib.request
import urllib.parse

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "@FontWoW_app")

def send_telegram_message(text, bot_token, chat_id, reply_markup=None):
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "Markdown",
        "disable_web_page_preview": False
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"Failed to send Telegram message: {e}", file=sys.stderr)
        return None

def main():
    version = os.getenv("APP_VERSION", "latest")
    apk_name = os.getenv("APK_NAME", "")
    release_notes_file = os.getenv("RELEASE_NOTES_PATH", "release-notes.txt")
    
    notes = ""
    if os.path.exists(release_notes_file):
        with open(release_notes_file, "r", encoding="utf-8") as f:
            notes = f.read().strip()

    if not TELEGRAM_BOT_TOKEN:
        print("TELEGRAM_BOT_TOKEN not provided, skipping channel broadcast.")
        return

    text = f"🚀 **نسخه جدید FontWoW منتشر شد: v{version}**\n\n"
    if notes:
        # Keep notes concise for telegram if long
        truncated_notes = notes[:1200] + ("..." if len(notes) > 1200 else "")
        text += f"📝 **تغییرات این نسخه:**\n{truncated_notes}\n\n"
    
    text += "✨ **لینک‌ها و دسترسی سریع:**\n"
    text += "🌐 نسخه تحت وب: https://fontwow.github.io\n"
    text += "💬 برای ثبت نظر، پیشنهاد یا گزارش باگ روی کامنت‌های همین پست بزنید."

    keyboard = {
        "inline_keyboard": [
            [
                {"text": "🌐 باز کردن نسخه وب", "url": "https://fontwow.github.io"},
                {"text": "📱 دانلود مستقیم APK", "url": "https://github.com/FontWoW/FontWoW.github.io/releases/tag/latest"}
            ],
            [
                {"text": "💬 گروه گفتگو و نظرات", "url": "https://t.me/+IAzR2ntpvNVkMWI0"},
                {"text": "⭐ ستاره در گیت‌هاب", "url": "https://github.com/FontWoW/FontWoW.github.io"}
            ]
        ]
    }

    res = send_telegram_message(text, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, reply_markup=keyboard)
    if res and res.get("ok"):
        print("Telegram release announcement sent successfully!")
    else:
        print(f"Error response: {res}")

if __name__ == "__main__":
    main()
