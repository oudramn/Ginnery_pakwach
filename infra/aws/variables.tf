variable "aws_region" {
  description = "AWS region for the hotel site and backup bucket."
  type        = string
}

variable "domain_name" {
  description = "Existing public domain name that will point to the Elastic IP."
  type        = string
  validation {
    condition     = can(regex("^[A-Za-z0-9.-]+$", var.domain_name)) && length(var.domain_name) <= 253
    error_message = "Use a plain DNS hostname such as example.com or www.example.com."
  }
}

variable "resource_name" {
  description = "Short lowercase prefix used in AWS resource names."
  type        = string
  default     = "ginnery"
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,11}$", var.resource_name))
    error_message = "resource_name must be 3-12 lowercase letters, numbers or hyphens and start with a letter."
  }
}

variable "availability_zone" {
  description = "Optional Availability Zone; empty chooses the first available AZ in the selected region."
  type        = string
  default     = ""
}

variable "instance_type" {
  description = "EC2 size for the single-instance SQLite deployment. Review regional pricing before applying."
  type        = string
}

variable "root_volume_gb" {
  description = "Encrypted EC2 root volume size."
  type        = number
  default     = 30
  validation {
    condition     = var.root_volume_gb >= 20 && var.root_volume_gb <= 500
    error_message = "root_volume_gb must be between 20 and 500."
  }
}

variable "backup_prefix" {
  description = "S3 key prefix for encrypted backup objects."
  type        = string
  default     = "ginnery/production"
  validation {
    condition     = can(regex("^[A-Za-z0-9/_-]{1,180}$", trimsuffix(var.backup_prefix, "/")))
    error_message = "backup_prefix may contain letters, numbers, slash, underscore and hyphen."
  }
}

variable "backup_retention_days" {
  description = "S3 lifecycle expiry for current backups."
  type        = number
  default     = 30
  validation {
    condition     = var.backup_retention_days >= 30 && var.backup_retention_days <= 3650
    error_message = "backup_retention_days must be between 30 and 3650."
  }
}
