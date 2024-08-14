import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth, currentUser } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe'; 
import { userSubscriptions } from '@/lib/db/schema'; 

const return_url = `${process.env.NEXT_BASE_URL}/`;

export async function GET() {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const _userSubscriptions = await db.select().from(userSubscriptions).where(eq(userSubscriptions.userId, userId));
        
        if (_userSubscriptions.length > 0 && _userSubscriptions[0].stripeCustomerId) {
            // User already has a Stripe customer ID; redirect to the billing portal
            const stripeSession = await stripe.billingPortal.sessions.create({
                customer: _userSubscriptions[0].stripeCustomerId,
                return_url
            });
            return NextResponse.json({ url: stripeSession.url });
        }

        // User is subscribing for the first time; create a checkout session
        const stripeSession = await stripe.checkout.sessions.create({
            success_url: return_url,
            cancel_url: return_url,
            payment_method_types: ['card'],
            mode: 'subscription',
            billing_address_collection: 'auto',
            customer_email: user?.emailAddresses[0].emailAddress,
            line_items: [
                {
                    price_data: {
                        currency: 'USD',
                        product_data: {
                            name: "Smart PDF Chat Pro",
                            description: "Unlimited PDF sessions!"
                        },
                        unit_amount: 2000,
                        recurring: {
                            interval: 'month'
                        },
                    },
                    quantity: 1
                }
            ],
            metadata: {
                userId
            }
        });
        return NextResponse.json({ url: stripeSession.url });
    } catch (error) {
        console.error('Stripe error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
