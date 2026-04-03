# Publishing to Vercel

Follow these steps to deploy your Premium Accounting ERP to Vercel.

## 1. Prepare your Code
Ensure you have your code in a Git repository (GitHub, GitLab, or Bitbucket).

## 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in.
2. Click **"Add New"** > **"Project"**.
3. Import your repository.

## 3. Configure Environment Variables
In the Vercel "Configure Project" screen, add the following Environment Variables:

| Key | Value | Description |
| :--- | :--- | :--- |
| `GOOGLE_GENAI_API_KEY` | `YOUR_API_KEY` | Required for AI Insights (Genkit). |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `...` | Optional (if moving away from hardcoded config). |

## 4. Deploy
Click **Deploy**. Vercel will automatically detect the Next.js framework, build your application, and provide a live URL.

## 5. Firebase Configuration
Your `src/firebase/config.ts` currently contains the public configuration for your Firebase project. This is safe to commit and will work out of the box on Vercel. 

**Note:** Ensure your Firebase Authentication "Authorized Domains" in the Firebase Console include your new Vercel domain (e.g., `your-project.vercel.app`) so that logins work correctly.

---
*Nalakath Holdings @2026*
