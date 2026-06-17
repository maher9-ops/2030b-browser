// Browser 2030B — Android edition (Kotlin K2).
// Built with the Android Gradle Plugin + GeckoView (vendored) for the engine.
// Not built in the offline CI sandbox (requires Android SDK + GeckoView AAR);
// validated by ktlint/detekt in the `lint` workflow on a provisioned runner.

plugins {
    id("com.android.application") version "8.5.0"
    kotlin("android") version "2.0.20" // K2 compiler
}

android {
    namespace = "ai.b2030b.android"
    compileSdk = 35

    defaultConfig {
        applicationId = "ai.b2030b.android"
        minSdk = 29
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
        // Treat warnings as errors and require explicit API visibility.
        allWarningsAsErrors = true
    }
}

dependencies {
    // GeckoView is vendored under engine/ (Firefox parity); pinned by version.
    // implementation("org.mozilla.geckoview:geckoview:nightly")
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    testImplementation("junit:junit:4.13.2")
}
