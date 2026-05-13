package com.paulogandolfi.studyplatform.auth.service;

import com.paulogandolfi.studyplatform.auth.dto.LoginUserRequest;
import com.paulogandolfi.studyplatform.auth.dto.LoginUserResponse;
import com.paulogandolfi.studyplatform.auth.dto.RegisterUserRequest;
import com.paulogandolfi.studyplatform.auth.dto.RegisterUserResponse;
import com.paulogandolfi.studyplatform.users.entity.User;
import com.paulogandolfi.studyplatform.users.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
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

    private static ResponseStatusException invalidCredentials() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
    }
}
