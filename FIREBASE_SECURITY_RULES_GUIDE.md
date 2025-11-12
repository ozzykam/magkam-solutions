# Firebase Security Rules Deployment Guide

This guide will help you deploy the Firestore and Storage security rules to your Firebase project.

## 📋 Overview

We've created two security rules files:
- **`firestore.rules`** - Secures your Firestore database
- **`storage.rules`** - Secures your Firebase Storage

These rules replace the current **TEST MODE** rules that allow anyone to read/write data.

---

## 🚨 CRITICAL: Why This Matters

**Current State:**
- Your Firestore and Storage are in TEST MODE
- Anyone can read, write, update, or delete ANY data
- This is a major security vulnerability

**After Deployment:**
- Only authenticated users can access their own data
- Admins have controlled access to manage the system
- Public data (products, categories) remains accessible
- User data is protected

---

## 📝 What the Rules Do

### Firestore Rules (`firestore.rules`)

**Public Read Access:**
- ✅ Products, Categories, Tags, Vendors (anyone can browse)
- ✅ Reviews (anyone can read)
- ✅ Time Slots (anyone can view availability)
- ✅ Store Settings (hours, contact info)

**User-Specific Access:**
- ✅ Users can read all profiles (for names, avatars)
- ✅ Users can update their own profile
- ✅ Users can view their own orders and refunds
- ✅ Users can manage their own cart
- ✅ Users can create reviews for products

**Admin/Employee Access:**
- ✅ Admins can manage products, categories, tags, vendors
- ✅ Employees can view and update orders
- ✅ Admins can manage users and refunds
- ✅ Admins can read contact messages

**Security Features:**
- 🔒 Users can only access their own data
- 🔒 Reviews require valid rating (1-5)
- 🔒 Order history is immutable
- 🔒 Role-based access control

### Storage Rules (`storage.rules`)

**Public Read Access:**
- ✅ Product images
- ✅ Category images
- ✅ Tag images
- ✅ Vendor images
- ✅ User avatars

**Upload Restrictions:**
- 🔒 Only admins can upload product/category/tag/vendor images
- 🔒 Users can only upload their own avatar
- 🔒 File size limits enforced (2-10MB depending on type)
- 🔒 Only image files allowed
- 🔒 Default deny for all other paths

---

## 🚀 Deployment Steps

### Option 1: Deploy via Firebase Console (Recommended for First Time)

#### Deploy Firestore Rules:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Firestore Database** in the left sidebar
4. Click the **Rules** tab at the top
5. Copy the entire contents of `firestore.rules`
6. Paste into the rules editor
7. Click **Publish**

#### Deploy Storage Rules:

1. In Firebase Console, click **Storage** in the left sidebar
2. Click the **Rules** tab at the top
3. Copy the entire contents of `storage.rules`
4. Paste into the rules editor
5. Click **Publish**



### Option 2: Deploy via Firebase CLI

If you have Firebase CLI installed:

```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not already done)
firebase init

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only Storage rules
firebase deploy --only storage:rules

# Or deploy both at once
firebase deploy --only firestore:rules,storage:rules
```

---

## ✅ Testing After Deployment

### Test Firestore Rules:

1. **Test Public Access:**
   - Open your website as a guest (not logged in)
   - Browse products, categories, vendors
   - ✅ Should work fine

2. **Test User Access:**
   - Log in as a regular user
   - Try to view your orders
   - ✅ Should see your own orders
   - Try to access `/admin` pages
   - ❌ Should be redirected (no access)

3. **Test Admin Access:**
   - Log in as an admin user
   - Go to admin dashboard
   - Try creating a product
   - ✅ Should work

### Test Storage Rules:

1. **Test Image Viewing:**
   - View product images on product pages
   - ✅ Should load fine

2. **Test Admin Upload:**
   - Log in as admin
   - Try uploading a product image
   - ✅ Should work

3. **Test Regular User Upload:**
   - Log in as regular user
   - Try uploading profile avatar
   - ✅ Should work
   - Try uploading product image
   - ❌ Should fail (not admin)

---

## 🔍 Firestore Indexes

After deploying rules, you may need to create indexes for certain queries. Firebase will show you error messages with direct links to create the required indexes.

**Known Indexes Needed:**

1. **Time Slots:**
   - Collection: `timeSlots`
   - Fields: `date` (ASC), `isAvailable` (ASC)
   - Fields: `date` (ASC), `startTime` (ASC)

2. **Orders:**
   - Collection: `orders`
   - Fields: `userId` (ASC), `createdAt` (DESC)

3. **Reviews:**
   - Collection: `reviews`
   - Fields: `productId` (ASC), `createdAt` (DESC)

**To create indexes:**
1. Watch the browser console for Firestore errors
2. Click the link in the error message
3. Firebase will auto-create the index

Or manually create them:
1. Go to Firebase Console → Firestore Database → Indexes
2. Click "Create Index"
3. Add the fields listed above

---

## 🛡️ Security Best Practices

### After Deployment:

1. **Never disable rules** - Even temporarily
2. **Test thoroughly** - Verify all user flows work
3. **Monitor usage** - Check Firebase Console for unauthorized access attempts
4. **Keep rules updated** - When adding new features, update rules accordingly

### For Your Users Collection:

Make sure each user document has a `role` field set correctly:
- `customer` - Regular users
- `employee` - Store employees
- `manager` - Store managers
- `admin` - Administrators
- `super_admin` - Super administrators

### Create Your First Admin:

Since rules are now locked down, you'll need an admin user. You can:

1. **Manually set role in Firebase Console:**
   - Go to Firestore Database
   - Find your user document in `users` collection
   - Edit the `role` field to `admin` or `super_admin`

2. **Or use a script** (run once):

```javascript
// Run in Firebase Console or as a Cloud Function
const admin = require('firebase-admin');
const db = admin.firestore();

async function setUserAsAdmin(email) {
  const usersSnapshot = await db.collection('users')
    .where('email', '==', email)
    .get();

  if (!usersSnapshot.empty) {
    const userDoc = usersSnapshot.docs[0];
    await userDoc.ref.update({
      role: 'super_admin'
    });
    console.log(`User ${email} is now a super admin!`);
  }
}

// Replace with your email
setUserAsAdmin('your-email@example.com');
```

---

## 📚 Rule Customization

If you need to customize the rules:

### Allow Employees to Do More:

In `firestore.rules`, look for `isEmployee()` function and add permissions:

```javascript
// Example: Allow employees to manage vendors
match /vendors/{vendorId} {
  allow read: if true;
  allow create, update, delete: if isEmployee(); // Changed from isAdmin()
}
```

### Change File Size Limits:

In `storage.rules`, modify the size checks:

```javascript
// Increase product image size limit to 10MB
match /products/{imageId} {
  allow write: if isAdmin() &&
                 request.resource.size < 10 * 1024 * 1024 && // Changed from 5MB
                 request.resource.contentType.matches('image/.*');
}
```

---

## ❓ Troubleshooting

### "Permission Denied" Errors:

1. **Check user is logged in** - Most operations require authentication
2. **Verify user role** - Admin operations require admin role
3. **Check the rule** - Make sure the rule allows the operation
4. **Clear cache** - Refresh browser, clear localStorage

### "Missing Index" Errors:

1. Click the link in the error message
2. Firebase will create the index automatically
3. Wait 1-2 minutes for index to build

### Rules Not Working:

1. **Verify deployment** - Check Firebase Console to see if rules are live
2. **Check syntax** - Rules editor will show syntax errors
3. **Test in Rules Playground** - Firebase Console has a rule testing tool

---

## 🎯 Next Steps

After deploying rules:

1. ✅ Test all major user flows
2. ✅ Create at least one admin user
3. ✅ Verify images still load
4. ✅ Test admin dashboard functionality
5. ✅ Monitor Firebase Console for errors
6. ✅ Create required Firestore indexes

---

## 📞 Support

If you encounter issues:

1. Check Firebase Console for error messages
2. Use the Rules Playground to test specific scenarios
3. Review Firebase documentation: https://firebase.google.com/docs/rules

---

**Remember:** These rules are CRITICAL for production. Do not skip this step!
