// Portable orchestration regressions. Desktop/Seatbelt acceptance remains separate.
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const root = resolve(app, '..')
const tests = [
  ...['会话事实', '原生纸条等待', '纸条等待持久化', '分工表', '验证收据', '资料', '上下文重建']
    .map(name => `blueprint/packages/node/${name}.test.js`),
  ...['核对', '工具文案', '等待入口'].map(name => `blueprint/packages/context/${name}.test.js`),
  'app/tests/selector-cache.test.mjs',
  'app/tests/selector-request-trace.test.mjs',
]
const temporary = mkdtempSync(join(tmpdir(), 'blueprint-orchestration-'))
try {
  const data = join(temporary, 'data'), documents = join(temporary, 'documents')
  mkdirSync(data)
  mkdirSync(join(documents, 'Blueprint', '项目'), { recursive: true })
  console.log(`Portable orchestration regressions: ${tests.length} files; macOS desktop/Seatbelt acceptance is separate.`)
  const hook = `${pathToFileURL(join(app, 'scripts/native-node-protocol-check.mjs')).href}?register`
  const result = spawnSync(process.execPath, ['--import', hook, '--test', ...tests.map(file => join(root, file))], {
    cwd: root, stdio: 'inherit', env: { ...process.env, BLUEPRINT_PROTOCOL_ENGINE_ROOT: app,
      BLUEPRINT_DATA_HOME: data, BLUEPRINT_DOCUMENTS_HOME: documents },
  })
  if (result.error) throw result.error
  process.exitCode = result.status ?? 1
} finally {
  rmSync(temporary, { recursive: true, force: true })
}
