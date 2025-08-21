# Auto-Triage Testing Guide

## Issue: System assigning everything to humans instead of auto-closing

### Changes Made:
1. **Lowered confidence threshold** from 0.8 to 0.6
2. **Enhanced stub provider** to generate higher confidence scores
3. **Switched to stub mode** temporarily for testing
4. **Added debug logging** to see confidence scores and decisions

### Testing Steps:

#### 1. Test via API (using curl or Postman):

**Create a test ticket:**
```bash
curl -X POST "http://localhost:3000/api/tickets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Billing issue with my payment method",
    "description": "I am having trouble with my credit card payment. The charge was declined but I know my card is working. Can you help me resolve this billing issue?"
  }'
```

**Test classification directly:**
```bash
curl -X POST "http://localhost:3000/api/agent/debug/triage-test" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "text": "Billing issue with my payment method. The charge was declined but I know my card is working."
  }'
```

**Check recent suggestions:**
```bash
curl -X GET "http://localhost:3000/api/agent/debug/recent-suggestions?limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 2. Expected Results with Improved Stub Provider:

- **Billing keywords** (payment, credit card, charge, billing): Should get 85%+ confidence
- **Tech keywords** (error, bug, not working, issue): Should get 75%+ confidence  
- **Shipping keywords** (delivery, tracking, package): Should get 75%+ confidence
- **Multiple keywords**: Should get 85%+ confidence

#### 3. Current Configuration:
```
AUTO_CLOSE_ENABLED=true
CONFIDENCE_THRESHOLD=0.6 (lowered from 0.8)
LLM_PROVIDER=stub (temporarily for testing)
```

#### 4. Debug Output:
Check the server console logs for:
- `🎯 Stub confidence calculation:` - Shows how confidence is calculated
- `🏷️ Stub classification result:` - Shows classification results
- `🤖 Auto-close decision:` - Shows if ticket will be auto-closed

#### 5. What Should Happen:
1. Ticket with billing/tech/shipping keywords → High confidence (>0.6) → **Auto-closed**
2. Ticket with generic text → Medium confidence (0.5-0.6) → **Assigned to human**
3. Ticket with no keywords → Low confidence (<0.5) → **Escalated**

#### 6. Troubleshooting:
If still assigning to humans:
1. Check server logs for confidence scores
2. Verify AUTO_CLOSE_ENABLED=true
3. Check if there are available agents (may auto-assign instead of close)
4. Review ticket status after creation

#### 7. Switch Back to Gemini:
Once stub mode is working, change back to:
```
LLM_PROVIDER=gemini
STUB_MODE=false
```

And test with real Gemini AI to see confidence scores it generates.