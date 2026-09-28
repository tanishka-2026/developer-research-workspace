export type ResearchType = 'comparison' | 'single'

const comparisonPatterns = [
  /\b(.+?)\s+(?:vs\.?|versus|compared\s+with|compared\s+to|against)\s+(.+?)(?:[.!?;,]|$)/i,

  /\bcompare(?:d)?\s+(.+?)\s+(?:with|against|to|and)\s+(.+?)(?:[.!?;,]|$)/i,

  /\bcomparison\s+(?:between|of)\s+(.+?)\s+(?:and|vs\.?|versus)\s+(.+?)(?:[.!?;,]|$)/i,

  /\bdifferences?\s+between\s+(.+?)\s+and\s+(.+?)(?:[.!?;,]|$)/i,

  /\b(.+?)\s+or\s+(.+?)(?:\s+for\s+|\s+in\s+|\s+which\s+|\?|$)/i,
]

export function classifyResearchType(
  title: string,
  question = '',
): ResearchType {
  const request = `${title}\n${question}`.trim()

  return comparisonPatterns.some(pattern => pattern.test(request))
    ? 'comparison'
    : 'single'
}