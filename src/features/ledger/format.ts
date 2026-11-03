export function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString('en-UG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
export function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString('en-UG', {
    hour: 'numeric',
    minute: '2-digit',
  });
}
