"""Cybully API service package."""

import socket

# Save the original getaddrinfo
_original_getaddrinfo = socket.getaddrinfo

def _patched_getaddrinfo(*args, **kwargs):
    # Determine the family requested
    family = socket.AF_UNSPEC
    if 'family' in kwargs:
        family = kwargs['family']
    elif len(args) > 2:
        family = args[2]
        
    responses = _original_getaddrinfo(*args, **kwargs)
    
    # If the user asked for AF_UNSPEC, filter out AF_INET6
    if family == socket.AF_UNSPEC:
        return [r for r in responses if r[0] != socket.AF_INET6]
    return responses

socket.getaddrinfo = _patched_getaddrinfo

