# Deployment Runbook

## 1. Purpose

This runbook provides a step-by-step guide for deploying new versions of the LendSmart application to various environments (Development, Staging, Production). It aims to ensure consistent, reliable, and secure deployments with minimal downtime.

## 2. Prerequisites

Before initiating a deployment, ensure the following:

- All code changes have been reviewed and merged into the appropriate branch (e.g., `develop` for Dev, `main` for Staging/Prod).
- All automated tests (unit, integration, end-to-end) have passed successfully.
- Container images for the new application version have been built and pushed to the container registry.
- Any necessary database migrations or schema changes have been reviewed and are ready for application.
- Relevant team members have been notified of the upcoming deployment.
- Access to the target Kubernetes cluster and Helm is configured.

## 3. Deployment Workflow

### 3.1. Development Environment Deployment

- **Trigger:** Automatically triggered on every push to the `develop` branch.
- **Process:**
    1.  CI/CD pipeline builds new Docker images for frontend and backend.
    2.  Images are pushed to the container registry.
    3.  Helm chart is updated with the new image tags.
    4.  `helm upgrade --install lend-smart-dev ./helm/lend-smart --namespace dev -f ./helm/lend-smart/values-dev.yaml` is executed.
    5.  Verify deployment success by checking pod status and application logs.
    6.  Perform basic smoke tests on the deployed application.

### 3.2. Staging Environment Deployment

- **Trigger:** Manual trigger from the CI/CD pipeline after successful `main` branch merge.
- **Process:**
    1.  Ensure all features for the release are merged into `main`.
    2.  CI/CD pipeline builds new Docker images for frontend and backend.
    3.  Images are pushed to the container registry.
    4.  Helm chart is updated with the new image tags.
    5.  `helm upgrade --install lend-smart-staging ./helm/lend-smart --namespace staging -f ./helm/lend-smart/values-staging.yaml` is executed.
    6.  **Pre-Deployment Checks:**
        - Verify database backups are up-to-date.
        - Confirm monitoring and alerting systems are operational.
    7.  **Deployment Strategy:** Blue/Green or Canary deployment (if configured).
    8.  Verify deployment success by checking pod status, application logs, and monitoring dashboards.
    9.  Conduct comprehensive QA and user acceptance testing (UAT).
    10. Monitor application performance and error rates closely.

### 3.3. Production Environment Deployment

- **Trigger:** Manual trigger from the CI/CD pipeline, typically after a successful tag (e.g., `v1.0.0`) is pushed to `main`.
- **Process:**
    1.  Ensure Staging environment testing is complete and signed off.
    2.  **Pre-Deployment Checks:**
        - Verify database backups are up-to-date and a rollback plan is in place.
        - Confirm monitoring and alerting systems are operational and configured for production.
        - Notify all relevant stakeholders of the production deployment window.
    3.  **Deployment Strategy:** Blue/Green or Canary deployment (recommended for production).
        - **Blue/Green:** Deploy new version (Green) alongside current (Blue). Once Green is verified, switch traffic. Keep Blue for quick rollback.
        - **Canary:** Deploy new version to a small subset of users. Monitor performance and errors. Gradually increase traffic to new version.
    4.  Execute `helm upgrade --install lend-smart-prod ./helm/lend-smart --namespace prod -f ./helm/lend-smart/values-prod.yaml`.
    5.  Verify deployment success by checking pod status, application logs, and monitoring dashboards.
    6.  Conduct post-deployment smoke tests.
    7.  Monitor application performance, error rates, and key business metrics closely for the first few hours/days.
    8.  **Rollback Plan:** If critical issues are detected, immediately initiate rollback to the previous stable version.

## 4. Rollback Procedure

In case of critical issues during or after deployment:

1.  **Identify the problem:** Confirm the issue and its impact.
2.  **Initiate Rollback:**
    - **Blue/Green:** Switch traffic back to the previous stable (Blue) environment.
    - **Canary:** Stop traffic to the new version and revert to the previous stable version.
    - **Standard Deployment:** Revert the Helm chart to the previous working version:
      `helm rollback lend-smart-prod <REVISION_NUMBER>`
3.  **Verify Rollback:** Ensure the application is functioning correctly on the previous version.
4.  **Post-Rollback Analysis:** Conduct a root cause analysis to understand why the deployment failed and implement corrective actions before the next deployment attempt.

## 5. Communication

- **Pre-Deployment:** Notify relevant teams (QA, Product, Support) about planned deployments.
- **During Deployment:** Provide real-time updates on progress and any issues encountered.
- **Post-Deployment:** Announce successful deployment or any necessary rollbacks.

## 6. Tools Used

- **CI/CD:** GitLab CI/CD
- **Container Orchestration:** Kubernetes
- **Package Manager:** Helm
- **Monitoring:** Prometheus, Grafana
- **Logging:** Fluentd

## 7. Review and Updates

This runbook will be reviewed and updated periodically, especially after any changes to the deployment process, infrastructure, or tools.
