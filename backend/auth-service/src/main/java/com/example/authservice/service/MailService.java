package com.example.authservice.service;

import jakarta.mail.MessagingException;

import java.io.UnsupportedEncodingException;

public interface MailService {
    void sendMail(String subject, String to, String content, boolean isHtml) 
        throws MessagingException, UnsupportedEncodingException;
}
