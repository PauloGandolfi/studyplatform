package com.paulogandolfi.studyplatform.auth.service;

import com.paulogandolfi.studyplatform.auth.dto.LoginUserRequest;
import com.paulogandolfi.studyplatform.auth.dto.LoginUserResponse;
import com.paulogandolfi.studyplatform.auth.dto.MessageResponse;
import com.paulogandolfi.studyplatform.auth.dto.RegisterUserRequest;
import com.paulogandolfi.studyplatform.auth.dto.RegisterUserResponse;
import com.paulogandolfi.studyplatform.auth.dto.ResetPasswordRequest;
import com.paulogandolfi.studyplatform.auth.entity.PasswordResetToken;
import com.paulogandolfi.studyplatform.auth.repository.PasswordResetTokenRepository;
import com.paulogandolfi.studyplatform.users.entity.User;
import com.paulogandolfi.studyplatform.users.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class AuthService {

    private static final String PASSWORD_RESET_RESPONSE = "Se o email existir, enviaremos um link de recuperacao.";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final GoogleTokenVerifier googleTokenVerifier;
    private final PasswordResetEmailService passwordResetEmailService;

    public AuthService(
            UserRepository userRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            GoogleTokenVerifier googleTokenVerifier,
            PasswordResetEmailService passwordResetEmailService
    ) {
        this.userRepository = userRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.googleTokenVerifier = googleTokenVerifier;
        this.passwordResetEmailService = passwordResetEmailService;
    }

    @Transactional
    public RegisterUserResponse register(RegisterUserRequest request) {
        String name = request.name().trim();
        String email = request.email().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        User user = new User(name, email, passwordEncoder.encode(request.password()));
        User savedUser = userRepository.save(user);

        return RegisterUserResponse.from(savedUser);
    }

    @Transactional(readOnly = true)
    public LoginUserResponse login(LoginUserRequest request) {
        String email = request.email().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(AuthService::invalidCredentials);

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw invalidCredentials();
        }

        return LoginUserResponse.from(user, jwtService.createToken(user));
    }

    @Transactional
    public LoginUserResponse loginWithGoogle(String idToken) {
        GoogleTokenVerifier.GoogleProfile profile = googleTokenVerifier.verify(idToken);

        User user = userRepository.findByEmail(profile.email())
                .orElseGet(() -> userRepository.save(new User(
                        profile.name().trim(),
                        profile.email().trim().toLowerCase(),
                        passwordEncoder.encode(generateToken())
                )));

        return LoginUserResponse.from(user, jwtService.createToken(user));
    }

    @Transactional
    public MessageResponse requestPasswordReset(String email) {
        String normalizedEmail = email.trim().toLowerCase();

        userRepository.findByEmail(normalizedEmail).ifPresent(user -> {
            passwordResetTokenRepository.findByUserAndUsedAtIsNull(user).forEach(PasswordResetToken::markUsed);

            String token = generateToken();
            PasswordResetToken resetToken = new PasswordResetToken(
                    user,
                    hashToken(token),
                    LocalDateTime.now().plusMinutes(30)
            );

            passwordResetTokenRepository.save(resetToken);
            passwordResetEmailService.sendPasswordReset(user, token);
        });

        return new MessageResponse(PASSWORD_RESET_RESPONSE);
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHashAndUsedAtIsNull(hashToken(request.token()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token de recuperacao invalido"));

        if (resetToken.isExpired()) {
            resetToken.markUsed();
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token de recuperacao expirado");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.password()));
        resetToken.markUsed();
        passwordResetTokenRepository.findByUserAndUsedAtIsNull(user).forEach(PasswordResetToken::markUsed);

        return new MessageResponse("Senha atualizada com sucesso.");
    }

    private static ResponseStatusException invalidCredentials() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
    }

    private static String generateToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }
}
