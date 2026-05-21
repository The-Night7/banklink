import { scaleBand, scaleLinear } from "d3-scale";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Rect } from "react-native-svg";

import { colors, spacing } from "../theme/tokens";

type BarDatum = {
  label: string;
  value: number;
  color?: string;
};

export const BarChart = ({ data, height = 180 }: { data: BarDatum[]; height?: number }) => {
  const width = 320;
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const xScale = scaleBand<string>().domain(data.map((item) => item.label)).range([0, width]).padding(0.25);
  const yScale = scaleLinear().domain([0, maxValue]).range([height, 0]);

  return (
    <View style={styles.container}>
      <Svg width={width} height={height + 20}>
        {data.map((item) => {
          const x = xScale(item.label) ?? 0;
          const barHeight = height - yScale(item.value);
          return (
            <Rect
              key={item.label}
              x={x}
              y={height - barHeight}
              width={xScale.bandwidth()}
              height={barHeight}
              rx={8}
              fill={item.color ?? colors.accent}
            />
          );
        })}
      </Svg>
      <View style={styles.labels}>
        {data.map((item) => (
          <Text key={item.label} style={styles.label}>
            {item.label}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm
  },
  labels: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  label: {
    color: colors.textMuted,
    fontSize: 12
  }
});
