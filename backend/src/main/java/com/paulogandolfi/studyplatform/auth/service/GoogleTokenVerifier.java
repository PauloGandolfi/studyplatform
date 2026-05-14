package com.paulogandolfi.studyplatform.auth.service;

import java.net.URL;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GoogleTokenVerifier {

    private static final String GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs";
    private static final List<String> ACCEPTED_ISSUERS = List.of("accounts.google.com", "https://accounts.google.com");

    private final String clientId;
    private final NimbusJwtDecoder jwtDecoder;

    public GoogleTokenVerifier(@Value("${app.google.client-id:}") String clientId) {
        this.clientId = clientId;
        this.jwtDecoder = NimbusJwtDecoder.withJwkSetUri(GOOGLE_CERTS_URL).build();
    }

    public GoogleProfile verify(String idToken) {
        if (clientId == null || clientId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Google login is not configured");
        }

        Jwt jwt;
        try {
            jwt = jwtDecoder.decode(idToken);
        } catch (JwtException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google token", exception);
        }

        if (!jwt.getAudience().contains(clientId)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google token audience");
        }

        URL issuer = jwt.getIssuer();
        if (issuer == null || !ACCEPTED_ISSUERS.contains(issuer.toString())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google token issuer");
        }

        Boolean emailVerified = jwt.getClaim("email_verified");
        if (!Boolean.TRUE.equals(emailVerified)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google email is not verified");
        }

        String email = jwt.getClaimAsString("email");
        String name = jwt.getClaimAsString("name");

        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google token does not include an email");
        }

        return new GoogleProfile(name == null || name.isBlank() ? email : name, email.toLowerCase());
    }

    public record GoogleProfile(String name, String email) {
    }
}
