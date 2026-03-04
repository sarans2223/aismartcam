from twilio.rest import Client
import os
from dotenv import load_dotenv

load_dotenv()

def call_police():
    client = Client(
        os.getenv("TWILIO_ACCOUNT_SID"),
        os.getenv("TWILIO_AUTH_TOKEN")
    )

    from_number = os.getenv("TWILIO_PHONE_NUMBER")
    police_number = os.getenv("POLICE_NUMBER")

    print("🚔 Calling Police:", police_number)

    call = client.calls.create(
        twiml='<Response><Say>Emergency alert. Unknown person detected at the entrance.</Say></Response>',
        from_=from_number,
        to=police_number
    )

    print("CALL SID:", call.sid)
    return call.sid


def call_family():
    client = Client(
        os.getenv("TWILIO_ACCOUNT_SID"),
        os.getenv("TWILIO_AUTH_TOKEN")
    )

    from_number = os.getenv("TWILIO_PHONE_NUMBER")
    family_numbers = os.getenv("FAMILY_NUMBERS")

    numbers = [n.strip() for n in family_numbers.split(",")]

    for number in numbers:
        print("👨‍👩‍👧 Calling Family:", number)

        call = client.calls.create(
            twiml='<Response><Say>Alert. Unknown person detected at your house entrance.</Say></Response>',
            from_=from_number,
            to=number
        )

        print("CALL SID:", call.sid)

    return "Family calls triggered"