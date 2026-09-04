import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.oes.pda"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.oes.pda"
        minSdk = 28
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
        buildConfigField(
            "String",
            "PDA_BFF_BASE_URL",
            "\"${resolvePdaBffBaseUrl()}\"",
        )
    }

    buildFeatures {
        buildConfig = true
    }

    testOptions {
        unitTests.isIncludeAndroidResources = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    sourceSets {
        getByName("main") {
            assets.srcDir("../../web/dist")
        }
        getByName("test") {
            java.srcDir("../../../../tests/cross-service")
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
    }
}

dependencies {
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.camera:camera-camera2:1.4.1")
    implementation("androidx.camera:camera-lifecycle:1.4.1")
    implementation("androidx.camera:camera-view:1.4.1")
    implementation("com.google.mlkit:barcode-scanning:17.3.0")

    testImplementation("junit:junit:4.13.2")
    testImplementation("androidx.test:core:1.6.1")
    testImplementation("org.robolectric:robolectric:4.14.1")
}

fun resolvePdaBffBaseUrl(): String {
    return (findProperty("pdaBffBaseUrl") as String?)
        ?: System.getenv("PDA_BFF_BASE_URL")
        ?: "http://192.168.2.33:9101/api/v1"
}
