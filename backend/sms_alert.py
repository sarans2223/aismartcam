from twilio.rest import Client
import os
from dotenv import load_dotenv

load_dotenv()

def send_alert(label, confidence):

    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_number = os.getenv("TWILIO_PHONE_NUMBER")

    numbers = os.getenv("ALERT_TO_NUMBER")

    if not numbers:
        print("❌ ALERT_TO_NUMBER not set in .env")
        return

    number_list = [num.strip() for num in numbers.split(",") if num.strip()]

    message_body = f"""
🚨 SENTINEL AI ALERT 🚨

Detection: {label}
Confidence: {confidence}%

Unknown person detected at entrance.
Time to check immediately.
"""

    client = Client(account_sid, auth_token)

    for number in number_list:
        try:
            print(f"📩 Sending SMS to {number}")

            message = client.messages.create(
                body=message_body,
                from_=from_number,
                to=number
            )

            print(f"✅ SMS Sent | SID: {message.sid}")

        except Exception as e:
            print(f"❌ Failed to send SMS to {number} | Error: {e}")

    return "SMS alerts sent"