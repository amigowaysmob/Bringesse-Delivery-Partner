import UIKit
import React
import GoogleMaps
import HyperSDK  // ✅ import the umbrella header

@main
class AppDelegate: RCTAppDelegate {

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil
  ) -> Bool {

    // Set your RN module name
    self.moduleName = "bringessedelivery_partner"
    self.initialProps = [:]

    // Google Maps API
    GMSServices.provideAPIKey("AIzaSyD3aWLyn9qHavlshIy49b1Pi9jjKjIPMnc")
    GMSPlacesClient.provideAPIKey("AIzaSyD3aWLyn9qHavlshIy49b1Pi9jjKjIPMnc")

    // Initialize HyperSDK (example)
    Hyper.initialize()  // ✅ optional: call your HyperSDK setup if needed

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  override func sourceURL(for bridge: RCTBridge!) -> URL! {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
