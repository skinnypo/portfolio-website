export const WORK_TOPIC = "work"

export function normalizeTopic(topic: string | null | undefined): string {
  return (topic ?? "").trim().toLowerCase()
}

export function isWorkTopic(topic: string | null | undefined): boolean {
  return normalizeTopic(topic) === WORK_TOPIC
}

export function formatTopic(
  topic: string,
  subtopic: string | null | undefined
): string {
  return subtopic ? `${topic} · ${subtopic}` : topic
}
