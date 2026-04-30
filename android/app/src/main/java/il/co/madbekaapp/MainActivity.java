package il.co.madbekaapp;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

/**
 * Single Activity for the Madbeka Android app — wraps the Capacitor
 * WebView. Plugins registered here are exposed as `Capacitor.Plugins.X`
 * to the web bundle that runs inside.
 *
 * --- Fix: triggerEvent race condition ---
 * Capacitor's native Bridge calls window.Capacitor.triggerEvent() via
 * evaluateJavascript() during Activity lifecycle callbacks (onResume, etc.).
 * When server.url points to a remote host (https://www.madbekaapp.co.il),
 * there is a race on first launch: the Activity fires onResume before the
 * remote page has finished loading, so window.Capacitor is still undefined
 * and the eval throws:
 *
 *   TypeError: Cannot read properties of undefined (reading 'triggerEvent')
 *
 * This crashes the WebView render process and causes the black screen.
 *
 * Fix: register a WebViewListener (the official Capacitor 8 API) that
 * injects a minimal stub into the page at onPageStarted — the earliest
 * moment JS can run, before any page scripts. The stub provides no-op
 * implementations of the Capacitor surface that native code may call
 * before the real native-bridge.js has had a chance to execute. Once the
 * page finishes loading, native-bridge.js overwrites window.Capacitor with
 * the real object; the stub is gone.
 *
 * We use getBridge().addWebViewListener() instead of setWebViewClient() to
 * avoid replacing Capacitor's own BridgeWebViewClient (which handles URL
 * interception, cookie bridging, etc.).
 */
public class MainActivity extends BridgeActivity {

    /**
     * Minimal window.Capacitor stub injected before the page's own JS runs.
     *
     * Only installs if window.Capacitor.triggerEvent is not already a
     * function — so if native-bridge.js somehow ran first (hot reload, etc.)
     * we leave the real object untouched.
     *
     * Events fired against the stub are silently dropped. This is safe:
     * the only events Capacitor fires this early on cold start are
     * low-priority lifecycle signals (appStateChange) whose loss on the
     * very first frame has no user-visible effect.
     */
    private static final String CAPACITOR_GUARD_JS =
        "(function() {" +
        "  var cap = window.Capacitor;" +
        "  if (cap && typeof cap.triggerEvent === 'function') return;" +
        "  window.Capacitor = cap || {};" +
        "  var noop = function() { return false; };" +
        "  var noopP = function() { return Promise.resolve({}); };" +
        "  window.Capacitor.triggerEvent    = cap && cap.triggerEvent    || noop;" +
        "  window.Capacitor.logJs           = cap && cap.logJs           || noop;" +
        "  window.Capacitor.fromNative      = cap && cap.fromNative      || noop;" +
        "  window.Capacitor.nativeCallback  = cap && cap.nativeCallback  || noop;" +
        "  window.Capacitor.nativePromise   = cap && cap.nativePromise   || noopP;" +
        "})();";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register the WhatsApp Sticker Pack bridge before the WebView
        // initializes so the JS-side `MadbekaSticker` global is ready
        // by the time the editor mounts.
        registerPlugin(MadbekaStickerPlugin.class);
        super.onCreate(savedInstanceState);

        // Install the guard after super.onCreate() so getBridge() is ready.
        getBridge().addWebViewListener(new WebViewListener() {
            @Override
            public void onPageStarted(WebView webView) {
                // Inject guard before any page JS runs. evaluateJavascript
                // on a freshly-started page executes synchronously in the
                // renderer before it processes any downloaded scripts.
                webView.evaluateJavascript(CAPACITOR_GUARD_JS, null);
            }
        });
    }
}
