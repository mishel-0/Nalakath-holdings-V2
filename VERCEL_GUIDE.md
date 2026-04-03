# 🚀 Vercel Deployment Guide: Nalakath Holdings

Follow these steps to deploy your Premium Accounting ERP to Vercel and get your live URL.

## Step 1: Install Vercel CLI
If you haven't already, install the Vercel CLI globally on your local machine:
```bash
npm install -g vercel
```

## Step 2: Build the Project
Ensure the project builds locally without errors:
```bash
npm run build
```

## Step 3: Initialize Vercel Project
Run the following command in the root of your project:
```bash
vercel
```
*Follow the prompts to log in and set up your project (e.g., "Nalakath Holdings").*

## Step 4: Configure Environment Variables
In the Vercel dashboard for your new project, or via the CLI, add your **GOOGLE_GENAI_API_KEY** or **OPENROUTER_API_KEY**:
```bash
vercel env add OPENROUTER_API_KEY
```

## Step 5: Run Production Deployment
To deploy to production and get your final `.vercel.app` URL, run:
```bash
vercel --prod
```

## Step 6: Verify Firebase Integration
1. Go to your **Firebase Console**.
2. Navigate to **Authentication > Settings > Authorized Domains**.
3. Add your new Vercel domain (e.g., `nalakath-ledger.vercel.app`) to the list so login works.

## Step 7: Access your Live URL
After Step 5, Vercel will provide a link like:
**https://nalakath-ledger.vercel.app**

---
*Nalakath Group @2026 - Production Environment Ready*
