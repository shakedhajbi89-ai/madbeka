package il.co.madbekaapp;

import android.content.Intent;
import android.util.Base64;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

/**
 * Capacitor plugin that bridges the web app to WhatsApp's Sticker Pack
 * API. Exposed to JS as `MadbekaSticker`.
 *
 * Flow when the user taps "Add to WhatsApp" in the editor:
 *   1. JS encodes every sticker the user has created (.webp bytes,
 *      base64) and calls addToWhatsApp({...}).
 *   2. We decode each sticker and write it to internal storage under
 *      /files/stickers/<packId>/<stickerId>.webp.
 *   3. We persist the pack metadata (name, sticker list, emojis) as
 *      JSON next to the assets so {@link MadbekaStickerContentProvider}
 *      can serve it back to WhatsApp on demand.
 *   4. We fire the ENABLE_STICKER_PACK Intent. WhatsApp opens, asks
 *      the user "Add this pack?", and on confirm the pack joins their
 *      sticker library.
 *
 * The Intent's authority must match the one declared in
 * AndroidManifest.xml for our ContentProvider — keep them in sync via
 * the static AUTHORITY constant.
 */
@CapacitorPlugin(name = "MadbekaSticker")
public class MadbekaStickerPlugin extends Plugin {

    /** Must equal the `android:authorities` of MadbekaStickerContentProvider in the Manifest. */
    public static final String AUTHORITY = "il.co.madbekaapp.stickercontentprovider";

    /** WhatsApp's documented Intent action for adding a third-party pack. */
    private static final String INTENT_ACTION =
            "com.whatsapp.intent.action.ENABLE_STICKER_PACK";

    /** Identifier code passed back to onActivityResult. */
    private static final int REQUEST_ADD_PACK = 200;

    @PluginMethod
    public void addToWhatsApp(PluginCall call) {
        String packId = call.getString("packId");
        String packName = call.getString("packName");
        JSArray stickers = call.getArray("stickers");
        String trayIconBytes = call.getString("trayIconBytes");

        if (packId == null || packName == null || stickers == null || trayIconBytes == null) {
            call.reject("Missing required field (packId, packName, stickers, trayIconBytes).");
            return;
        }
        if (stickers.length() < 3) {
            // WhatsApp's spec requires ≥3 stickers per pack.
            call.reject("WhatsApp requires at least 3 stickers in a pack.");
            return;
        }

        try {
            File packDir = new File(getContext().getFilesDir(), "stickers/" + packId);
            if (!packDir.exists() && !packDir.mkdirs()) {
                call.reject("Failed to create pack directory.");
                return;
            }

            // Persist tray icon as 'tray.webp'.
            writeBase64ToFile(trayIconBytes, new File(packDir, "tray.webp"));

            // Persist each sticker. The id-mapped filename also goes
            // into the pack manifest so the ContentProvider can list
            // them in order.
            JSONObject manifest = new JSONObject();
            manifest.put("identifier", packId);
            manifest.put("name", packName);
            manifest.put("publisher", "Madbeka");
            manifest.put("publisher_email", "madbekaapp@gmail.com");
            manifest.put("publisher_website", "https://madbekaapp.co.il");
            manifest.put("privacy_policy_website", "https://madbekaapp.co.il/privacy");
            manifest.put("license_agreement_website", "https://madbekaapp.co.il/terms");
            manifest.put("tray_image_file", "tray.webp");
            manifest.put("animated_sticker_pack", false);

            org.json.JSONArray manifestStickers = new org.json.JSONArray();
            for (int i = 0; i < stickers.length(); i++) {
                JSONObject sticker = stickers.getJSONObject(i);
                String stickerId = sticker.getString("id");
                String bytes = sticker.getString("bytes");
                org.json.JSONArray emojis = sticker.optJSONArray("emoji");
                if (emojis == null) {
                    emojis = new org.json.JSONArray();
                    emojis.put("🔥");
                }

                String fileName = stickerId + ".webp";
                writeBase64ToFile(bytes, new File(packDir, fileName));

                JSONObject manifestSticker = new JSONObject();
                manifestSticker.put("image_file", fileName);
                manifestSticker.put("emojis", emojis);
                manifestStickers.put(manifestSticker);
            }
            manifest.put("stickers", manifestStickers);

            // Save manifest.json — the ContentProvider reads this.
            File manifestFile = new File(packDir, "manifest.json");
            FileOutputStream fos = new FileOutputStream(manifestFile);
            try {
                fos.write(manifest.toString().getBytes("UTF-8"));
            } finally {
                fos.close();
            }

            // Fire the WhatsApp Intent. We use startActivityForResult so
            // we can plumb the result back to the JS caller.
            Intent intent = new Intent();
            intent.setAction(INTENT_ACTION);
            intent.putExtra("sticker_pack_id", packId);
            intent.putExtra("sticker_pack_authority", AUTHORITY);
            intent.putExtra("sticker_pack_name", packName);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            saveCall(call);
            startActivityForResult(call, intent, REQUEST_ADD_PACK);

        } catch (JSONException | IOException e) {
            call.reject("Failed to prepare sticker pack: " + e.getMessage(), e);
        } catch (Exception e) {
            // Most likely WhatsApp not installed.
            call.reject(
                    "WhatsApp may not be installed. " + e.getMessage(),
                    e
            );
        }
    }

    /**
     * Decode a base64 string and write it to a file.
     * The JS side strips any `data:image/webp;base64,` prefix before
     * sending so we get a clean payload.
     */
    private void writeBase64ToFile(String base64, File outFile) throws IOException {
        byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
        FileOutputStream fos = new FileOutputStream(outFile);
        try {
            fos.write(bytes);
        } finally {
            fos.close();
        }
    }

    /**
     * Capacitor 5+ result handler. WhatsApp sets the result code based
     * on whether the user accepted or dismissed the pack-add dialog.
     */
    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);
        if (requestCode != REQUEST_ADD_PACK) return;

        PluginCall savedCall = getSavedCall();
        if (savedCall == null) return;

        JSObject ret = new JSObject();
        if (resultCode == android.app.Activity.RESULT_OK) {
            ret.put("status", "added");
        } else if (resultCode == android.app.Activity.RESULT_CANCELED) {
            ret.put("status", "cancelled");
        } else {
            ret.put("status", "error");
            ret.put("message", "Unexpected result code: " + resultCode);
        }
        savedCall.resolve(ret);
    }
}
