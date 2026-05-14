package com.paulogandolfi.studyplatform.auth.repository;

import com.paulogandolfi.studyplatform.auth.entity.PasswordResetToken;
import com.paulogandolfi.studyplatform.users.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    Optional<PasswordResetToken> findByTokenHashAndUsedAtIsNull(String tokenHash);

    List<PasswordResetToken> findByUserAndUsedAtIsNull(User user);
}
