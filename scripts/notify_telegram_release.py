#!/usr/bin/env python3
"""
Notify FontWoW Telegram Channel on New Release
Uploads APK document directly to the channel with changelog and quick buttons.
"""

import os
import sys
import json
import urllib.request
import urllib.parse
import mimetypes

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "@FontWoW_app")

def send_telegram_document(apk_path, caption, bot_token, chat_id, reply_markup=None):
    url = f"https://api.telegram.org/bot{bot_token}/sendDocument"
    boundary = "----WebKitFormBoundaryFontWoWRelease"
    
    body = bytearray()
    
    def add_field(name, value):
        nonlocal body
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode("utf-8"))
        body.extend(f"{value}\r\n".encode("utf-8"))

    add_field("chat_id", chat_id)
    add_field("caption", caption)
    add_field("parse_mode", "Markdown")
    if reply_markup:
        add_field("reply_markup", json.dumps(reply_markup))

    filename = os.path.basename(apk_path)
    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(f'Content-Disposition: form-data; name="document"; filename="{filename}"\r\n'.encode("utf-8"))
    body.extend(b"Content-Type: application/vnd.android.package-archive\r\n\r\n")
    with open(apk_path, "rb") as f:
        body.extend(f.read())
    body.extend(b"\r\n")
    body.extend(f"--{boundary}--\r\n".encode("utf-8"))

    req = urllib.request.Request(
        url,
        data=bytes(body),
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}"
        }
    )
    
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"Failed to upload document to Telegram: {e}", file=sys.stderr)
        return None

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
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"Failed to send Telegram message: {e}", file=sys.stderr)
        return None

def main():
    version = os.getenv("APP_VERSION", "latest")
    apk_path = os.getenv("APK_PATH", "")
    release_notes_file = os.getenv("RELEASE_NOTES_PATH", "release-notes.txt")
    
    notes = ""
    if os.path.exists(release_notes_file):
        with open(release_notes_file, "r", encoding="utf-8") as f:
            notes = f.read().strip()

    if not TELEGRAM_BOT_TOKEN:
        print("TELEGRAM_BOT_TOKEN not provided, skipping Telegram publication.")
        return

    text = f"🚀 **نسخه جدید FontWoW منتشر شد: v{version}**\n\n"
    if notes:
        # Keep notes concise for telegram caption limit (1024 chars max for caption)
        clean_notes = notes.replace("#", "").strip()
        truncated_notes = clean_notes[:500] + ("..." if len(clean_notes) > 500 else "")
        text += f"📝 **تغییرات:**\n{truncated_notes}\n\n"
    
    text += "✨ **لینک‌ها و دسترسی سریع:**\n"
    text += "🌐 نسخه تحت وب: https://fontwow.github.io\n"
    text += "💬 برای ثبت نظر، پیشنهاد یا گزارش باگ روی کامنت‌های همین پست بزنید."

    keyboard = {
        "inline_keyboard": [
            [
                {"text": "🌐 باز کردن نسخه وب", "url": "https://fontwow.github.io"},
                {"text": "📱 دانلود مستقیم از گیت‌هاب", "url": "https://github.com/FontWoW/FontWoW.github.io/releases/tag/latest"}
            ],
            [
                {"text": "💬 گروه گفتگو و نظرات", "url": "https://t.me/+IAzR2ntpvNVkMWI0"},
                {"text": "⭐ ستاره در گیت‌هاب", "url": "https://github.com/FontWoW/FontWoW.github.io"}
            ]
        ]
    }

    # If APK exists, send APK directly with caption
    if apk_path and os.path.exists(apk_path):
        print(f"Uploading APK file {apk_path} to channel...")
        res = send_telegram_document(apk_path, text, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, reply_markup=keyboard)
        if res and res.get("ok"):
            print("Telegram release APK and message uploaded successfully!")
            return
        else:
            print(f"Document upload failed: {res}, falling back to message...")

    # Fallback to message
    res = send_telegram_message(text, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, reply_markup=keyboard)
    if res and res.get("ok"):
        print("Telegram release announcement message sent successfully!")
    else:
        print(f"Error response: {res}")

if __name__ == "__main__":
    main()
