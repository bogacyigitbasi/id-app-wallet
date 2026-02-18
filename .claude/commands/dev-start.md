Start the umAI development environment.

## Steps

1. **Check Prerequisites**
   - Verify Node.js is available
   - Verify required ports are free (3000, 3100, 8080, 8081)
   ```bash
   lsof -i :3000 -i :3100 -i :8080 -i :8081
   ```

2. **Kill Orphaned Processes** (if ports are busy)
   ```bash
   pkill -f "ts-node src/index.ts" || true
   pkill -f "ts-node src/signaling.ts" || true
   pkill -f "ts-node src/token-service.ts" || true
   ```

3. **Start Server Services**
   ```bash
   cd /Volumes/ThunderDB/umAI_build/server && npm run all
   ```
   - Verification server: port 3000
   - Token service: port 3100
   - Signaling server: port 8080

4. **Verify Services**
   ```bash
   sleep 3
   lsof -i :3000 -i :3100 -i :8080
   ```

5. **Start Mobile Dev** (based on $ARGUMENTS)
   - `ios`: `cd app && npx react-native start` then `npx react-native run-ios --simulator="iPhone 16 Pro"`
   - `android`: `cd app && npx react-native start` then `npx react-native run-android`
   - `metro`: Just start Metro bundler

6. **Show Connection Info**
   - Display current machine IP for device testing
   - Remind about `DEV_SERVER_IP` in SignalingService.ts

$ARGUMENTS
