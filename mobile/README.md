# IDIP Mobile (React Native 0.74.5 — no Expo)

iPhone app for venue door staff: scans driver's licenses (PDF417) and passports
(MRZ), scores fraud/age risk, and returns ALLOW / REVIEW / DENY.

> The camera only works on a **physical device** (or the camera-enabled
> simulator on Apple Silicon). You cannot scan a real ID in a plain simulator.

## Prerequisites (one-time)

- **macOS + Xcode** (full app from the Mac App Store — not just Command Line Tools).
  After installing, open it once to finish component setup, then:
  `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`
- **CocoaPods**: `sudo gem install cocoapods` (or `brew install cocoapods`)
- **Watchman** (recommended): `brew install watchman`
- **Node 18+** and **npm**
- An **Apple ID**. A free account lets you run on your own device for **7 days**
  per build; the **$99/yr** Apple Developer Program is needed for TestFlight /
  the App Store and removes the 7-day limit.

## First-time setup

```bash
cd mobile
npm install
cd ios && pod install        # generates IDIP.xcworkspace
cd ..
```

## Run on a physical iPhone

1. Connect the iPhone via USB and tap **Trust** on the phone.
2. iOS 16+: Settings → Privacy & Security → **Developer Mode** → On → reboot.
3. Open **`ios/IDIP.xcworkspace`** in Xcode — *always the workspace, never
   `.xcodeproj`*.
4. Select the **IDIP** target → **Signing & Capabilities**:
   - check *Automatically manage signing*
   - choose your **Team** (your Apple ID)
   - set a unique **Bundle Identifier**, e.g. `com.yourname.idip`
5. Pick your iPhone from the device dropdown and press **⌘R**.
6. First launch only: on the phone, Settings → General → VPN & Device
   Management → trust your developer certificate.
7. Accept the camera permission prompt (text comes from
   `NSCameraUsageDescription` in `ios/IDIP/Info.plist`).

Start the Metro bundler in a separate terminal if Xcode doesn't auto-start it:

```bash
cd mobile && npm start
```

JS-only change → shake the phone → **Reload** (or press `r` in the Metro
terminal). Native change (new pod) → `pod install` → rebuild in Xcode.

## Connecting the app to your backend

The phone can't reach `localhost`. Use a **Cloudflare tunnel** (works on Wi-Fi
*and* cellular, HTTPS so no iOS App Transport Security exceptions needed):

```bash
# Terminal 1 — backend
cd backend
DATABASE_URL=... REDIS_URL=... .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8080

# Terminal 2 — tunnel
cloudflared tunnel --url http://localhost:8080
#  → prints https://<random>.trycloudflare.com
```

Then on the app's **Setup screen**, enter:
- **API URL**: the `https://<random>.trycloudflare.com` URL
- **API Key**: create a location first and copy its key:
  `curl -X POST https://<tunnel>/admin/location -H 'Content-Type: application/json' -d '{"name":"My Bar","state_code":"TX"}'`
- **Staff name** and a **4-digit PIN**

Alternative (same Wi-Fi only): use your Mac's LAN IP (`ipconfig getifaddr en0`)
as `http://192.168.x.x:8080`. Plain HTTP to a non-local host requires an ATS
exception in `Info.plist`; the tunnel avoids this.

## Tests

```bash
cd mobile && npm test       # Jest — pure logic layer (crypto, decision, client, queue)
```

## Troubleshooting

- **"No bundle URL present"** → Metro isn't running or the phone can't reach
  your Mac. Start `npm start`; ensure phone and Mac are on the same network.
- **Signing errors** → make sure a Team is selected and the Bundle ID is unique.
- **Build fails after adding a native lib** → `cd ios && pod install`, then
  clean build folder in Xcode (⇧⌘K) and rebuild.
