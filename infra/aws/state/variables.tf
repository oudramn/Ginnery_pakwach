variable "aws_region" {
  type        = string
  description = "AWS region for Terraform state storage."
}

variable "resource_name" {
  type        = string
  description = "The same resource prefix used by the application stack."
  default     = "ginnery"
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,11}$", var.resource_name))
    error_message = "resource_name must be 3-12 lowercase letters, numbers or hyphens and start with a letter."
  }
}
