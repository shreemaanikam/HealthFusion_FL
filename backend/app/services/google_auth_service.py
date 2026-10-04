from google.oauth2 import id_token
from google.auth.transport import requests
from fastapi import HTTPException
from app.config import get_settings

settings = get_settings()

def verify_google_token(token: str) -> dict:
    if not settings.GOOGLE_CLIENT_ID:
        # If client ID is missing in config, reject authentication to prevent abuse
        raise HTTPException(status_code=500, detail="Google authentication is not configured on the server.")

    try:
        # Verify the token using Google's library.
        # This checks signature, expiration, and audience.
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), settings.GOOGLE_CLIENT_ID)

        # Check issuer
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')
            
        # Verify email is verified by Google
        if not idinfo.get('email_verified', False):
            raise ValueError('Email not verified by Google.')

        return idinfo
    except ValueError as e:
        # Invalid token
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")
