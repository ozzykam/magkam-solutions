import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth-helpers';
import { getUsersWaitingForRestock, markRestockNotificationSent } from '@/services/wishlist-service';
import { getProductById } from '@/services/product-service';
import { sendBackInStockEmail } from '@/lib/email/email-service';

/**
 * API Route: Send restock notifications
 * POST /api/wishlist/send-restock-notifications
 *
 * Sends email notifications to all users waiting for a product to be restocked
 * Admin only
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get product details
    const product = await getProductById(productId);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product is actually in stock
    if (product.stock <= 0) {
      return NextResponse.json(
        { error: 'Product is not in stock. Cannot send restock notifications.' },
        { status: 400 }
      );
    }

    // Get all users waiting for restock notification
    const waitingUsers = await getUsersWaitingForRestock(productId);

    if (waitingUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users waiting for this product',
        notificationsSent: 0,
      });
    }

    // Send emails to all waiting users
    const results = {
      total: waitingUsers.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const user of waitingUsers) {
      try {
        await sendBackInStockEmail(user.userEmail, {
          customerName: user.userName,
          productName: product.name,
          productSlug: product.slug,
          productImage: product.images[0] || '',
          productPrice: product.onSale && product.salePrice ? product.salePrice : product.price,
          currentStock: product.stock,
        });

        // Mark notification as sent
        await markRestockNotificationSent(user.userId, productId);

        results.sent++;
        console.log(`[Restock Notification] Sent to ${user.userEmail} for product ${product.name}`);
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to send to ${user.userEmail}: ${error}`);
        console.error(`[Restock Notification] Error sending to ${user.userEmail}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${results.sent} of ${results.total} notifications`,
      results,
    });
  } catch (error) {
    console.error('[Restock Notification API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send restock notifications', details: error },
      { status: 500 }
    );
  }
}
