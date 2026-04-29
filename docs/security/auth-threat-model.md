# Auth Threat Model

## Assets
- User account
- GPS history
- Photos
- Expedition logs
- Membership status
- Super User tools

## Risks
- Token theft
- Membership spoofing
- Role escalation
- Offline sync tampering
- Sensitive GPS exposure
- Unsafe community advice

## Controls
- Server-side role checks
- Stripe webhook verification
- Ownership checks
- Private-by-default logs
- No frontend secrets
- Community flagging
