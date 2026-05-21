import { Tabs } from "expo-router";

import { colors } from "@budgetlink/ui";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentStrong,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: "#FFFDF8",
          borderTopColor: colors.border
        }
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Accueil" }} />
      <Tabs.Screen name="transactions" options={{ title: "Transactions" }} />
      <Tabs.Screen name="budgets" options={{ title: "Budgets" }} />
      <Tabs.Screen name="goals" options={{ title: "Objectifs" }} />
      <Tabs.Screen name="accounts" options={{ title: "Comptes" }} />
      <Tabs.Screen name="settings" options={{ title: "Reglages" }} />
    </Tabs>
  );
}
