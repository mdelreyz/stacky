import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/Colors";

type DayStatus = boolean | null; // true = all taken, false = incomplete, null = nothing scheduled

interface AdherenceCalendarProps {
  dailyCompletion: Record<string, DayStatus>;
  startDate: string;
  endDate: string;
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function parseDateParts(iso: string): [number, number, number] {
  const [y, m, d] = iso.split("-").map(Number);
  return [y, m, d];
}

function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDayOfWeek(year: number, month: number, day: number): number {
  // 0 = Monday ... 6 = Sunday
  const d = new Date(year, month - 1, day);
  return (d.getDay() + 6) % 7;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getMonthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleString(undefined, { month: "short", year: "numeric" });
}

function getDayColor(status: DayStatus): string {
  if (status === true) return colors.success;
  if (status === false) return colors.warningAmber; // amber — incomplete
  return colors.surface; // nothing scheduled
}

function getDayTextColor(status: DayStatus): string {
  if (status === true) return colors.white;
  if (status === false) return colors.white;
  return colors.textMuted;
}

interface MonthGrid {
  label: string;
  rows: Array<Array<{ day: number; iso: string; inRange: boolean; status: DayStatus } | null>>;
}

function buildMonthGrids(
  dailyCompletion: Record<string, DayStatus>,
  startDate: string,
  endDate: string,
): MonthGrid[] {
  const [sy, sm] = parseDateParts(startDate);
  const [ey, em] = parseDateParts(endDate);

  const months: MonthGrid[] = [];

  let year = sy;
  let month = sm;
  while (year < ey || (year === ey && month <= em)) {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDow = getDayOfWeek(year, month, 1);
    const rows: MonthGrid["rows"] = [];
    let currentRow: MonthGrid["rows"][0] = new Array(firstDow).fill(null);

    for (let day = 1; day <= daysInMonth; day++) {
      const iso = toIso(year, month, day);
      const inRange = iso >= startDate && iso <= endDate;
      const status = inRange ? (dailyCompletion[iso] ?? null) : null;
      currentRow.push({ day, iso, inRange, status });

      if (currentRow.length === 7) {
        rows.push(currentRow);
        currentRow = [];
      }
    }
    if (currentRow.length > 0) {
      while (currentRow.length < 7) currentRow.push(null);
      rows.push(currentRow);
    }

    months.push({ label: getMonthLabel(year, month), rows });

    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return months;
}

export function AdherenceCalendar({ dailyCompletion, startDate, endDate }: AdherenceCalendarProps) {
  const grids = buildMonthGrids(dailyCompletion, startDate, endDate);

  // Count stats for legend
  const entries = Object.values(dailyCompletion);
  const complete = entries.filter((v) => v === true).length;
  const incomplete = entries.filter((v) => v === false).length;
  const noSchedule = entries.filter((v) => v === null).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Adherence Calendar</Text>
        <View style={styles.legend}>
          <LegendDot color={colors.success} label={`${complete} complete`} />
          <LegendDot color={colors.warningAmber} label={`${incomplete} missed`} />
          <LegendDot color={colors.surface} label={`${noSchedule} off`} />
        </View>
      </View>

      {grids.map((grid) => (
        <View key={grid.label} style={styles.monthBlock}>
          <Text style={styles.monthLabel}>{grid.label}</Text>
          <View style={styles.dayLabelsRow}>
            {DAY_LABELS.map((label, i) => (
              <Text key={i} style={styles.dayLabel}>{label}</Text>
            ))}
          </View>
          {grid.rows.map((row, ri) => (
            <View key={ri} style={styles.weekRow}>
              {row.map((cell, ci) => {
                if (!cell) {
                  return <View key={ci} style={styles.dayCell} />;
                }
                const bgColor = cell.inRange ? getDayColor(cell.status) : "transparent";
                const textColor = cell.inRange ? getDayTextColor(cell.status) : colors.borderLight;
                return (
                  <View
                    key={ci}
                    style={[
                      styles.dayCell,
                      cell.inRange && { backgroundColor: bgColor, borderRadius: 8 },
                    ]}
                  >
                    <Text style={[styles.dayText, { color: textColor }]}>{cell.day}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  legend: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  monthBlock: {
    marginTop: 4,
  },
  monthLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.grayDark,
    marginBottom: 6,
  },
  dayLabelsRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  dayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
  },
  weekRow: {
    flexDirection: "row",
    gap: 2,
    marginBottom: 2,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
