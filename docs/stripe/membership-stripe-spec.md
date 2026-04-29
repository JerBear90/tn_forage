# Stripe Membership Spec

## Plans
- Free
- Monthly Member
- Yearly Member
- Super User/Admin manually assigned

## Flow
1. User clicks Upgrade
2. Backend creates Stripe Checkout Session
3. User completes payment
4. Stripe webhook verifies event
5. PocketBase user membership updates
6. Frontend refreshes membership status

## Required Webhooks
- checkout.session.completed
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed

## Security
- Never grant membership from frontend
- Verify webhook signature
- Store Stripe secret server-side only
