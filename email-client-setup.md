# Email Client Setup - Wedding Counselors Outreach

## Exact Configuration Settings

### Account Settings (All 5 accounts):
```
Username: haylee@weddingcounselors.com (or respective account)
Password: 1relandS!

IMAP (Incoming):
- Server: mail.spacemail.com
- Port: 993
- Security: SSL/TLS
- Authentication: Normal password

SMTP (Outgoing):
- Server: mail.spacemail.com  
- Port: 465
- Security: SSL/TLS
- Authentication: Normal password
- Use same username/password
```

## Apple Mail Setup (Mac)

### Step 1: Add Account
1. Open Mail app
2. Mail > Add Account > Other Mail Account
3. Enter details:
   - **Name**: Haylee Mandarino (or your preferred name)
   - **Email**: haylee@weddingcounselors.com
   - **Password**: 1relandS!
4. Click "Sign In"

### Step 2: Configure Servers
If auto-detection fails:
1. **Incoming Mail Server**:
   - Account Type: IMAP
   - Mail Server: mail.spacemail.com
   - Username: haylee@weddingcounselors.com
   - Password: 1relandS!

2. **Outgoing Mail Server**:
   - SMTP Server: mail.spacemail.com
   - Username: haylee@weddingcounselors.com  
   - Password: 1relandS!

### Step 3: Advanced Settings
1. Go to Mail > Preferences > Accounts
2. Select your account
3. **Incoming Mail Server** tab:
   - Port: 993
   - Use SSL: ✓
   - Authentication: Password

4. **Outgoing Mail Server** tab:
   - Port: 465
   - Use SSL: ✓
   - Authentication: Password

## Outlook Setup (Windows/Mac)

### Step 1: Add Account
1. File > Add Account
2. Choose "Manual setup"
3. Select "POP or IMAP"

### Step 2: Account Settings
```
Your Name: Haylee Mandarino
Email Address: haylee@weddingcounselors.com

Incoming mail server: mail.spacemail.com
Account Type: IMAP
Port: 993
Encryption: SSL/TLS

Outgoing mail server: mail.spacemail.com
Port: 465
Encryption: SSL/TLS

Username: haylee@weddingcounselors.com
Password: 1relandS!
```

## Gmail App Setup (Mobile)

### Step 1: Add Non-Gmail Account
1. Open Gmail app
2. Menu > Settings > Add account
3. Choose "Other"

### Step 2: Manual Setup
```
Email: haylee@weddingcounselors.com
Password: 1relandS!

Incoming server settings:
- Username: haylee@weddingcounselors.com
- Password: 1relandS!
- Server: mail.spacemail.com
- Port: 993
- Security type: SSL/TLS

Outgoing server settings:
- SMTP server: mail.spacemail.com
- Port: 465
- Security type: SSL/TLS
- Username: haylee@weddingcounselors.com
- Password: 1relandS!
```

## Multiple Account Management

### Recommended Setup:
1. **Primary Device**: Configure haylee@ and lauren@ accounts
2. **Secondary Device**: Configure info@ account
3. **Mobile**: All accounts for monitoring replies

### Account Purposes:
- **haylee@**: Primary outreach (therapists/counselors)
- **lauren@**: Follow-ups and partnerships  
- **info@**: Customer service and general inquiries
- **jessie@**: Overflow/backup outreach
- **samantha@**: Reserved for scaling

## Folder Organization

### Create These Folders in Each Account:
- **Outreach-Sent** (for tracking sent emails)
- **Outreach-Replies** (for organizing responses)
- **Unsubscribes** (for compliance tracking)
- **Follow-ups** (for scheduling follow-ups)

### Email Rules to Set Up:
1. **Auto-sort replies**: If subject contains "Re:" → Move to Outreach-Replies
2. **Flag unsubscribes**: If body contains "unsubscribe" → Flag for review
3. **Priority responses**: If body contains "interested" → Mark important

## Reply Monitoring System

### Centralized Inbox Strategy:
1. **Forward all replies** to haylee@weddingcounselors.com
2. Set up **email rules** to auto-categorize
3. Use **shared folders** accessible from multiple devices
4. **Daily review** of all reply folders at 9 AM and 4 PM

### Auto-Forward Setup:
In each account (lauren@, info@, jessie@, samantha@):
1. Create rule: "Forward all received emails to haylee@weddingcounselors.com"
2. Keep original in account + send copy to haylee@
3. This ensures no replies are missed

## Testing Your Setup

### Send Test Emails:
1. Send from haylee@ to lauren@ 
2. Send from lauren@ to info@
3. Send from info@ to jessie@
4. Verify all accounts can send/receive
5. Test reply forwarding works

### Deliverability Test:
```python
# Use this simple test
python3 daily-outreach-script.py

# Choose option 2: Add new prospect
# Add a test contact (your personal email)
# Send test email and verify delivery
```

## Security Best Practices

### Account Security:
- Use **two-factor authentication** if available
- **Don't save passwords** in browsers
- Use **secure connections** only (SSL/TLS)
- **Log out** from shared computers

### Email Security:
- **Never include sensitive info** in outreach emails
- Use **BCC for bulk emails** (though we're doing individual sends)
- **Verify recipient** before sending
- **Keep unsubscribe list** updated

---

## Quick Start Checklist:

- [ ] Configure haylee@weddingcounselors.com in primary email client
- [ ] Test sending/receiving emails
- [ ] Set up reply forwarding from other accounts
- [ ] Create folder organization system
- [ ] Send 3 test emails to warm up account
- [ ] Verify Python script can send emails
- [ ] Set up daily review schedule (9 AM, 4 PM)

**Your accounts are now ready for professional outreach!**