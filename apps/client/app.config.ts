import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "BudgetLink",
  slug: "budgetlink",
  scheme: "budgetlink",
  platforms: ["ios", "android", "web"],
  orientation: "portrait",
  userInterfaceStyle: "light",
  experiments: {
    typedRoutes: true
  },
  web: {
    bundler: "metro",
    output: process.env.NODE_ENV === "development" ? "single" : "static"
  },
  plugins: ["expo-router"]
};

export default config;
