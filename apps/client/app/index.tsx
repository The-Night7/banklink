import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { colors } from "@budgetlink/ui";

import { useAuth } from "../src/lib/auth";

export default function IndexRoute() {
  const { loading, profile, user } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          alignItems: "center",
          backgroundColor: colors.background,
          flex: 1,
          justifyContent: "center"
        }}
      >
        <ActivityIndicator color={colors.accentStrong} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (!profile?.onboardingCompleted) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return <Redirect href="/(app)/(tabs)" />;
}
