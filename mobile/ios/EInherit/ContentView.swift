import SwiftUI

struct ContentView: View {
    @StateObject private var model = ServerModel()
    @State private var showAbout = false

    var body: some View {
        NavigationStack {
            WebContainer(url: model.homeURL)
                .ignoresSafeArea(edges: .bottom)
                .navigationTitle("电子继承")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            showAbout = true
                        } label: {
                            Image(systemName: "info.circle")
                        }
                    }
                }
                .sheet(isPresented: $showAbout) {
                    AboutView(model: model)
                }
        }
    }
}

struct AboutView: View {
    @ObservedObject var model: ServerModel
    @Environment(\.dismiss) private var dismiss
    @State private var draft = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("服务") {
                    Text("电子继承 App（E-Inherit）帮助您完成个人公司化盘点、生存报备与数字资产交割安排。")
                        .font(.footnote)
                    Link("隐私政策", destination: URL(string: "https://einherit.cn/privacy.html")!)
                    Link("官网", destination: URL(string: "https://einherit.cn")!)
                }
                Section("服务地址") {
                    TextField("https://…", text: $draft)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.URL)
                        .autocorrectionDisabled()
                    Button("恢复默认") {
                        model.resetDefault()
                        draft = model.homeURL.absoluteString
                    }
                }
            }
            .navigationTitle("关于")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("关闭") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("保存") {
                        let s = draft.trimmingCharacters(in: .whitespacesAndNewlines)
                        if let u = URL(string: s), u.scheme?.hasPrefix("http") == true {
                            model.homeURL = u
                        }
                        dismiss()
                    }
                }
            }
            .onAppear { draft = model.homeURL.absoluteString }
        }
    }
}
