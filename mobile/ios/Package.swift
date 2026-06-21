// swift-tools-version: 6.0
// Browser 2030B — iOS/macOS edition (Swift 6, strict concurrency).
//
// The shipping app embeds WKWebView (WebKit) on iOS where policy requires it,
// and the vendored engine where permitted. This package exposes the pure,
// testable core (security policy, tab model) so `swift test` runs anywhere;
// the UIKit/AppKit host targets are added by the Xcode project.

import PackageDescription

let package = Package(
    name: "Browser2030B",
    platforms: [
        .iOS(.v17),
        .macOS(.v14),
    ],
    products: [
        .library(name: "Browser2030BCore", targets: ["Browser2030BCore"]),
    ],
    targets: [
        .target(
            name: "Browser2030BCore",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .unsafeFlags(["-warnings-as-errors"]),
            ]
        ),
        .testTarget(
            name: "Browser2030BCoreTests",
            dependencies: ["Browser2030BCore"]
        ),
    ]
)
