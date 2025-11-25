package handler

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/salon-mate/backend/internal/repository"
	"github.com/salon-mate/backend/internal/service"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

type SignupRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
	Name     string `json:"name" validate:"required,min=1"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

type AuthResponse struct {
	User         UserResponse `json:"user"`
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
}

type UserResponse struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

func (h *AuthHandler) Signup(c echo.Context) error {
	var req SignupRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	if err := c.Validate(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	user, tokens, err := h.authService.Signup(c.Request().Context(), req.Email, req.Password, req.Name)
	if err != nil {
		if errors.Is(err, repository.ErrUserAlreadyExists) {
			return echo.NewHTTPError(http.StatusConflict, "Email already exists")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create user")
	}

	return c.JSON(http.StatusCreated, AuthResponse{
		User: UserResponse{
			ID:    user.ID.String(),
			Email: user.Email,
			Name:  user.Name,
		},
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
	})
}

func (h *AuthHandler) Login(c echo.Context) error {
	var req LoginRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	if err := c.Validate(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	user, tokens, err := h.authService.Login(c.Request().Context(), req.Email, req.Password)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			return echo.NewHTTPError(http.StatusUnauthorized, "Invalid email or password")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to login")
	}

	return c.JSON(http.StatusOK, AuthResponse{
		User: UserResponse{
			ID:    user.ID.String(),
			Email: user.Email,
			Name:  user.Name,
		},
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
	})
}

func (h *AuthHandler) Refresh(c echo.Context) error {
	var req RefreshRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	if err := c.Validate(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	tokens, err := h.authService.RefreshToken(c.Request().Context(), req.RefreshToken)
	if err != nil {
		if errors.Is(err, service.ErrInvalidToken) || errors.Is(err, service.ErrExpiredToken) {
			return echo.NewHTTPError(http.StatusUnauthorized, "Invalid or expired refresh token")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to refresh token")
	}

	return c.JSON(http.StatusOK, map[string]string{
		"access_token": tokens.AccessToken,
	})
}

func (h *AuthHandler) Me(c echo.Context) error {
	userID := c.Get("user_id")
	email := c.Get("email")

	if userID == nil || email == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "Not authenticated")
	}

	// Get user name from context or fetch from DB
	name := c.Get("name")
	if name == nil {
		name = ""
	}

	return c.JSON(http.StatusOK, UserResponse{
		ID:    userID.(string),
		Email: email.(string),
		Name:  name.(string),
	})
}

func (h *AuthHandler) Logout(c echo.Context) error {
	// In a stateless JWT setup, logout is handled client-side
	// But we can implement token blacklisting with Redis if needed
	return c.NoContent(http.StatusNoContent)
}
