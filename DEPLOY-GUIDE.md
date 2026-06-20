# 🚀 Deploy Guide (for non-techies)

This guide has 3 parts:
1. Put the project on **GitHub**
2. Make it **live on Vercel** (both payment gateways working)
3. **Switch the payment gateway** on the live site whenever you want

> ⚠️ Golden rule: **Never upload `.env` or `payments/config.php` to GitHub.**
> They hold your secret keys. Your `.gitignore` already blocks them — just don't
> add them by hand.

---

## PART 1 — Upload the project to GitHub

The easiest no-command way is **GitHub Desktop**.

1. Download & install **GitHub Desktop**: https://desktop.github.com
2. Open it and **sign in** with your GitHub account.
3. Top menu: **File → Add Local Repository** → choose the folder
   `cart-teeee-main` (the one that has `package.json` and the `api` folder).
   - If it says "this isn't a git repository", click **"create a repository"** —
     just accept the defaults and click **Create Repository**.
4. You'll see a list of files on the left (your changes). At the bottom-left,
   type a message like `update for vercel` and click **Commit to main**.
5. Top bar: click **Publish repository** (or **Push origin**).
   - Untick "Keep this code private" only if you want it public. Either is fine.
6. Done — your code is now on GitHub. ✅

> Check: open your repo on github.com. You should see the `api` folder, `src`,
> `package.json`, etc. You should **NOT** see `.env`. If you don't see `.env`,
> that's correct and good.

---

## PART 2 — Make it live on Vercel

### 2a. Connect the project (first time only)
1. Go to https://vercel.com and **sign in with GitHub**.
2. Click **Add New… → Project**.
3. Find your repo in the list and click **Import**.
4. Vercel auto-detects it's a Vite app. Leave the build settings as they are.
5. **Before clicking Deploy**, open the **Environment Variables** section and add
   the 6 variables below (see 2b). Then click **Deploy**.

> If your project is **already** on Vercel, you don't re-import. You just push to
> GitHub (Part 1) and Vercel redeploys automatically. Add the env variables once
> in Settings → Environment Variables (2b), then redeploy.

### 2b. Add the 6 Environment Variables
In Vercel: **Project → Settings → Environment Variables**. Add each one (Name +
Value), and set it for **Production** (and Preview, if asked):

| Name | Value | What it is |
|------|-------|------------|
| `VITE_PAYMENT_PROVIDER` | `cashfree`  *(or `razorpay`)* | Which gateway is ON |
| `VITE_RAZORPAY_KEY_ID` | `rzp_live_T3Q0UifgGi1H6U` | Razorpay public key (safe) |
| `VITE_CASHFREE_MODE` | `production` | Cashfree mode |
| `CASHFREE_ENV` | `production` | Cashfree mode (server side) |
| `CASHFREE_APP_ID` | *(your Cashfree App ID)* | 🔒 secret |
| `CASHFREE_SECRET_KEY` | *(your Cashfree Secret, `cfsk_...`)* | 🔒 secret |

> Get the Cashfree App ID + Secret from your **Cashfree dashboard → Developers →
> API Keys** (these are the same values that are in your local
> `payments/config.php`).

### 2c. Deploy / Redeploy
- Click **Deploy** (first time), or **Deployments → ⋯ → Redeploy** (later).
- Wait ~1 minute. Vercel gives you a live URL like `your-store.vercel.app`.

### 2d. Test it
1. Open the live URL.
2. Add a product to cart → go to checkout → pay.
3. The active gateway's payment window should open and a payment should complete.
4. If it fails: Vercel → **Deployments → Functions** shows the exact error.

> Cashfree note: in your Cashfree dashboard, make sure your live keys are active
> and your Vercel domain is allowed/whitelisted, or live payments will be refused.

---

## PART 3 — Switch the payment gateway on the live site

You do **NOT** need to touch the code or re-upload anything. You just change one
setting in Vercel and redeploy. Takes 2 minutes.

### To switch the active gateway:
1. Go to **Vercel → your Project → Settings → Environment Variables**.
2. Find **`VITE_PAYMENT_PROVIDER`** and click **Edit**.
3. Change its value:
   - For Razorpay → type `razorpay`
   - For Cashfree → type `cashfree`
4. **Save**.
5. Go to **Deployments → top deployment → ⋯ (three dots) → Redeploy** → confirm.
6. Wait ~1 minute. The live site now uses the new gateway. ✅

> Why a redeploy is needed: the store is built once and the gateway choice is
> baked in at build time, so the site has to rebuild to pick up the change.

### Cheat sheet
| I want… | Set `VITE_PAYMENT_PROVIDER` to | Then |
|---------|-------------------------------|------|
| Razorpay live | `razorpay` | Redeploy |
| Cashfree live | `cashfree` | Redeploy |

---

## ❓ Quick FAQ

**Q: If `.env` isn't on GitHub, how does the live site get the keys?**
A: Vercel supplies them from the **Environment Variables** you typed in (Part 2b).
GitHub only carries the code; Vercel carries the secret values; Vercel combines
them when it builds. Your keys are never public.

**Q: Will both gateways work on Vercel?**
A: Yes. Razorpay works directly; Cashfree works through the `api/` functions
(`api/create-order.js`, `api/status.js`) that replaced the old PHP files.

**Q: Does this break my Hostinger site?**
A: No. The old PHP files are untouched, so Hostinger keeps working exactly as
before. The same code runs on both hosts.

**Q: I changed something in the code. How do I update the live site?**
A: Repeat Part 1 (commit + push in GitHub Desktop). Vercel redeploys on its own.
