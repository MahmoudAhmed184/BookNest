# users/views/password_reset.py
from dj_rest_auth.views import PasswordResetView, PasswordResetConfirmView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

class CustomPasswordResetView(PasswordResetView):
    """Custom password reset view with standardized response"""
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            response_data = {
                "success": True,
                "message": "Password reset email sent successfully",
                "data": {
                    "detail": "If an account with this email exists, you will receive a password reset link."
                }
            }
            return Response(response_data, status=status.HTTP_200_OK)
            
        return response

class CustomPasswordResetConfirmView(PasswordResetConfirmView):
    """Custom password reset confirmation view"""
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            response_data = {
                "success": True,
                "message": "Password reset successful",
                "data": {
                    "detail": "Your password has been reset successfully. You can now login with your new password."
                }
            }
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            # Handle validation errors
            error_response = {
                "success": False,
                "message": "Password reset failed",
                "errors": response.data if hasattr(response, 'data') else {"detail": "Invalid token or passwords don't match"}
            }
            return Response(error_response, status=response.status_code)
            
        return response