import { arc, pie } from "d3-shape";
import { StyleSheet, Text, View } from "react-native";
import Svg, { G, Path } from "react-native-svg";

import { colors, spacing } from "../theme/tokens";

type DonutDatum = {
  label: string;
  value: number;
  color: string;
};

export const SemiDonutChart = ({
  data,
  valueLabel
}: {
  data: DonutDatum[];
  valueLabel: string;
}) => {
  const width = 320;
  const height = 180;
  const radius = 120;
  const innerRadius = 72;
  const chartPie = pie<DonutDatum>()
    .value((item: DonutDatum) => item.value)
    .sort(null)
    .startAngle(-Math.PI / 1)
    .endAngle(0);
  const chartArc = arc<ReturnType<typeof chartPie>[number]>().innerRadius(innerRadius).outerRadius(radius);

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        <G x={width / 2} y={height}>
          {chartPie(data).map((slice: any) => {
            const path = chartArc(slice);
            return path ? <Path key={slice.data.label} d={path} fill={slice.data.color} /> : null;
          })}
        </G>
      </Svg>
      <View style={styles.centerLabel}>
        <Text style={styles.value}>{valueLabel}</Text>
      </View>
      <View style={styles.legend}>
        {data.map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md
  },
  centerLabel: {
    alignItems: "center",
    marginTop: -84
  },
  value: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700"
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "center"
  },
  legendItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  legendDot: {
    borderRadius: 999,
    height: 10,
    width: 10
  },
  legendText: {
    color: colors.textMuted,
    fontSize: 12
  }
});
