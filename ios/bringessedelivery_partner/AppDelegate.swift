import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
//import hyper_sdk_react
import Firebase
import GoogleMaps
 

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()
    
    //init firebase
    FirebaseApp.configure()
    
    // init gmaps
    GMSServices.provideAPIKey("AIzaSyD3aWLyn9qHavlshIy49b1Pi9jjKjIPMnc")

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "bringessedelivery_partner",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }
  
  func getReactNativeFactory() -> Any! {
    return reactNativeFactory
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
