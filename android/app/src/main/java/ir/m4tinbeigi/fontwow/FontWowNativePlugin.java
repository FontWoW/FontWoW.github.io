package ir.m4tinbeigi.fontwow;

import android.Manifest;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Intent;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

import androidx.annotation.RequiresApi;
import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;

/**
 * Image saving + clipboard for FontWoW.
 *
 * Replaces @capacitor-community/media (whose savePhoto() hard-requires an albumIdentifier)
 * and @capacitor/clipboard (whose Android write() only ever produces plain text, so an
 * {image: dataUrl} call silently pasted a base64 string).
 *
 * Every @PluginMethod body is fully guarded: an exception escaping into Capacitor's plugin
 * executor is rethrown as a RuntimeException on a HandlerThread, which kills the process.
 */
@CapacitorPlugin(
    name = "FontWowNative",
    permissions = {
        // Only ever requested on API < 29; on newer releases MediaStore needs no permission,
        // and the manifest caps this permission at maxSdkVersion=28 anyway.
        @Permission(strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE }, alias = "legacyStorage")
    }
)
public class FontWowNativePlugin extends Plugin {

    private static final String ALBUM = "FontWoW";
    private static final String MIME = "image/png";

    @PluginMethod
    public void saveImage(PluginCall call) {
        byte[] bytes = decodeOrReject(call);
        if (bytes == null) return;

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                saveViaMediaStore(call, bytes);
                return;
            }
            if (getPermissionState("legacyStorage") != PermissionState.GRANTED) {
                requestPermissionForAlias("legacyStorage", call, "legacyStorageCallback");
                return;
            }
            saveViaLegacyFile(call, bytes);
        } catch (Exception e) {
            call.reject("Saving the image failed: " + e.getMessage(), e);
        }
    }

    @PermissionCallback
    private void legacyStorageCallback(PluginCall call) {
        if (getPermissionState("legacyStorage") != PermissionState.GRANTED) {
            call.reject("Storage permission was denied");
            return;
        }
        byte[] bytes = decodeOrReject(call);
        if (bytes == null) return;
        try {
            saveViaLegacyFile(call, bytes);
        } catch (Exception e) {
            call.reject("Saving the image failed: " + e.getMessage(), e);
        }
    }

    /** API 29+: scoped storage, no runtime permission required. */
    @RequiresApi(Build.VERSION_CODES.Q)
    private void saveViaMediaStore(PluginCall call, byte[] bytes) {
        ContentResolver resolver = getContext().getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.Images.Media.DISPLAY_NAME, fileName(call));
        values.put(MediaStore.Images.Media.MIME_TYPE, MIME);
        values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/" + ALBUM);
        values.put(MediaStore.Images.Media.IS_PENDING, 1);

        Uri uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
        if (uri == null) {
            call.reject("Could not create a gallery entry");
            return;
        }

        try (OutputStream out = resolver.openOutputStream(uri)) {
            if (out == null) throw new IOException("openOutputStream returned null");
            out.write(bytes);
        } catch (Exception e) {
            resolver.delete(uri, null, null);
            call.reject("Writing the image failed: " + e.getMessage(), e);
            return;
        }

        // Publish the entry so it appears in the gallery.
        // Some OEM ROMs (Samsung One UI, Xiaomi HyperOS) return 0 on single-item updates or throw
        // non-fatal provider warnings; we must never delete successfully written bytes.
        values.clear();
        values.put(MediaStore.Images.Media.IS_PENDING, 0);
        try {
            resolver.update(uri, values, null, null);
        } catch (Exception ignored) {
            // Row is already written to disk, do not treat provider update quirks as fatal.
        }

        JSObject result = new JSObject();
        result.put("uri", uri.toString());
        call.resolve(result);
    }

    /** API 24-28: write into the public Pictures dir and tell the media scanner about it. */
    private void saveViaLegacyFile(PluginCall call, byte[] bytes) {
        File dir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), ALBUM);
        if (!dir.exists() && !dir.mkdirs()) {
            call.reject("Could not create the album directory");
            return;
        }

        File target = new File(dir, fileName(call));
        try (OutputStream out = new FileOutputStream(target)) {
            out.write(bytes);
        } catch (Exception e) {
            call.reject("Writing the image failed: " + e.getMessage(), e);
            return;
        }

        MediaScannerConnection.scanFile(getContext(), new String[] { target.getAbsolutePath() }, new String[] { MIME }, null);

        JSObject result = new JSObject();
        result.put("uri", Uri.fromFile(target).toString());
        call.resolve(result);
    }

    /**
     * Puts a real PNG on the clipboard as a content:// URI. ClipboardService grants read access
     * on the owner's behalf when another app reads the primary clip, so the FileProvider can
     * stay android:exported="false".
     */
    @PluginMethod
    public void copyImage(PluginCall call) {
        byte[] bytes = decodeOrReject(call);
        if (bytes == null) return;

        try {
            File dir = new File(getContext().getCacheDir(), "clipboard");
            if (!dir.exists() && !dir.mkdirs()) {
                call.reject("Could not create the clipboard cache directory");
                return;
            }

            // A fresh name per copy, because receivers commonly cache by URI and would
            // otherwise paste the previous image.
            File target = new File(dir, fileName(call));
            try (OutputStream out = new FileOutputStream(target)) {
                out.write(bytes);
            } catch (Exception e) {
                call.reject("Writing the image failed: " + e.getMessage(), e);
                return;
            }

            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", target);

            ClipboardManager clipboard = (ClipboardManager) getContext().getSystemService(Context.CLIPBOARD_SERVICE);
            if (clipboard == null) {
                call.reject("Clipboard is unavailable");
                return;
            }

            // Built by hand rather than via ClipData.newUri: that helper also advertises
            // text/uri-list, which makes text fields paste the content:// URI as a string —
            // a milder version of the base64-text bug this replaces.
            ClipData clip = new ClipData(ALBUM, new String[] { MIME }, new ClipData.Item(uri));
            clipboard.setPrimaryClip(clip);

            // setPrimaryClip is void and is silently dropped when the app lacks window focus,
            // so confirm the clip actually landed instead of reporting a phantom success.
            ClipData current = clipboard.getPrimaryClip();
            Uri actual = (current != null && current.getItemCount() > 0) ? current.getItemAt(0).getUri() : null;
            if (!uri.equals(actual)) {
                call.reject("The system dropped the clipboard write");
                return;
            }

            // Prune only now, and never the file the live clip points at.
            File[] stale = dir.listFiles();
            if (stale != null) {
                for (File f : stale) {
                    if (f.isFile() && !f.equals(target)) f.delete();
                }
            }

            JSObject result = new JSObject();
            result.put("uri", uri.toString());
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Copying the image failed: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void openUrl(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.trim().isEmpty()) {
            call.reject("URL is missing");
            return;
        }
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not open URL: " + e.getMessage(), e);
        }
    }

    private String fileName(PluginCall call) {
        String name = call.getString("fileName");
        if (name == null || name.trim().isEmpty()) name = "fontwow.png";
        // Strip any path and anything MediaStore would choke on.
        name = new File(name).getName().replaceAll("[^A-Za-z0-9._-]", "_");
        if (name.isEmpty()) name = "fontwow.png";
        if (!name.toLowerCase().endsWith(".png")) name = name + ".png";
        return name;
    }

    /** Accepts either a bare base64 payload or a full data: URL. Rejects the call on failure. */
    private byte[] decodeOrReject(PluginCall call) {
        String data = call.getString("data");
        if (data == null || data.isEmpty()) {
            call.reject("No image data was supplied");
            return null;
        }
        int comma = data.indexOf(',');
        if (data.startsWith("data:") && comma >= 0) {
            data = data.substring(comma + 1);
        }
        try {
            byte[] bytes = Base64.decode(data, Base64.DEFAULT);
            if (bytes == null || bytes.length == 0) {
                call.reject("The decoded image data was empty");
                return null;
            }
            return bytes;
        } catch (IllegalArgumentException e) {
            call.reject("The image data was not valid base64", e);
            return null;
        }
    }
}
