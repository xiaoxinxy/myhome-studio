package cn.privatehome.courtyard;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.JsResult;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;
import org.json.JSONObject;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/** Offline Android host. Only packaged assets can load; no network permission. */
public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String HOME = "https://" + HOST + "/index.html";
    private static final int IMPORT_REQUEST = 101;
    private static final int EXPORT_REQUEST = 102;
    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private byte[] pendingData;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(248, 249, 245));
        webView = new WebView(this);
        root.addView(webView, new FrameLayout.LayoutParams(-1, -1));
        // Android 15 enforces edge-to-edge. Keep UI clear of cutouts/system bars.
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets.consumeSystemWindowInsets();
        });
        setContentView(root);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true); // Android document picker supplies content URIs.
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSupportMultipleWindows(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setBuiltInZoomControls(false);
        WebView.setWebContentsDebuggingEnabled(false);
        webView.addJavascriptInterface(new FileBridge(), "HomeAndroid");
        webView.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String path = uri.getPath();
                if (!"https".equals(uri.getScheme()) || !HOST.equals(uri.getHost()) || path == null
                        || path.contains("..") || path.contains("\\") || !"GET".equals(request.getMethod())) {
                    return errorResponse(403, "Forbidden");
                }
                if (path.equals("/")) path = "/index.html";
                String mime = mimeType(path);
                try {
                    Map<String, String> headers = new HashMap<>();
                    headers.put("Cache-Control", "no-cache");
                    headers.put("X-Content-Type-Options", "nosniff");
                    headers.put("Content-Security-Policy", "default-src 'self' data: blob:; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; frame-src 'none'");
                    return new WebResourceResponse(mime, "UTF-8", 200, "OK", headers,
                        getAssets().open("web/" + path.substring(1)));
                } catch (IOException exception) {
                    return errorResponse(404, "Not Found");
                }
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                // A native bridge is exposed only to our packaged application.
                return !"https".equals(uri.getScheme()) || !HOST.equals(uri.getHost());
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                    FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent picker = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                picker.addCategory(Intent.CATEGORY_OPENABLE);
                picker.setType("*/*");
                picker.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"application/json", "text/plain", "application/octet-stream"});
                try { startActivityForResult(picker, IMPORT_REQUEST); }
                catch (ActivityNotFoundException e) {
                    callback.onReceiveValue(null); fileCallback = null;
                    Toast.makeText(MainActivity.this, "未找到系统文件选择器", Toast.LENGTH_LONG).show();
                }
                return true;
            }
            @Override public boolean onJsConfirm(WebView view, String url, String message, JsResult result) {
                new AlertDialog.Builder(MainActivity.this).setTitle("我的家").setMessage(message)
                    .setPositiveButton("确定", (dialog, which) -> result.confirm())
                    .setNegativeButton("取消", (dialog, which) -> result.cancel())
                    .setOnCancelListener(dialog -> result.cancel()).show();
                return true;
            }
            @Override public void onPermissionRequest(PermissionRequest request) { request.deny(); }
        });
        webView.loadUrl(HOME);
    }

    private static String mimeType(String path) {
        if (path.endsWith(".mp4")) return "video/mp4";
        if (path.endsWith(".html")) return "text/html";
        if (path.endsWith(".js")) return "application/javascript";
        if (path.endsWith(".css")) return "text/css";
        if (path.endsWith(".json") || path.endsWith(".webmanifest")) return "application/json";
        if (path.endsWith(".svg")) return "image/svg+xml";
        if (path.endsWith(".png")) return "image/png";
        if (path.endsWith(".woff2")) return "font/woff2";
        return "application/octet-stream";
    }

    private static WebResourceResponse errorResponse(int status, String reason) {
        return new WebResourceResponse("text/plain", "UTF-8", status, reason, null,
            new ByteArrayInputStream(reason.getBytes(StandardCharsets.UTF_8)));
    }

    public final class FileBridge {
        @JavascriptInterface public void saveFile(String filename, String encoded, String mime) {
            if (encoded == null || encoded.length() > 40000000 || filename == null) return;
            if (!"application/json".equals(mime) && !"image/png".equals(mime)
                    && !"model/gltf-binary".equals(mime) && !"text/csv".equals(mime)) return;
            final byte[] bytes;
            try { bytes = android.util.Base64.decode(encoded, android.util.Base64.DEFAULT); }
            catch (IllegalArgumentException e) { return; }
            if (bytes.length > 30000000) return;
            final String name = filename.replaceAll("[\\\\/:*?\"<>|\\p{Cntrl}]", "_");
            runOnUiThread(() -> {
                if (pendingData != null) return;
                pendingData = bytes;
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType(mime);
                intent.putExtra(Intent.EXTRA_TITLE, name.substring(0, Math.min(name.length(), 120)));
                try { startActivityForResult(intent, EXPORT_REQUEST); }
                catch (ActivityNotFoundException e) { pendingData = null; notifyWeb("未找到系统保存文件功能"); }
            });
        }
    }

    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == IMPORT_REQUEST && fileCallback != null) {
            Uri uri = result == RESULT_OK && data != null ? data.getData() : null;
            fileCallback.onReceiveValue(uri == null ? null : new Uri[]{uri});
            fileCallback = null;
        }
        if (request == EXPORT_REQUEST) {
            byte[] bytes = pendingData;
            pendingData = null;
            if (result != RESULT_OK || data == null || data.getData() == null || bytes == null) return;
            try (OutputStream stream = getContentResolver().openOutputStream(data.getData(), "wt")) {
                if (stream == null) throw new IOException("Cannot open destination");
                stream.write(bytes);
                notifyWeb("文件已保存到你选择的位置");
            } catch (IOException e) { notifyWeb("保存失败，请更换保存位置再试"); }
        }
    }

    private void notifyWeb(String text) {
        webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('home:native-notice',{detail:"
            + JSONObject.quote(text) + "}))", null);
    }

    @Override public void onBackPressed() {
        webView.evaluateJavascript("typeof window.homeHandleBack==='function' && window.homeHandleBack()", handled -> {
            if (!"true".equals(handled)) new AlertDialog.Builder(this).setTitle("退出我的家？")
                .setMessage("当前方案已自动保存在本机，下次打开可以继续编辑。")
                .setPositiveButton("退出", (dialog, which) -> finish())
                .setNegativeButton("继续装修", null).show();
        });
    }

    @Override protected void onPause() { super.onPause(); webView.onPause(); }
    @Override protected void onResume() { super.onResume(); if (webView != null) webView.onResume(); }
    @Override protected void onDestroy() {
        if (fileCallback != null) fileCallback.onReceiveValue(null);
        webView.removeJavascriptInterface("HomeAndroid");
        webView.destroy();
        super.onDestroy();
    }
}
