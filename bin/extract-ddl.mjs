import dotenv from 'dotenv'
import { promises as fs } from 'fs'
import { minimatch } from 'minimatch'
import path from 'path'
import pkg from 'pg'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const outputPath = path.join(__dirname, '../docs/latest-ddl.sql')

const { Pool } = pkg
dotenv.config()

// 제외할 테이블 패턴 목록
const EXCLUDED_PATTERNS = ['checkpoint*']

// 데이터베이스 연결 설정
const pool = new Pool({ connectionString: process.env.SUPABASE_POSTGRES_URL })

// DDL 추출 쿼리
const GET_TABLE_DDL = `
WITH RECURSIVE 
columns AS (
    SELECT 
        table_name,
        string_agg(
            column_name || ' ' || data_type || 
            CASE 
                WHEN character_maximum_length IS NOT NULL 
                THEN '(' || character_maximum_length || ')'
                ELSE ''
            END || 
            CASE 
                WHEN column_default IS NOT NULL 
                THEN ' DEFAULT ' || column_default
                ELSE ''
            END ||
            CASE 
                WHEN is_nullable = 'NO' 
                THEN ' NOT NULL'
                ELSE ''
            END,
            ', '
            ORDER BY ordinal_position
        ) as column_definitions
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = ANY($1)
    GROUP BY table_name
),
constraint_info AS (
    SELECT 
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        array_agg(kcu.column_name ORDER BY kcu.ordinal_position) as key_columns,
        ccu.table_name as foreign_table_name,
        array_agg(ccu.column_name ORDER BY kcu.ordinal_position) as foreign_columns
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name 
        AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name 
        AND ccu.table_schema = tc.table_schema
    WHERE tc.table_schema = 'public'
    AND tc.table_name = ANY($1)
    GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type, ccu.table_name
),
constraint_statements AS (
    SELECT 
        table_name,
        string_agg(
            'CONSTRAINT ' || constraint_name || ' ' ||
            CASE constraint_type
                WHEN 'PRIMARY KEY' THEN 
                    'PRIMARY KEY (' || array_to_string(key_columns, ', ') || ')'
                WHEN 'FOREIGN KEY' THEN
                    'FOREIGN KEY (' || array_to_string(key_columns, ', ') || ') ' ||
                    'REFERENCES ' || foreign_table_name || 
                    '(' || array_to_string(foreign_columns, ', ') || ')'
                WHEN 'UNIQUE' THEN
                    'UNIQUE (' || array_to_string(key_columns, ', ') || ')'
                ELSE ''
            END,
            ', '
        ) as constraint_definitions
    FROM constraint_info
    GROUP BY table_name
)
SELECT 
    t.table_name,
    format('CREATE TABLE public.%I (%s%s);',
        t.table_name,
        c.column_definitions,
        CASE 
            WHEN cs.constraint_definitions IS NOT NULL 
            THEN ', ' || cs.constraint_definitions
            ELSE ''
        END
    ) as create_table_ddl
FROM information_schema.tables t
JOIN columns c ON t.table_name = c.table_name
LEFT JOIN constraint_statements cs ON t.table_name = cs.table_name
WHERE t.table_schema = 'public'
AND t.table_type = 'BASE TABLE'
AND t.table_name = ANY($1)
ORDER BY t.table_name;
`

// 테이블이 제외 패턴과 매치되는지 확인하는 함수
function shouldExcludeTable(tableName) {
  return EXCLUDED_PATTERNS.some(pattern => minimatch(tableName, pattern))
}

async function extractDDL() {
  try {
    // docs 디렉토리가 없으면 생성
    const docsDir = path.dirname(outputPath)
    await fs.mkdir(docsDir, { recursive: true })

    // 먼저 모든 테이블 목록을 가져옴
    const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `)

    // glob 패턴을 사용하여 테이블 필터링
    const tables = tablesResult.rows
      .map(row => row.table_name)
      .filter(tableName => !shouldExcludeTable(tableName))

    if (tables.length === 0) {
      console.log('추출할 테이블이 없습니다.')
      return
    }

    console.log('추출 대상 테이블:', tables)

    // DDL 추출
    const result = await pool.query(GET_TABLE_DDL, [tables])

    // 결과 출력 및 파일 저장
    let outputContent = ''

    for (const row of result.rows) {
      outputContent += `-- Table: ${row.table_name}\n`
      outputContent += `${row.create_table_ddl}\n\n`
    }

    await fs.writeFile(outputPath, outputContent)
    console.log(`DDL이 성공적으로 추출되어 ${outputPath}에 저장되었습니다.`)
  } catch (err) {
    console.error('에러 발생:', err)
    console.error('상세 에러:', err.detail || err.message)
  } finally {
    await pool.end()
  }
}

// 스크립트 실행
extractDDL()
