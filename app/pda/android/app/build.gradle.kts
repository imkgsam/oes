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

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    sourceSets {
        getByName("main") {
            assets.srcDir("../../web/dist")
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")

    testImplementation("junit:junit:4.13.2")
}

fun resolvePdaBffBaseUrl(): String {
    return (findProperty("pdaBffBaseUrl") as String?)
        ?: System.getenv("PDA_BFF_BASE_URL")
        ?: "http://192.168.2.33:9101/api/v1"
}
