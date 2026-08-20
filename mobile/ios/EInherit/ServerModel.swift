import Foundation
import Combine

final class ServerModel: ObservableObject {
    @Published var homeURL: URL {
        didSet { UserDefaults.standard.set(homeURL.absoluteString, forKey: "einherit.home") }
    }

    static let defaultURL = URL(string: "https://zz.zzjt.net/einherit/")!

    init() {
        if let s = UserDefaults.standard.string(forKey: "einherit.home"),
           let u = URL(string: s) {
            homeURL = u
        } else {
            homeURL = Self.defaultURL
        }
    }

    func resetDefault() {
        homeURL = Self.defaultURL
    }
}
