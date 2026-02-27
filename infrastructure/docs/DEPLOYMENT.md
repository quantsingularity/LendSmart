# LendSmart Infrastructure Deployment Guide

## Prerequisites

### Required Tools

Install the following tools before deploying:

```bash
# Terraform (v1.6.6 or higher)
wget https://releases.hashicorp.com/terraform/1.6.6/terraform_1.6.6_linux_amd64.zip
unzip terraform_1.6.6_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# kubectl (Kubernetes CLI)
curl -LO "https://dl.k8s.io/release/v1.28.0/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Ansible (v2.14 or higher)
pip3 install ansible ansible-lint

# YAML validation tools
pip3 install yamllint

# AWS CLI (for AWS deployments)
pip3 install awscli

# Helm (optional, for Helm deployments)
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### Verify Installation

```bash
terraform version     # Should show v1.6.6+
kubectl version --client
ansible --version
yamllint --version
aws --version
```

## Deployment Overview

The infrastructure is organized into three main components:

1. **Terraform** - Cloud infrastructure provisioning (VPC, compute, database, storage)
2. **Kubernetes** - Container orchestration and microservices
3. **Ansible** - Configuration management and deployment automation

## Step-by-Step Deployment

### 1. Terraform - Cloud Infrastructure

#### A. Prepare Configuration

```bash
cd infrastructure/terraform

# Copy example variables file
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

**Required variables to configure:**

- `aws_region` - AWS region (e.g., us-west-2)
- `environment` - Environment name (dev, staging, prod)
- `app_name` - Application name (lendsmart)
- `project_name` - Project name (lendsmart)
- `db_username` - Database master username
- `db_password` - Database master password (use strong password!)

#### B. Validate Configuration

```bash
# Format all Terraform files
terraform fmt -recursive

# Initialize Terraform
terraform init -backend=false

# Validate configuration
terraform validate

# Preview changes
terraform plan -out=tfplan
```

Expected output:

```
Success! The configuration is valid.
```

#### C. Deploy Infrastructure

```bash
# Apply the plan
terraform apply tfplan

# Save outputs for later use
terraform output > ../terraform-outputs.txt
```

**Important Notes:**

- First run uses local state file
- For production, configure S3 backend (see backend.tf)
- Infrastructure deployment takes 10-15 minutes

### 2. Kubernetes - Container Orchestration

#### A. Prepare Secrets

```bash
cd infrastructure/kubernetes/base

# Copy example secrets
cp app-secrets.example.yaml app-secrets.yaml

# Edit secrets (base64 encode values)
nano app-secrets.yaml

# Example encoding:
echo -n 'postgresql://user:pass@host:5432/db' | base64
```

**Required secrets:**

- `DATABASE_URL` - Database connection string
- `JWT_SECRET` - JWT signing secret
- `API_KEY` - API key for external services
- `MYSQL_ROOT_PASSWORD` - MySQL root password
- `MYSQL_DATABASE` - Database name
- `MYSQL_USER` - MySQL application user
- `MYSQL_PASSWORD` - MySQL user password

#### B. Validate Manifests

```bash
cd infrastructure/kubernetes

# Lint YAML files
yamllint base/*.yaml rbac/*.yaml

# Dry-run apply
kubectl apply --dry-run=client -f base/
kubectl apply --dry-run=client -f rbac/
```

#### C. Deploy to Kubernetes

```bash
# Create namespace (optional)
kubectl create namespace lendsmart

# Apply RBAC resources
kubectl apply -f rbac/

# Apply secrets
kubectl apply -f base/app-secrets.yaml

# Apply base resources
kubectl apply -f base/

# Check deployment status
kubectl get pods -n default
kubectl get services -n default
kubectl get ingress -n default
```

**Verify Deployments:**

```bash
# Check pod status
kubectl get pods

# Check logs
kubectl logs -f deployment/lendsmart-backend
kubectl logs -f deployment/lendsmart-frontend

# Check services
kubectl get svc
```

### 3. Ansible - Configuration Management

#### A. Prepare Inventory

```bash
cd infrastructure/ansible

# Copy example inventory
cp inventory/hosts.example.yml inventory/hosts.yml

# Edit with your server IPs
nano inventory/hosts.yml

# Copy example variables
cp group_vars/all.example.yml group_vars/all.yml

# Edit variables
nano group_vars/all.yml
```

#### B. Test Connectivity

```bash
# Ping all hosts
ansible all -i inventory/hosts.yml -m ping

# Check Python version
ansible all -i inventory/hosts.yml -m shell -a "python3 --version"
```

Expected output:

```
web1 | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
```

#### C. Run Playbooks

```bash
# Dry-run (check mode)
ansible-playbook -i inventory/hosts.yml playbooks/main.yml --check

# Execute playbook
ansible-playbook -i inventory/hosts.yml playbooks/main.yml

# Security hardening (optional)
ansible-playbook -i inventory/hosts.yml playbooks/security_hardening.yml
```

## Environment-Specific Deployments

### Development

```bash
cd infrastructure/terraform
terraform workspace select dev || terraform workspace new dev
terraform apply -var-file="environments/dev/terraform.tfvars"

cd ../kubernetes
kubectl config use-context dev-cluster
kubectl apply -f base/ -f environments/dev/
```

### Staging

```bash
cd infrastructure/terraform
terraform workspace select staging || terraform workspace new staging
terraform apply -var-file="environments/staging/terraform.tfvars"

cd ../kubernetes
kubectl config use-context staging-cluster
kubectl apply -f base/ -f environments/staging/
```

### Production

```bash
cd infrastructure/terraform
terraform workspace select prod || terraform workspace new prod
terraform apply -var-file="environments/prod/terraform.tfvars"

cd ../kubernetes
kubectl config use-context prod-cluster
kubectl apply -f base/ -f environments/prod/
```

## Validation Commands

### Terraform Validation

```bash
cd infrastructure/terraform
terraform fmt -check -recursive
terraform init -backend=false
terraform validate
```

### Kubernetes Validation

```bash
cd infrastructure/kubernetes
yamllint base/*.yaml rbac/*.yaml
kubectl apply --dry-run=client -f base/
kubectl apply --dry-run=client -f rbac/
```

### Ansible Validation

```bash
cd infrastructure/ansible
ansible-lint playbooks/*.yml
ansible-playbook -i inventory/hosts.yml playbooks/main.yml --syntax-check
```

## Monitoring and Logging

### Check Deployment Status

```bash
# Kubernetes
kubectl get all -n default
kubectl top nodes
kubectl top pods

# Terraform
terraform show

# Ansible
ansible all -i inventory/hosts.yml -m setup
```

### View Logs

```bash
# Kubernetes logs
kubectl logs -f deployment/lendsmart-backend
kubectl logs -f deployment/lendsmart-frontend
kubectl logs -f statefulset/database

# System logs (via Ansible)
ansible webservers -i inventory/hosts.yml -m shell -a "journalctl -u nginx -n 50"
```

## Troubleshooting

### Terraform Issues

**Problem: "Backend initialization required"**

```bash
terraform init
```

**Problem: "Resource already exists"**

```bash
terraform import <resource_type>.<resource_name> <resource_id>
```

### Kubernetes Issues

**Problem: "ImagePullBackOff"**

```bash
kubectl describe pod <pod-name>
# Check image name and registry credentials
```

**Problem: "CrashLoopBackOff"**

```bash
kubectl logs <pod-name>
# Check application logs for errors
```

### Ansible Issues

**Problem: "SSH connection failed"**

```bash
# Test SSH manually
ssh -i ~/.ssh/lendsmart-key.pem ec2-user@<host-ip>

# Check SSH key permissions
chmod 600 ~/.ssh/lendsmart-key.pem
```

## Cleanup

### Destroy Resources

```bash
# Kubernetes
kubectl delete -f base/
kubectl delete -f rbac/

# Terraform
cd infrastructure/terraform
terraform destroy

# Confirm with 'yes' when prompted
```

## Security Best Practices

1. **Never commit secrets to Git**
   - Use `.gitignore` for `terraform.tfvars`, `hosts.yml`, `all.yml`
   - Use external secrets management (AWS Secrets Manager, Vault)

2. **Use strong passwords**
   - Generate random passwords: `openssl rand -base64 32`
   - Rotate credentials regularly

3. **Enable encryption**
   - Terraform state encryption (S3 + KMS)
   - Kubernetes secrets encryption at rest
   - Database encryption (RDS encryption enabled)

4. **Restrict network access**
   - Security groups allow only necessary ports
   - Use VPN or bastion host for SSH access
   - Enable network policies in Kubernetes

5. **Enable monitoring**
   - CloudWatch for AWS resources
   - Prometheus + Grafana for Kubernetes
   - ELK stack for log aggregation

## Change Log

See validation logs in `validation_logs/` directory for deployment verification outputs.
