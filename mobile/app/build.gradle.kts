plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.apads.voicesos"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.apads.voicesos"
        minSdk = 26      // Android 8.0+ for Foreground Service support
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        // APADS backend URL — change to your production server IP/domain
        buildConfigField("String", "BACKEND_URL", "\"http://10.0.2.2:5000\"")
    }

    buildFeatures {
        buildConfig = true
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    // AndroidX Core
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")

    // OkHttp — HTTP client for backend API calls
    implementation("com.squareup.okhttp3:okhttp:4.12.0")

    // Google Play Services — Fused Location Provider for GPS
    implementation("com.google.android.gms:play-services-location:21.1.0")

    // JSON parsing
    implementation("org.json:json:20231013")
}
