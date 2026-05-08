
# 🏗️ CampusAI.ng Deployment Guide

This is a production-ready React application powered by Google Gemini and Firebase.

## 🚀 Pre-Deployment Checklist

1.  **Gemini API:**
    *   Get a key from [Google AI Studio](https://aistudio.google.com/).
    *   Add it as `API_KEY` in your hosting environment variables.

2.  **Paystack Integration:**
    *   Get your Public Key from the [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developer).
    *   Add it as `VITE_PAYSTACK_PUBLIC_KEY` in your hosting environment variables.

3.  **Firebase Setup:**
    *   Create a project at [console.firebase.google.com](https://console.firebase.google.com/).
    *   Add a Web App and copy the `firebaseConfig` object.
    *   Enable **Auth** (Google/Email) and **Firestore**.

4.  **Admin Initialization:**
    *   Deploy the code.
    *   Sign in as `5ej852963@gmail.com`.
    *   Open the **Admin Panel** (Shield Icon).
    *   Paste your Firebase JSON config into the **Infrastructure** tab and click **Apply Changes**.

## 🛠️ Tech Stack
*   **Frontend:** React 19 + Tailwind CSS
*   **Intelligence:** Google Gemini 3 (Flash & Pro)
*   **Payments:** Paystack (react-paystack)
*   **Database/Auth:** Firebase (Plug-and-play via Admin UI)
*   **Animations:** Framer Motion
