export const numericValue = (value) => {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};
export const formatValue = (value) => {
  const number = numericValue(value);
  return number === null ? "—" : new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 12 }).format(number);
};
export function calendarLabel(value, annual = false) {
  if (!value) return "—";
  // Historical records are local calendar timestamps, not UTC instants.
  if (annual) return value.slice(0, 4);
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}
export function historyView(history) {
  const records = (history?.timeSeries || []).map(p => ({ ...p, number: numericValue(p.value) }));
  const annual = records.length > 0 && records.every(p => p.timestamp?.slice(5, 10) === "01-01");
  const trend = (history?.quality?.trendSeries || []).map(p => ({...p, number: numericValue(p.value), label:calendarLabel(p.timestamp, annual)}));
  const values = trend.map(p => p.number).filter(v => v !== null);
  return {records, trend, annual, first:records[0]?.timestamp, last:records.at(-1)?.timestamp,
    min:values.length ? Math.min(...values) : null, max:values.length ? Math.max(...values) : null};
}
export function observationsCsv(records) {
  const quote = value => `"${String(value ?? "").replaceAll('"','""')}"`;
  return '\uFEFF' + [['record_id','record_time','source_value','quality'],...records.map(p=>[p.id,p.timestamp,p.value,p.quality])].map(row=>row.map(quote).join(',')).join('\r\n');
}
