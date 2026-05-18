package com.paulogandolfi.studyplatform.metrics.controller;

import com.paulogandolfi.studyplatform.metrics.dto.DashboardMetricsResponse;
import com.paulogandolfi.studyplatform.metrics.service.MetricsService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/metrics")
public class MetricsController {

    private final MetricsService metricsService;

    public MetricsController(MetricsService metricsService) {
        this.metricsService = metricsService;
    }

    @GetMapping("/dashboard")
    public DashboardMetricsResponse dashboard(@AuthenticationPrincipal Jwt jwt) {
        return metricsService.dashboard(currentUserId(jwt));
    }

    private static UUID currentUserId(Jwt jwt) {
        return UUID.fromString(jwt.getClaimAsString("userId"));
    }
}
