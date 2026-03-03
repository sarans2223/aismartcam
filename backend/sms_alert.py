from datetime import datetime
from twilio.rest import Client
import os
from dotenv import load_dotenv

load_dotenv()  # Load .env file

account_sid = os.getenv("TWILIO_ACCOUNT_SID")
auth_token = os.getenv("TWILIO_AUTH_TOKEN")
twilio_phone = os.getenv("TWILIO_PHONE_NUMBER")
alert_phone = os.getenv("ALERT_PHONE_NUMBER")

client = Client(account_sid, auth_token)

def send_alert(label=None, confidence=None):
    """Send an SMS alert via Twilio.

    Args:
        label: Optional label or identity detected.
        confidence: Optional confidence score as percentage.
    """
    # ensure credentials are available
    if not account_sid or not auth_token or not twilio_phone or not alert_phone:
        print("⚠️ Twilio credentials not configured; skipping SMS")
        return

    body = "🚨 ALERT: Unknown person detected in Your Home!"
    if label is not None:
        body += f" Label={label}"
    if confidence is not None:
        body += f" ({confidence:.2f}%)"

    try:
        message = client.messages.create(
            body=body,
            from_=twilio_phone,
            to=alert_phone
        )
        print("SMS Sent:", message.sid)
    except Exception as e:
        print(f"⚠️ Twilio send failed: {e}")