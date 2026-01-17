# 🐾 PetMeme Hub

> The #1 social platform for pet lovers to create, share, and discover funny pet memes and short videos!

![PetMeme Hub](https://img.shields.io/badge/version-1.0.0-purple)
![React](https://img.shields.io/badge/React-19.2-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4.x-cyan)
![Firebase](https://img.shields.io/badge/Firebase-12.x-orange)

## ✨ Features

### 🎯 Core Features
- **Pet-First Profiles** - Spotlight your pet with badges, viral stats, and Instagram-style grids
- **Infinite Scroll Feed** - TikTok-style vertical feed mixing memes & short videos
- **AI Meme Generator** - Get caption suggestions based on your pet's breed & behaviors
- **Multi-Tab Discovery** - "For You", "Following", "Trending" personalized feeds
- **Rich Engagement** - Paw likes, threaded comments, reposts, bookmarks

### 🎨 Design & UX
- **Vibrant Theme** - Playful pastels + bright accents
- **Custom Fonts** - Fredoka (headings) + Poppins (body)
- **Dark/Light Mode** - Toggle between themes
- **Mobile-First PWA** - Optimized for phones with safe area support
- **Smooth Animations** - Framer Motion powered interactions

### 💰 Monetization Ready
- **Meme-Style Ads** - Brand-tagged posts with shop links
- **Campaign System** - Brands create challenges with prizes
- **Behavior Data** - Optional pet personality tracking for personalization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project (for full functionality)

### Installation

```bash
# Navigate to project
cd "Pet Memes"

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

### Firebase Setup (Required for Full Functionality)

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Google & Email/Password)
3. Create a Firestore database
4. Enable Firebase Storage
5. Copy your config to environment variables:

Create a `.env` file in the project root:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### AI Meme Generation (Optional)

To enable AI-powered caption suggestions:
1. Get an API key from [OpenRouter](https://openrouter.ai)
2. Add to your `.env`:
```env
VITE_OPENROUTER_API_KEY=your_openrouter_key
```

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/          # ProtectedRoute
│   ├── feed/          # FeedCard, FeedTabs
│   ├── navigation/    # BottomNav
│   └── ui/            # ToastContainer
├── config/
│   └── firebase.js    # Firebase configuration
├── layouts/
│   ├── AuthLayout.jsx # Login/signup wrapper
│   └── MainLayout.jsx # Main app with bottom nav
├── pages/
│   ├── auth/
│   │   ├── Login.jsx      # Google/Email auth
│   │   └── Onboarding.jsx # Pet setup wizard
│   ├── Campaigns.jsx      # Brand campaigns
│   ├── Create.jsx         # Post creator + AI
│   ├── Discover.jsx       # Search & explore
│   ├── Home.jsx           # Main feed
│   ├── PostDetail.jsx     # Full post + comments
│   ├── Profile.jsx        # Pet profile page
│   ├── Settings.jsx       # User settings
│   └── Splash.jsx         # Loading screen
├── store/
│   ├── authStore.js   # User & pet state
│   ├── feedStore.js   # Posts & interactions
│   └── uiStore.js     # Theme, modals, toasts
├── index.css          # Tailwind + custom styles
└── App.jsx            # Routes & providers
```

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 19, Vite 7 |
| Styling | Tailwind CSS 4 |
| State | Zustand |
| Animations | Framer Motion |
| Icons | Lucide React |
| Backend | Firebase (Auth, Firestore, Storage) |
| AI | Claude/OpenRouter (optional) |

## 📱 Key Pages

### 🏠 Home Feed
- Infinite scroll with pull-to-refresh
- Auto-play video support
- Double-tap to like with paw animation
- Side engagement buttons

### 🐾 Pet Profile
- Large pet avatar with behavior badges
- Viral stats (posts, followers, likes)
- 3-column Instagram-style grid
- Tabs: My Memes, Favorites, Collabs

### ✏️ Create Post
- Multi-image/video upload (max 4)
- Text overlay editor
- AI caption generator
- Behavior tagging

### 🏆 Campaigns
- Active brand challenges
- Prize details & requirements
- Entry tracking
- Past winners showcase

## 🎨 Customization

### Colors
Edit theme colors in `src/index.css`:
```css
@theme {
  --color-primary-500: #d946ef; /* Main accent */
  --color-accent-coral: #ff6b6b; /* Like button */
  /* ... */
}
```

### Fonts
Google Fonts are loaded in the CSS:
- Fredoka (headings)
- Poppins (body text)

## 📄 License

MIT License - feel free to use for your own projects!

## 🤝 Contact

Built by **@adriannewman21** from Hong Kong 🇭🇰

---

*Made with ❤️ and lots of 🐾 paw taps*
