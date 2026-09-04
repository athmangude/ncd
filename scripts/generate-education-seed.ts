import { readFileSync, writeFileSync } from "fs"
import { resolve } from "path"

const fixturePath = resolve(
  import.meta.dirname,
  "../src/mocks/fixtures/education-cards.json",
)
const outputPath = resolve(
  import.meta.dirname,
  "../supabase/migrations/003_education_seed.sql",
)

interface EducationCard {
  id: string
  slug: string
  conditionType: string
  contentType: string
  title: string
  body: string
  summary?: string
  sections: { id: string; title: string; body: string }[]
  estimatedMinutes?: number
  learningObjectives?: string[]
  imageUrl?: string
}

const cards: EducationCard[] = JSON.parse(
  readFileSync(fixturePath, "utf-8"),
)

function escSql(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "''").replace(/\n/g, "\\n").replace(/\r/g, "")
}

function eStr(s: string): string {
  return `E'${escSql(s)}'`
}

function toSqlArray(arr: string[]): string {
  return `'{${arr.map((v) => `"${escSql(v)}"`).join(",")}}'`
}

const rows = cards.map((c) => {
  const slug = eStr(c.slug)
  const title = eStr(c.title)
  const category = eStr(c.conditionType)
  const conditions = toSqlArray([c.conditionType])
  const contentType = eStr(c.contentType)
  const summary = c.summary ? eStr(c.summary) : "NULL"
  const body = eStr(c.body)
  const sections = `${eStr(JSON.stringify(c.sections))}::jsonb`
  const minutes = c.estimatedMinutes ?? 5
  const objectives = c.learningObjectives
    ? toSqlArray(c.learningObjectives)
    : "'{}'::text[]"
  const imageTheme = c.imageUrl ? eStr(c.imageUrl) : "NULL"

  return `  (${slug}, ${title}, ${category}, ${conditions}, ${contentType}, ${summary}, ${body}, ${sections}, ${minutes}, ${objectives}, ${imageTheme})`
})

const sql = `-- 003_education_seed.sql
-- Auto-generated from src/mocks/fixtures/education-cards.json
-- Run: npx tsx scripts/generate-education-seed.ts

INSERT INTO education_content (slug, title, category, conditions, content_type, summary, body, sections, estimated_minutes, learning_objectives, image_theme)
VALUES
${rows.join(",\n")}
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  conditions = EXCLUDED.conditions,
  content_type = EXCLUDED.content_type,
  summary = EXCLUDED.summary,
  body = EXCLUDED.body,
  sections = EXCLUDED.sections,
  estimated_minutes = EXCLUDED.estimated_minutes,
  learning_objectives = EXCLUDED.learning_objectives,
  image_theme = EXCLUDED.image_theme,
  updated_at = now();
`

writeFileSync(outputPath, sql, "utf-8")
console.log(`Wrote ${cards.length} education rows to ${outputPath}`)
