import re
with open(r'c:\Users\saran\Desktop\sentinal-ai\backend\detector.py') as f:
    for i, line in enumerate(f, start=1):
        if 'send_alert' in line:
            print(i, line.rstrip())
