import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required to purchase" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { paymentMethod = "WALLET", paymentReference, referralCode } = body;

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: { seller: { include: { wallet: true } } },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if buyer already owns entitlement
    const existing = await prisma.entitlement.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId: product.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "You already own this item.",
        downloadUrl: product.downloadUrl,
      });
    }

    // If paying via internal wallet, ensure buyer has sufficient funds
    let buyerWallet: any = null;
    if (paymentMethod === "WALLET") {
      buyerWallet = await prisma.wallet.findUnique({
        where: { userId: user.id },
      });

      if (!buyerWallet || buyerWallet.availableBalance < product.price) {
        return NextResponse.json(
          {
            error: `Insufficient wallet balance. You have ${buyerWallet?.availableBalance || 0} RWF. Please deposit funds or choose Flutterwave.`,
          },
          { status: 400 }
        );
      }
    }

    const settings = await getSiteSettings();
    const platformCommissionPercent = Number(settings.commission_rate) || 10;
    const platformFee = (product.price * platformCommissionPercent) / 100;
    const sellerEarning = product.price - platformFee;

    // Check for affiliate referral
    const isReferralActive = settings.referral_system_enabled !== "false";
    const refRate = Number(settings.referral_commission_rate) || 5;
    const isMlmActive = settings.multilevel_referral_enabled !== "false";
    const mlmLevel2Rate = Number(settings.multilevel_level2_rate) || 3;
    const mlmLevel3Rate = Number(settings.multilevel_level3_rate) || 1;

    let directAffiliate: any = null;
    if (isReferralActive) {
      if (referralCode) {
        directAffiliate = await prisma.user.findUnique({
          where: { referralCode },
          include: { wallet: true },
        });
      } else if (user.referredById) {
        directAffiliate = await prisma.user.findUnique({
          where: { id: user.referredById },
          include: { wallet: true },
        });
      }
    }

    // Cannot self-refer or refer own product
    if (directAffiliate && (directAffiliate.id === user.id || directAffiliate.id === product.sellerId)) {
      directAffiliate = null;
    }

    // Execute purchase & commissions inside atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Deduct from buyer wallet if paying via WALLET
      if (paymentMethod === "WALLET" && buyerWallet) {
        await tx.wallet.update({
          where: { id: buyerWallet.id },
          data: { availableBalance: { decrement: product.price } },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: buyerWallet.id,
            type: "SALE",
            amount: -product.price,
            fee: 0,
            netAmount: -product.price,
            status: "COMPLETED",
            referenceId: `buy-${product.id.slice(0, 8)}-${Date.now()}`,
            description: `Purchase of digital product: "${product.title}"`,
          },
        });
      }

      // 2. Create Order
      const order = await tx.order.create({
        data: {
          buyerId: user.id,
          totalAmount: product.price,
          status: "COMPLETED",
          paymentMethod,
          paymentStatus: "PAID",
          paymentReference: paymentReference || null,
          items: {
            create: {
              productId: product.id,
              price: product.price,
            },
          },
        },
      });

      // 3. Grant Entitlement
      const entitlement = await tx.entitlement.create({
        data: {
          userId: user.id,
          productId: product.id,
        },
      });

      // 4. Update product sales count
      await tx.product.update({
        where: { id: product.id },
        data: { salesCount: { increment: 1 } },
      });

      // 5. Credit seller wallet & ledger
      if (product.seller.wallet) {
        await tx.wallet.update({
          where: { id: product.seller.wallet.id },
          data: {
            availableBalance: { increment: sellerEarning },
            totalEarnings: { increment: sellerEarning },
          },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: product.seller.wallet.id,
            type: "SALE",
            amount: product.price,
            fee: platformFee,
            netAmount: sellerEarning,
            status: "COMPLETED",
            referenceId: order.id,
            description: `Sale earnings for product: "${product.title}"`,
          },
        });
      }

      // 6. Direct Referral Commission (Level 1)
      if (directAffiliate) {
        const level1Commission = (product.price * refRate) / 100;
        if (level1Commission > 0) {
          const affWallet = await tx.wallet.upsert({
            where: { userId: directAffiliate.id },
            create: {
              userId: directAffiliate.id,
              availableBalance: level1Commission,
              totalEarnings: level1Commission,
              currency: settings.currency || "RWF",
            },
            update: {
              availableBalance: { increment: level1Commission },
              totalEarnings: { increment: level1Commission },
            },
          });

          await tx.walletTransaction.create({
            data: {
              walletId: affWallet.id,
              type: "REFERRAL_COMMISSION",
              amount: level1Commission,
              fee: 0,
              netAmount: level1Commission,
              status: "COMPLETED",
              referenceId: order.id,
              description: `Affiliate Commission for shared product: "${product.title}"`,
            },
          });

          // Level 2 Multi-Level Commission
          if (isMlmActive && directAffiliate.referredById) {
            const level2User = await tx.user.findUnique({
              where: { id: directAffiliate.referredById },
              include: { wallet: true },
            });

            if (level2User && level2User.id !== user.id && level2User.id !== product.sellerId) {
              const level2Commission = (product.price * mlmLevel2Rate) / 100;
              if (level2Commission > 0) {
                const l2Wallet = await tx.wallet.upsert({
                  where: { userId: level2User.id },
                  create: {
                    userId: level2User.id,
                    availableBalance: level2Commission,
                    totalEarnings: level2Commission,
                    currency: settings.currency || "RWF",
                  },
                  update: {
                    availableBalance: { increment: level2Commission },
                    totalEarnings: { increment: level2Commission },
                  },
                });

                await tx.walletTransaction.create({
                  data: {
                    walletId: l2Wallet.id,
                    type: "REFERRAL_COMMISSION",
                    amount: level2Commission,
                    fee: 0,
                    netAmount: level2Commission,
                    status: "COMPLETED",
                    referenceId: order.id,
                    description: `Level 2 Affiliate Commission for product: "${product.title}"`,
                  },
                });

                // Level 3 Multi-Level Commission
                if (level2User.referredById) {
                  const level3User = await tx.user.findUnique({
                    where: { id: level2User.referredById },
                  });

                  if (level3User && level3User.id !== user.id && level3User.id !== product.sellerId) {
                    const level3Commission = (product.price * mlmLevel3Rate) / 100;
                    if (level3Commission > 0) {
                      const l3Wallet = await tx.wallet.upsert({
                        where: { userId: level3User.id },
                        create: {
                          userId: level3User.id,
                          availableBalance: level3Commission,
                          totalEarnings: level3Commission,
                          currency: settings.currency || "RWF",
                        },
                        update: {
                          availableBalance: { increment: level3Commission },
                          totalEarnings: { increment: level3Commission },
                        },
                      });

                      await tx.walletTransaction.create({
                        data: {
                          walletId: l3Wallet.id,
                          type: "REFERRAL_COMMISSION",
                          amount: level3Commission,
                          fee: 0,
                          netAmount: level3Commission,
                          status: "COMPLETED",
                          referenceId: order.id,
                          description: `Level 3 Affiliate Commission for product: "${product.title}"`,
                        },
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }

      return { order, entitlement };
    });

    // In-App Notifications
    // Notify seller
    await prisma.notification.create({
      data: {
        userId: product.sellerId,
        type: "SALE",
        title: "Digital Product Sold! 🎉",
        message: `Your item "${product.title}" was purchased. Earnings of ${sellerEarning} RWF credited to your wallet.`,
        link: `/dashboard/wallet`,
      },
    });

    // Notify direct affiliate if applicable
    if (directAffiliate) {
      const comm = (product.price * refRate) / 100;
      await prisma.notification.create({
        data: {
          userId: directAffiliate.id,
          type: "SALE",
          title: "Affiliate Commission Earned! 🚀",
          message: `Someone purchased "${product.title}" through your shared referral link! You earned ${comm} RWF in your wallet.`,
          link: `/dashboard/wallet`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      order: result.order,
      downloadUrl: product.downloadUrl,
    });
  } catch (error: any) {
    console.error("Purchase error:", error);
    return NextResponse.json({ error: "Failed to complete purchase" }, { status: 500 });
  }
}
