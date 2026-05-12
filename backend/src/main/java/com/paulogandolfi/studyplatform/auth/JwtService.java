package com.paulogandolfi.studyplatform.auth;

import com.paulogandolfi.studyplatform.users.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

@Service
public class JwtService {

    private final JwtEncoder jwtEncoder;
    private final Duration expiration;

    public JwtService(JwtEncoder jwtEncoder, @Value("${app.jwt.expiration}") Duration expiration) {
        this.jwtEncoder = jwtEncoder;
        this.expiration = expiration;
    }

    public String createToken(User user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(expiration);

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("studyplatform-api")
                .subject(user.getEmail())
                .issuedAt(now)
                .expiresAt(expiresAt)
                .claim("userId", user.getId().toString())
                .claim("name", user.getName())
                .build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();

        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }
}
