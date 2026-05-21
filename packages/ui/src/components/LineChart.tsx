import { line, curveMonotoneX } from "d3-shape";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { colors } from "../theme/tokens";

type Point = {
  label: string;
  value: number;
};

export const LineChart = ({ data, height = 180, width = 320, stroke = colors.accentStrong }: { data: Point[]; height?: number; width?: number; stroke?: string }) => {
  const max = Math.max(...data.map((item) => item.value), 1);
  const min = Math.min(...data.map((item) => item.value), 0);
  const xStep = data.length > 1 ? width / (data.length - 1) : width;
  const points = data.map((item, index) => ({
    x: index * xStep,
    y: height - ((item.value - min) / Math.max(max - min, 1)) * height
  }));
  const path = line<{ x: number; y: number }>()
    .x((point: { x: number; y: number }) => point.x)
    .y((point: { x: number; y: number }) => point.y)
    .curve(curveMonotoneX)(points);

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {path ? <Path d={path} fill="none" stroke={stroke} strokeWidth={4} /> : null}
        {points.map((point, index) => (
          <Circle key={data[index]?.label ?? index} cx={point.x} cy={point.y} r={5} fill={stroke} />
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden"
  }
});
