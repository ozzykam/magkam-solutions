# Product Image Upload System

## Features

The ImageUploader component provides a comprehensive image management system for products:

### ✨ Key Features

1. **Multiple Image Upload**
   - Upload up to 5 images per product (configurable)
   - Drag-and-drop support
   - Click to browse files
   - Real-time upload progress bars

2. **Featured Image Selection**
   - First image is automatically the featured image
   - Click star icon to set any image as featured
   - Featured image is used in product listings

3. **Image Management**
   - Reorder images with left/right arrows
   - Delete images with confirmation
   - Visual preview grid
   - Hover overlay with action buttons

4. **Upload Validation**
   - File type validation (images only)
   - File size limit (5MB per image)
   - Maximum images limit
   - Error handling and user feedback

5. **Firebase Storage Integration**
   - Automatic upload to Firebase Storage
   - Unique file naming to prevent conflicts
   - Automatic cleanup on delete
   - Download URLs stored in Firestore

## Usage

```tsx
import ImageUploader from '@/components/admin/ImageUploader';

function ProductForm() {
  const [images, setImages] = useState<string[]>([]);

  return (
    <ImageUploader
      images={images}
      onChange={setImages}
      maxImages={5}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `images` | `string[]` | required | Array of image URLs |
| `onChange` | `(images: string[]) => void` | required | Callback when images change |
| `maxImages` | `number` | `5` | Maximum number of images allowed |

## Firebase Storage Setup

### 1. Enable Firebase Storage

In the Firebase Console:
1. Go to your project
2. Navigate to Storage
3. Click "Get Started"
4. Choose production mode
5. Select your storage location

### 2. Deploy Storage Rules

The storage rules are in `/storage.rules`. Deploy them:

```bash
firebase deploy --only storage
```

Or manually copy the rules from `storage.rules` to Firebase Console → Storage → Rules.

### 3. Important Security Notes

**Current Storage Rules:**
- ✅ Product images: Admins can upload/delete, everyone can read
- ✅ 5MB file size limit
- ✅ Image files only (validates MIME type)
- ❌ **IMPORTANT:** Custom claims (role) need to be set via Firebase Admin SDK

### Setting Up Custom Claims (Required for Admin Upload)

The storage rules check `request.auth.token.role`, which requires setting custom claims:

#### Option 1: Firebase Admin SDK (Recommended)

```typescript
// server-side code or Cloud Function
import * as admin from 'firebase-admin';

await admin.auth().setCustomUserClaims(userId, {
  role: 'admin'
});
```

#### Option 2: Temporary Workaround (Development Only)

For development, you can temporarily modify the storage rules to skip role check:

```
// Temporary rule - DEVELOPMENT ONLY
match /products/{imageName} {
  allow read: if true;
  allow write: if request.auth != null && isValidImage();
  allow delete: if request.auth != null;
}
```

**⚠️ Remember to revert to proper role-based rules in production!**

## File Structure

Images are stored in Firebase Storage with this structure:

```
/products/
  ├── {timestamp}_{randomId}_image1.jpg
  ├── {timestamp}_{randomId}_image2.jpg
  └── ...
```

## Image Upload Flow

1. **User selects files** (drag-drop or click)
2. **Validation** (file type, size, count)
3. **Upload to Firebase Storage** with progress tracking
4. **Get download URL** from Firebase
5. **Add URL to images array** (first position = featured)
6. **Save to Firestore** when form is submitted

## Supported Image Formats

- JPEG/JPG
- PNG
- GIF
- WebP
- SVG
- Any other image/* MIME type

## Limitations

- **Max file size:** 5MB per image
- **Max images:** 5 per product (configurable)
- **Storage path:** `/products/` folder

## Error Handling

The component handles various error scenarios:

- ✅ File too large (> 5MB)
- ✅ Wrong file type (not an image)
- ✅ Upload failures
- ✅ Delete failures (with graceful fallback)
- ✅ Maximum images exceeded

## Styling

The component uses Tailwind CSS and integrates with the existing UI components:
- Card for container
- Button for actions
- Badge for featured indicator
- LoadingSpinner for upload progress

## Future Enhancements

Potential improvements:

- [ ] Image cropping/editing
- [ ] Bulk upload optimization
- [ ] Image compression before upload
- [ ] Alt text for accessibility
- [ ] CDN integration
- [ ] Lazy loading thumbnails
- [ ] Advanced image optimization (WebP conversion)
