package validator

import (
	"net/http"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
)

type CustomValidator struct {
	validator *validator.Validate
}

func NewCustomValidator() *CustomValidator {
	return &CustomValidator{
		validator: validator.New(),
	}
}

func (cv *CustomValidator) Validate(i interface{}) error {
	if err := cv.validator.Struct(i); err != nil {
		// Convert validation errors to a more user-friendly format
		var messages []string
		for _, e := range err.(validator.ValidationErrors) {
			messages = append(messages, formatValidationError(e))
		}
		return echo.NewHTTPError(http.StatusBadRequest, strings.Join(messages, "; "))
	}
	return nil
}

func formatValidationError(e validator.FieldError) string {
	field := e.Field()
	tag := e.Tag()

	switch tag {
	case "required":
		return field + " is required"
	case "email":
		return field + " must be a valid email address"
	case "min":
		return field + " must be at least " + e.Param() + " characters"
	case "max":
		return field + " must be at most " + e.Param() + " characters"
	default:
		return field + " is invalid"
	}
}
