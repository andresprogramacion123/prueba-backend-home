# terraform/rds.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.0"
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "development"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "productos_db"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "productos_user"
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Random password for RDS
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# Secrets Manager secret
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "productos-api-db-credentials-${var.environment}"
  description             = "Database credentials for Productos API"
  recovery_window_in_days = 7

  tags = {
    Name        = "productos-api-db-credentials"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
    host     = aws_db_instance.productos_db.endpoint
    port     = aws_db_instance.productos_db.port
    dbname   = var.db_name
  })
}

# Security Group for RDS
resource "aws_security_group" "rds_sg" {
  name        = "productos-rds-sg-${var.environment}"
  description = "Security group for Productos RDS instance"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.default.cidr_block]
    description = "PostgreSQL access from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name        = "productos-rds-sg"
    Environment = var.environment
  }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "productos_db_subnet_group" {
  name       = "productos-db-subnet-group-${var.environment}"
  subnet_ids = data.aws_subnets.default.ids

  tags = {
    Name        = "productos-db-subnet-group"
    Environment = var.environment
  }
}

# RDS Parameter Group
resource "aws_db_parameter_group" "productos_db_params" {
  family = "postgres15"
  name   = "productos-db-params-${var.environment}"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # Log queries slower than 1 second
  }

  tags = {
    Name        = "productos-db-params"
    Environment = var.environment
  }
}

# RDS Instance
resource "aws_db_instance" "productos_db" {
  identifier = "productos-db-${var.environment}"

  # Engine configuration
  engine              = "postgres"
  engine_version      = "15.4"
  instance_class      = var.environment == "production" ? "db.t3.small" : "db.t3.micro"
  allocated_storage   = 20
  max_allocated_storage = 100
  storage_type        = "gp2"
  storage_encrypted   = true

  # Database configuration
  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result

  # Network configuration
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.productos_db_subnet_group.name
  publicly_accessible    = false

  # Backup configuration
  backup_retention_period = var.environment == "production" ? 7 : 3
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  # Monitoring and logging
  performance_insights_enabled = true
  monitoring_interval         = 60
  monitoring_role_arn        = aws_iam_role.rds_monitoring_role.arn
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  # Parameter group
  parameter_group_name = aws_db_parameter_group.productos_db_params.name

  # Multi-AZ for production
  multi_az = var.environment == "production"

  # Deletion protection
  deletion_protection = var.environment == "production"
  skip_final_snapshot = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "productos-db-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  tags = {
    Name        = "productos-db"
    Environment = var.environment
  }
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring_role" {
  name = "productos-rds-monitoring-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "productos-rds-monitoring-role"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring_policy" {
  role       = aws_iam_role.rds_monitoring_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Outputs
output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.productos_db.endpoint
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.productos_db.port
}

output "secrets_manager_arn" {
  description = "Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "security_group_id" {
  description = "RDS Security Group ID"
  value       = aws_security_group.rds_sg.id
}

output "db_subnet_group_name" {
  description = "Database subnet group name"
  value       = aws_db_subnet_group.productos_db_subnet_group.name
}