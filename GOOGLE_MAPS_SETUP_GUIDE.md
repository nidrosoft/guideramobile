# 🗺️ GOOGLE MAPS SETUP GUIDE

## Quick Setup for AR Navigation

---

## 📋 STEP 1: GET API KEY

### **Go to Google Cloud Console:**
1. Visit: https://console.cloud.google.com/
2. Create new project or select existing
3. Enable billing (required, but has $200/month free credit)

### **Enable APIs:**
1. Go to "APIs & Services" → "Library"
2. Search and enable:
   - ✅ **Maps SDK for Android**
   - ✅ **Maps SDK for iOS**
   - ✅ **Directions API**
   - ✅ **Places API**
   - ✅ **Geolocation API**

### **Create API Key:**
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the API key

---

## 🔒 STEP 2: SECURE YOUR API KEY

### **Restrict the API Key:**

1. Click on your API key to edit
2. Under "Application restrictions":
   - Select "Android apps" and "iOS apps"
   - Add your app bundle IDs:
     - Android: `com.guidera.app` (or your package name)
     - iOS: `com.guidera.app` (or your bundle ID)

3. Under "API restrictions":
   - Select "Restrict key"
   - Check only:
     - Maps SDK for Android
     - Maps SDK for iOS
     - Directions API
     - Places API
     - Geolocation API

4. Set usage limits:
   - Daily quota: 1,000 requests (adjust as needed)
   - Per-minute quota: 100 requests

5. Click "Save"

**This prevents:**
- ✅ Unauthorized apps from using your key
- ✅ Excessive usage/costs
- ✅ API abuse

---

## 💻 STEP 3: ADD TO YOUR APP

### **Add to .env file:**

```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env and add your key:
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**Important:** 
- Use `EXPO_PUBLIC_` prefix (Expo requirement)
- Never commit `.env` to git (already in `.gitignore`)

---

## 📱 STEP 4: CONFIGURE NATIVE APPS

### **For Android (app.json):**

```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_API_KEY_HERE"
        }
      }
    }
  }
}
```

### **For iOS (app.json):**

```json
{
  "expo": {
    "ios": {
      "config": {
        "googleMapsApiKey": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

**Or use environment variable:**
```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      }
    },
    "ios": {
      "config": {
        "googleMapsApiKey": process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
      }
    }
  }
}
```

---

## 🧪 STEP 5: TEST IT

### **Run the app:**

```bash
# Install dependencies (already done)
npm install

# Start Expo
npm start

# Run on device
npm run ios
# or
npm run android
```

### **Test navigation:**

1. Open AR Navigation
2. Select airport (LAX, JFK, etc.)
3. Enter gate number
4. Start navigation
5. Should see Google Maps with route!

---

## 💰 COST BREAKDOWN

### **Free Tier:**
- $200/month credit (Google gives this free)
- Covers ~28,000 map loads
- Perfect for development and testing

### **After Free Tier:**
- Maps SDK: $7 per 1,000 loads
- Directions API: $5 per 1,000 requests
- Places API: $17 per 1,000 requests

### **Example Costs:**
- 1,000 users/month: ~$0 (within free tier)
- 10,000 users/month: ~$50/month
- 100,000 users/month: ~$500/month

**Set billing alerts to avoid surprises!**

---

## 🔧 TROUBLESHOOTING

### **"API key not valid":**
- Check API key is correct in `.env`
- Verify APIs are enabled in Google Cloud
- Check app bundle ID restrictions

### **"This API project is not authorized":**
- Enable required APIs in Google Cloud Console
- Wait 5 minutes for changes to propagate

### **"Over quota":**
- Check usage in Google Cloud Console
- Increase quotas or upgrade billing

### **Map not showing:**
- Check internet connection
- Verify API key in app.json
- Rebuild app: `expo prebuild --clean`

---

## 📚 USEFUL LINKS

**Google Cloud Console:**
- Dashboard: https://console.cloud.google.com/
- APIs: https://console.cloud.google.com/apis/library
- Credentials: https://console.cloud.google.com/apis/credentials
- Billing: https://console.cloud.google.com/billing

**Documentation:**
- Maps SDK: https://developers.google.com/maps/documentation
- Directions API: https://developers.google.com/maps/documentation/directions
- Places API: https://developers.google.com/maps/documentation/places

**React Native:**
- react-native-maps: https://github.com/react-native-maps/react-native-maps
- Expo Maps: https://docs.expo.dev/versions/latest/sdk/map-view/

---

## ✅ CHECKLIST

Before deploying to production:

- [ ] API key created
- [ ] All required APIs enabled
- [ ] API key restricted (bundle IDs)
- [ ] API restrictions set
- [ ] Usage limits configured
- [ ] Billing alerts set
- [ ] Key added to .env
- [ ] App tested on iOS
- [ ] App tested on Android
- [ ] Indoor maps working
- [ ] Navigation working
- [ ] Ready to ship! 🚀

---

## 🎯 QUICK START COMMANDS

```bash
# 1. Install packages (already done)
npm install

# 2. Add API key to .env
echo "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here" >> .env

# 3. Start app
npm start

# 4. Test on device
npm run ios
# or
npm run android
```

**That's it!** Google Maps should work now. 🗺️✨
