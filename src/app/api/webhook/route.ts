import Stripe from "stripe";
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { db } from "@/lib/db";
import { userSubscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const body = await req.text();
    const signature = headers().get('Stripe-Signature') as string;

    if (!process.env.STRIPE_WEBHOOK_SIGNING_SECRET) {
        return new NextResponse('Webhook secret not configured', { status: 500 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SIGNING_SECRET);
    } catch (error) {
        console.error('Webhook error:', error);
        return new NextResponse('Webhook error', { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    try {
        if (event.type === 'checkout.session.completed') {
            if (!session?.metadata?.userId) {
                return new NextResponse('no userId in metadata', { status: 400 });
            }

            const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
            await db.insert(userSubscriptions).values({
                userId: session.metadata.userId,
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: subscription.customer as string,
                stripePriceId: subscription.items.data[0].price.id,
                stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            });
        } else if (event.type === 'invoice.payment_succeeded') {
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
            await db.update(userSubscriptions).set({
                stripePriceId: subscription.items.data[0].price.id,
                stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            }).where(eq(userSubscriptions.stripeSubscriptionId, subscription.id));
        } else if (event.type === 'customer.subscription.deleted') {
            if (!session?.subscription) {
                return new NextResponse('No subscription in event', { status: 400 });
            }
            const subscriptionId = session.subscription as string;
            await db.delete(userSubscriptions).where(eq(userSubscriptions.stripeSubscriptionId, subscriptionId));
        }

    } catch (error) {
        console.error('Database or Stripe error:', error);
        return new NextResponse('Error handling event', { status: 500 });
    }

    return new NextResponse(null, { status: 200 });
}
