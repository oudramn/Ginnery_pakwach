output "website_ip" {
  description = "Create an A record for domain_name pointing to this static address."
  value       = aws_eip.app.public_ip
}

output "website_url" {
  value = "https://${var.domain_name}"
}

output "instance_id" {
  value = aws_instance.app.id
}

output "backup_bucket" {
  value = aws_s3_bucket.backups.bucket
}

output "backup_kms_key_arn" {
  value = aws_kms_key.backups.arn
}

output "app_secret_arn" {
  description = "Store GINNERY_SECRET_KEY, GINNERY_ADMIN_USER, GINNERY_ADMIN_PASSWORD and GINNERY_ADMIN_EMAIL as a JSON secret value at this ARN."
  value       = aws_secretsmanager_secret.app.arn
}

output "deployment_bucket" {
  value = aws_s3_bucket.deploy.bucket
}
