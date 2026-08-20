import SwiftUI
import WebKit

struct WebContainer: UIViewRepresentable {
    let url: URL

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        let web = WKWebView(frame: .zero, configuration: config)
        web.navigationDelegate = context.coordinator
        web.allowsBackForwardNavigationGestures = true
        web.scrollView.contentInsetAdjustmentBehavior = .automatic
        context.coordinator.loadIfNeeded(web, url: url)
        return web
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        context.coordinator.loadIfNeeded(webView, url: url)
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        private var loaded: String?

        func loadIfNeeded(_ webView: WKWebView, url: URL) {
            let key = url.absoluteString
            if loaded == key { return }
            loaded = key
            webView.load(URLRequest(url: url))
        }
    }
}
