import ExpoModulesCore

// Keeps the sms-ingest endpoint (with the private key) where the "Log Bank SMS" action can read it.
// Same app, same UserDefaults: see native/ios/FakkaIntents.swift.
public class FakkaShortcutsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FakkaShortcuts")

    Function("setEndpoint") { (endpoint: String?) in
      if let endpoint = endpoint, !endpoint.isEmpty {
        UserDefaults.standard.set(endpoint, forKey: "fakka.smsEndpoint")
      } else {
        UserDefaults.standard.removeObject(forKey: "fakka.smsEndpoint")
      }
    }
  }
}
