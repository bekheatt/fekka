// Fakka's own action in the Shortcuts app: "Log Bank SMS".
// A Message automation passes each bank SMS to it, and it sends the text to Fakka's server
// (the same sms-ingest endpoint the old copy-a-link Shortcut used). The app does not open.
// The endpoint (with the person's private key) is saved by the app on sign-in / when automatic
// logging is turned on: see modules/fakka-shortcuts. Copied into the iOS app by plugins/withAppIntents.js.
import AppIntents
import Foundation

@available(iOS 16.0, *)
struct LogBankSmsIntent: AppIntent {
  static let title: LocalizedStringResource = "Log Bank SMS"
  static let description = IntentDescription("Adds a bank message to Fakka. Use it in a Message automation with Shortcut Input.")
  static let openAppWhenRun: Bool = false

  @Parameter(title: "Message", inputConnectionBehavior: .connectToPreviousIntentResult)
  var message: String

  static var parameterSummary: some ParameterSummary {
    Summary("Log \(\.$message) in Fakka")
  }

  func perform() async throws -> some IntentResult {
    guard let saved = UserDefaults.standard.string(forKey: "fakka.smsEndpoint"), let url = URL(string: saved) else {
      throw FakkaIntentError.notConnected
    }
    var request = URLRequest(url: url, timeoutInterval: 20)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.httpBody = try JSONSerialization.data(withJSONObject: ["text": message])
    let (_, response) = try await URLSession.shared.data(for: request)
    let status = (response as? HTTPURLResponse)?.statusCode ?? 0
    if status == 401 { throw FakkaIntentError.notConnected }
    if status >= 300 { throw FakkaIntentError.serverBusy }
    return .result()
  }
}

@available(iOS 16.0, *)
enum FakkaIntentError: Error, CustomLocalizedStringResourceConvertible {
  case notConnected, serverBusy

  var localizedStringResource: LocalizedStringResource {
    switch self {
    case .notConnected: return "Fakka isn't connected. Open Fakka, go to Settings, Automatic logging, and turn it on."
    case .serverBusy: return "Fakka couldn't save this message. Open Fakka and try again later."
    }
  }
}
