import json
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


def _load_from_file(path: str):
    file_path = Path(path).expanduser()
    if not file_path.is_absolute():
        file_path = Path.cwd() / file_path
    if not file_path.exists():
        raise FileNotFoundError(f"Accounts file not found: {file_path}")
    with open(file_path, 'r', encoding='utf-8') as handle:
        return json.load(handle)


def load_outreach_accounts():
    """Load outreach account credentials from OUTREACH_ACCOUNTS_JSON or OUTREACH_ACCOUNTS_FILE."""
    raw = os.getenv('OUTREACH_ACCOUNTS_JSON') or os.getenv('OUTREACH_ACCOUNTS')
    path = os.getenv('OUTREACH_ACCOUNTS_FILE')

    accounts = None
    if path:
        accounts = _load_from_file(path)
    elif raw:
        accounts = json.loads(raw)

    if not isinstance(accounts, dict) or not accounts:
        raise ValueError('No outreach accounts configured. Set OUTREACH_ACCOUNTS_JSON or OUTREACH_ACCOUNTS_FILE.')

    for name, account in accounts.items():
        if not isinstance(account, dict):
            raise ValueError(f"Account entry for {name} must be a dict")
        if not account.get('email') or not account.get('password'):
            raise ValueError(f"Account {name} missing email or password")

    return accounts
