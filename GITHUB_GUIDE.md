# Uploading to GitHub

Follow these steps to upload your Nalakath Holdings Ledger to GitHub.

## 1. Create a GitHub Repository
1. Log in to [GitHub](https://github.com).
2. Click the **"+"** icon in the top right and select **"New repository"**.
3. Name it (e.g., `nalakath-ledger`), keep it **Private** for maximum confidentiality, and click **"Create repository"**.
4. **Important:** Do NOT initialize with a README, .gitignore, or license (we already have them).

## 2. Initialize and Push from your Terminal
Open your terminal in the root of this project and run the following commands:

```bash
# Initialize git
git init

# Add all files (the .gitignore will skip node_modules)
git add .

# Create initial commit
git commit -m "Initial commit: Premium Accounting ERP"

# Set the branch to main
git branch -M main

# Link to your GitHub (Replace with YOUR actual URL from GitHub)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push the code
git push -u origin main
```

## 3. Security Note
Your `src/firebase/config.ts` contains your public Firebase config, which is safe to upload. However, never share your `GOOGLE_GENAI_API_KEY` (if you have one in a `.env` file). The provided `.gitignore` file will prevent `.env` from being uploaded.

---
*Nalakath Holdings @2026*
