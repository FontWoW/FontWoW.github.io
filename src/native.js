import { Capacitor, registerPlugin } from '@capacitor/core'

const isNative = () => Capacitor.isNativePlatform()

// Implemented in android/app/src/main/java/ir/m4tinbeigi/fontwow/FontWowNativePlugin.java.
// @capacitor-community/media can't be used for saving (its Android savePhoto() rejects with
// "Album identifier required"), and @capacitor/clipboard can't be used for images (its Android
// write() only ever produces plain text, so {image} pasted a base64 string).
const FontWowNative = registerPlugin('FontWowNative')

function dataUrlToBase64(dataUrl) {
  return dataUrl.substring(dataUrl.indexOf(',') + 1)
}

function describe(err) {
  return err?.message || String(err ?? 'unknown error')
}

export async function saveImageNative(dataUrl, fileName) {
  await FontWowNative.saveImage({ data: dataUrlToBase64(dataUrl), fileName })
}

export async function shareFileNative(data, fileName) {
  const { Filesystem, Directory } = await import('@capacitor/filesystem')
  const { Share } = await import('@capacitor/share')
  const file = await Filesystem.writeFile({ path: fileName, data, directory: Directory.Cache })
  await Share.share({ url: file.uri })
}

/**
 * Returns 'clipboard' when the image is really on the clipboard, 'shared' when we fell back to
 * the share sheet, or 'canceled' when the user dismissed that sheet themselves.
 */
export async function copyImageNative(dataUrl, fileName) {
  const base64 = dataUrlToBase64(dataUrl)
  let clipboardErr
  try {
    await FontWowNative.copyImage({ data: base64, fileName })
    return 'clipboard'
  } catch (err) {
    // Some ROMs restrict clipboard content URIs; offer the share sheet so the image still gets out.
    clipboardErr = err
    console.warn('clipboard copy failed, falling back to share:', err)
  }

  const { Filesystem, Directory } = await import('@capacitor/filesystem')
  const { Share } = await import('@capacitor/share')
  try {
    const tmp = await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache })
    await Share.share({ url: tmp.uri })
    return 'shared'
  } catch (err) {
    // Capacitor's Share plugin rejects with "Share canceled" when the user backs out — that is
    // not a failure, and must not trigger the copy-the-text-instead fallback.
    if (/cancel/i.test(describe(err))) return 'canceled'
    throw new Error(`${describe(err)} (clipboard: ${describe(clipboardErr)})`)
  }
}

export async function copyTextNative(text) {
  const { Clipboard } = await import('@capacitor/clipboard')
  await Clipboard.write({ string: text })
}

export async function openExternalUrl(url) {
  if (isNative()) {
    try {
      await FontWowNative.openUrl({ url })
    } catch (err) {
      console.warn('native openUrl failed, falling back to window.open:', err)
      window.open(url, '_system')
    }
  } else {
    window.open(url, '_blank')
  }
}

export { isNative }
