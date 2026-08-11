// Run by .github/workflows/android.yml on every build. Stamps
// android/app/build.gradle with the app's current version (the newest entry
// in src/shared/updates.js) and writes GitHub release notes so the in-app update
// checker (src/updateCheck.js) can tell users a newer build exists and what
// changed, since every Android release reuses the same "latest" GitHub tag.
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs'
import { UPDATES } from '../src/shared/updates.js'

const latest = UPDATES[0]
const appVersion = latest.version

const gradleFile = 'android/app/build.gradle'
let gradle = readFileSync(gradleFile, 'utf8')
gradle = gradle.replace(/versionCode (\d+)/, (_, c) => `versionCode ${parseInt(c, 10) + 1}`)
gradle = gradle.replace(/versionName "[^"]+"/, `versionName "${appVersion}"`)
writeFileSync(gradleFile, gradle, 'utf8')

const bullets = latest.fa.changes.map((line) => `- ${line}`).join('\n')
const releaseBody = `version: ${appVersion}\n\n${latest.fa.title}\n${bullets}\n`
writeFileSync('release-notes.txt', releaseBody, 'utf8')

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `app_version=${appVersion}\n`)
}
