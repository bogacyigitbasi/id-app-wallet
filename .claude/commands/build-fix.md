Incrementally diagnose and fix build errors across the umAI stack.

## Process

1. **Identify Build Target** from $ARGUMENTS (or ask):
   - `ios` - Xcode build for iOS
   - `android` - Gradle build for Android
   - `server` - TypeScript server compilation
   - `circuits` - Noir circuit compilation
   - `shared` - Rust shared library
   - `all` - Try all builds

2. **Run Build**
   - iOS: `cd app/ios && xcodebuild -workspace UmAI.xcworkspace -scheme UmAI build`
   - Android: `cd app/android && ./gradlew assembleDebug`
   - Server: `cd server && npm run build`
   - Circuits: `cd circuits && nargo compile`
   - Shared: `cd shared && cargo check`

3. **Parse Errors**
   - Group errors by file
   - Sort by severity (errors before warnings)
   - Identify root cause vs cascading errors

4. **Fix Iteratively**
   For each error:
   - Show error context (5 lines before/after)
   - Explain the issue
   - Propose fix
   - Apply fix
   - Re-run build
   - Verify error resolved

5. **Known Issues**
   - Paths with spaces ("BOGAC AS") break shell scripts - use quoting
   - React Native build scripts need direct execution, not `/bin/sh -c` wrapper
   - iOS archive builds need `SKIP_BUNDLING=1` for pre-bundled builds

6. **Stop Conditions**
   - Fix introduces new errors -> rollback
   - Same error persists after 3 attempts -> escalate
   - User requests pause

7. **Summary**: Errors fixed / remaining / new

$ARGUMENTS
