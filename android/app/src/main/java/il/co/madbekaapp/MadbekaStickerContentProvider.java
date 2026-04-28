package il.co.madbekaapp;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.UriMatcher;
import android.content.res.AssetFileDescriptor;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Serves sticker pack metadata + asset bytes to WhatsApp on demand.
 *
 * WhatsApp queries this provider after the user accepts the
 * "Add this pack?" dialog fired by {@link MadbekaStickerPlugin}. The
 * provider reads packs from internal storage where the plugin saved
 * them; each pack lives under /files/stickers/<pack_id>/ with a
 * manifest.json + per-sticker .webp files + a tray.webp.
 *
 * URI layout (per WhatsApp's spec):
 *   content://AUTHORITY/metadata
 *     → all packs as one cursor row each
 *   content://AUTHORITY/metadata/{pack_id}
 *     → single pack as one row
 *   content://AUTHORITY/stickers/{pack_id}
 *     → one row per sticker in the pack (image_file, emojis)
 *   content://AUTHORITY/stickers_asset/{pack_id}/{file_name}
 *     → raw .webp bytes (called via openAssetFile, not query)
 */
public class MadbekaStickerContentProvider extends ContentProvider {

    /** Must equal {@link MadbekaStickerPlugin#AUTHORITY}. */
    private static final String AUTHORITY = "il.co.madbekaapp.stickercontentprovider";

    private static final String METADATA = "metadata";
    private static final String STICKERS = "stickers";
    private static final String STICKERS_ASSET = "stickers_asset";

    private static final int CODE_ALL_PACKS = 1;
    private static final int CODE_ONE_PACK = 2;
    private static final int CODE_STICKERS_OF_PACK = 3;
    private static final int CODE_STICKER_ASSET = 4;

    private static final UriMatcher MATCHER = new UriMatcher(UriMatcher.NO_MATCH);
    static {
        MATCHER.addURI(AUTHORITY, METADATA, CODE_ALL_PACKS);
        MATCHER.addURI(AUTHORITY, METADATA + "/*", CODE_ONE_PACK);
        MATCHER.addURI(AUTHORITY, STICKERS + "/*", CODE_STICKERS_OF_PACK);
        MATCHER.addURI(AUTHORITY, STICKERS_ASSET + "/*/*", CODE_STICKER_ASSET);
    }

    @Override
    public boolean onCreate() {
        return true;
    }

    @Override
    public Cursor query(
            @NonNull Uri uri,
            @Nullable String[] projection,
            @Nullable String selection,
            @Nullable String[] selectionArgs,
            @Nullable String sortOrder
    ) {
        switch (MATCHER.match(uri)) {
            case CODE_ALL_PACKS:
                return buildPacksCursor(loadAllPacks());
            case CODE_ONE_PACK: {
                String packId = uri.getLastPathSegment();
                JSONObject pack = loadPack(packId);
                List<JSONObject> packs = new ArrayList<>();
                if (pack != null) packs.add(pack);
                return buildPacksCursor(packs);
            }
            case CODE_STICKERS_OF_PACK: {
                String packId = uri.getLastPathSegment();
                return buildStickersCursor(loadPack(packId));
            }
            default:
                throw new IllegalArgumentException("Unsupported URI: " + uri);
        }
    }

    @Override
    @Nullable
    public AssetFileDescriptor openAssetFile(@NonNull Uri uri, @NonNull String mode)
            throws FileNotFoundException {
        if (MATCHER.match(uri) != CODE_STICKER_ASSET) {
            return super.openAssetFile(uri, mode);
        }
        List<String> segs = uri.getPathSegments();
        // /stickers_asset/{packId}/{file}
        if (segs.size() < 3) throw new FileNotFoundException("Bad asset URI: " + uri);
        String packId = segs.get(1);
        String fileName = segs.get(2);

        File ctxDir = getContext() != null ? getContext().getFilesDir() : null;
        if (ctxDir == null) throw new FileNotFoundException("No app context.");
        File f = new File(ctxDir, "stickers/" + packId + "/" + fileName);
        if (!f.exists()) throw new FileNotFoundException(f.getAbsolutePath());

        ParcelFileDescriptor pfd = ParcelFileDescriptor.open(f, ParcelFileDescriptor.MODE_READ_ONLY);
        return new AssetFileDescriptor(pfd, 0, AssetFileDescriptor.UNKNOWN_LENGTH);
    }

    @Override
    @Nullable
    public String getType(@NonNull Uri uri) {
        switch (MATCHER.match(uri)) {
            case CODE_ALL_PACKS:
            case CODE_ONE_PACK:
            case CODE_STICKERS_OF_PACK:
                return "vnd.android.cursor.dir/vnd." + AUTHORITY + "." + METADATA;
            case CODE_STICKER_ASSET:
                return "image/webp";
            default:
                return null;
        }
    }

    // Inserts / updates / deletes are not supported — packs are managed
    // exclusively via the plugin which writes to internal storage.
    @Override
    public Uri insert(@NonNull Uri uri, @Nullable ContentValues v) { throw new UnsupportedOperationException(); }
    @Override
    public int delete(@NonNull Uri uri, @Nullable String s, @Nullable String[] a) { throw new UnsupportedOperationException(); }
    @Override
    public int update(@NonNull Uri uri, @Nullable ContentValues v, @Nullable String s, @Nullable String[] a) { throw new UnsupportedOperationException(); }

    /* ───────────── pack loading + cursor packing ───────────── */

    private List<JSONObject> loadAllPacks() {
        List<JSONObject> packs = new ArrayList<>();
        if (getContext() == null) return packs;
        File root = new File(getContext().getFilesDir(), "stickers");
        File[] dirs = root.listFiles();
        if (dirs == null) return packs;
        for (File dir : dirs) {
            if (!dir.isDirectory()) continue;
            JSONObject pack = readManifest(new File(dir, "manifest.json"));
            if (pack != null) packs.add(pack);
        }
        return packs;
    }

    @Nullable
    private JSONObject loadPack(String packId) {
        if (getContext() == null) return null;
        File f = new File(getContext().getFilesDir(), "stickers/" + packId + "/manifest.json");
        return readManifest(f);
    }

    @Nullable
    private JSONObject readManifest(File f) {
        if (!f.exists()) return null;
        try (BufferedReader r = new BufferedReader(new FileReader(f))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = r.readLine()) != null) sb.append(line);
            return new JSONObject(sb.toString());
        } catch (IOException | JSONException e) {
            return null;
        }
    }

    /** Columns expected by WhatsApp on the pack metadata cursor. */
    private static final String[] PACK_COLUMNS = new String[] {
            "sticker_pack_identifier",
            "sticker_pack_name",
            "sticker_pack_publisher",
            "sticker_pack_icon",
            "android_play_store_link",
            "ios_app_store_link",
            "sticker_pack_publisher_email",
            "sticker_pack_publisher_website",
            "sticker_pack_privacy_policy_website",
            "sticker_pack_license_agreement_website",
            "image_data_version",
            "whatsapp_will_not_cache_stickers",
            "animated_sticker_pack",
    };

    private Cursor buildPacksCursor(List<JSONObject> packs) {
        MatrixCursor c = new MatrixCursor(PACK_COLUMNS);
        for (JSONObject p : packs) {
            c.addRow(new Object[] {
                    p.optString("identifier"),
                    p.optString("name"),
                    p.optString("publisher"),
                    p.optString("tray_image_file"),
                    "https://play.google.com/store/apps/details?id=il.co.madbekaapp",
                    "", // no iOS app
                    p.optString("publisher_email"),
                    p.optString("publisher_website"),
                    p.optString("privacy_policy_website"),
                    p.optString("license_agreement_website"),
                    "1", // bump when stickers change to invalidate WhatsApp cache
                    0,
                    p.optBoolean("animated_sticker_pack") ? 1 : 0,
            });
        }
        return c;
    }

    private Cursor buildStickersCursor(@Nullable JSONObject pack) {
        MatrixCursor c = new MatrixCursor(new String[] { "image_file", "emojis" });
        if (pack == null) return c;
        JSONArray stickers = pack.optJSONArray("stickers");
        if (stickers == null) return c;
        for (int i = 0; i < stickers.length(); i++) {
            JSONObject s = stickers.optJSONObject(i);
            if (s == null) continue;
            c.addRow(new Object[] {
                    s.optString("image_file"),
                    s.optJSONArray("emojis") != null ? s.optJSONArray("emojis").toString() : "[]",
            });
        }
        return c;
    }
}
