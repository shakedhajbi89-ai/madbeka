package il.co.madbekaapp;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

/**
 * Single Activity for the Madbeka Android app — wraps the Capacitor
 * WebView. Plugins registered here are exposed as `Capacitor.Plugins.X`
 * to the web bundle that runs inside.
 */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register the WhatsApp Sticker Pack bridge before the WebView
        // initializes so the JS-side `MadbekaSticker` global is ready
        // by the time the editor mounts.
        registerPlugin(MadbekaStickerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
