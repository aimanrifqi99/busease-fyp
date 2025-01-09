import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/create-checkout-session', async (req, res) => {
  const { scheduleId, seatNumbers, totalPrice, email } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'myr',
            product_data: {
              name: `Booking for bus schedule`,
              description: `Seats: ${seatNumbers.join(', ')}`,
            },
            unit_amount: Math.round(totalPrice * 100),
          },
          quantity: 1,
        },
      ],
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating Stripe session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

export default router;
