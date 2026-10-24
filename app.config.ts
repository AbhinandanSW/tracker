import type { ExpoConfig } from "expo/config";

const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const baseUrl =
  process.env.EXPO_BASE_URL ??
  (process.env.GITHUB_ACTIONS && repoName ? `/${repoName}` : "");

const config: ExpoConfig = {
  name: "Job Hunt",
  slug: "tracker",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "jobhunt",
  userInterfaceStyle: "automatic",
  backgroundColor: "#F7F5F0",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.abhinandansw.jobhunt",
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    package: "com.abhinandansw.jobhunt",
    adaptiveIcon: {
      backgroundColor: "#101114",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: "single",
    favicon: "./assets/images/favicon.png",
    name: "Job Hunt",
    shortName: "Job Hunt",
    description:
      "A personal job feed, application pipeline, and AI application assistant.",
    themeColor: "#4F46E5",
    backgroundColor: "#F7F5F0",
    display: "standalone",
    startUrl: ".",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#101114",
        image: "./assets/images/splash-icon.png",
        imageWidth: 96,
      },
    ],
    "expo-secure-store",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
    baseUrl,
  },
  extra: {
    eas: {
      projectId: "fb95a7c3-d511-4c74-b6a7-d57d22b7af58",
    },
  },
};

export default config;
