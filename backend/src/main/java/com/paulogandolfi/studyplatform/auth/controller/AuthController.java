package com.paulogandolfi.studyplatform.auth.controller;

import com.paulogandolfi.studyplatform.auth.dto.LoginUserRequest;
import com.paulogandolfi.studyplatform.auth.dto.LoginUserResponse;
import com.paulogandolfi.studyplatform.auth.dto.RegisterUserRequest;
import com.paulogandolfi.studyplatform.auth.dto.RegisterUserResponse;
import com.paulogandolfi.studyplatform.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public RegisterUserResponse register(@Valid @RequestBody RegisterUserRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public LoginUserResponse login(@Valid @RequestBody LoginUserRequest request) {
        return authService.login(request);
    }
}
