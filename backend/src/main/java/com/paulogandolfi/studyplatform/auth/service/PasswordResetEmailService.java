package com.paulogandolfi.studyplatform.auth.service;

import com.paulogandolfi.studyplatform.users.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class PasswordResetEmailService {

    private static final Logger LOGGER = LoggerFactory.getLogger(PasswordResetEmailService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final String frontendUrl;
    private final String fromAddress;
    private final String mailHost;

    public PasswordResetEmailService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${app.frontend-url}") String frontendUrl,
            @Value("${app.mail.from}") String fromAddress,
            @Value("${spring.mail.host:}") String mailHost
    ) {
        this.mailSenderProvider = mailSenderProvider;
        this.frontendUrl = frontendUrl;
        this.fromAddress = fromAddress;
        this.mailHost = mailHost;
    }

    public void sendPasswordReset(User user, String token) {
        String resetLink = UriComponentsBuilder.fromUriString(frontendUrl)
                .queryParam("resetToken", token)
                .build()
                .toUriString();

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null || mailHost == null || mailHost.isBlank()) {
            LOGGER.warn("Password reset requested for {}. Configure SMTP to send emails. Reset link: {}", user.getEmail(), resetLink);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(user.getEmail());
        message.setSubject("Recuperacao de senha - Study Platform");
        message.setText("""
                Ola, %s.

                Recebemos uma solicitacao para recuperar sua senha na Study Platform.
                Use o link abaixo para criar uma nova senha. Ele expira em 30 minutos.

                %s

                Se voce nao pediu isso, ignore este email.
                """.formatted(user.getName(), resetLink));

        mailSender.send(message);
    }
}
