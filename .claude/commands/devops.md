Design or review DevOps infrastructure, CI/CD pipelines, and deployment strategies.

## Process

1. **Infrastructure as Code Review**

   **Terraform/Pulumi/CloudFormation**
   - [ ] State management configured (remote backend)
   - [ ] Modules used for reusability
   - [ ] Variables externalized, no hardcoded values
   - [ ] Outputs defined for inter-module communication
   - [ ] Resource naming follows convention
   - [ ] Tags applied for cost tracking
   - [ ] Least privilege IAM policies

2. **CI/CD Pipeline Design**

   **Stages**
   ```yaml
   stages:
     - lint        # Code quality gates
     - test        # Unit, integration tests
     - build       # Compile, containerize
     - security    # SAST, dependency scan
     - deploy-dev  # Auto-deploy to dev
     - deploy-stg  # Manual gate to staging
     - deploy-prod # Manual gate + approval
   ```

   **Best Practices**
   - [ ] Pipeline as code (in repo)
   - [ ] Parallelized where possible
   - [ ] Caching for dependencies
   - [ ] Artifacts stored securely
   - [ ] Secrets injected, not stored
   - [ ] Rollback mechanism defined
   - [ ] Notifications on failure

3. **Container Strategy**

   **Dockerfile Review**
   - [ ] Multi-stage build for small images
   - [ ] Non-root user
   - [ ] Specific base image tags (not :latest)
   - [ ] Layer caching optimized
   - [ ] Health check defined
   - [ ] No secrets in image

   **Kubernetes**
   - [ ] Resource limits defined
   - [ ] Liveness/readiness probes
   - [ ] Pod disruption budget
   - [ ] Horizontal pod autoscaler
   - [ ] Network policies
   - [ ] Secrets via external store

4. **Deployment Strategies**
   - **Rolling**: Gradual replacement, zero downtime
   - **Blue/Green**: Instant switch, easy rollback
   - **Canary**: Gradual traffic shift, risk mitigation
   - **Feature Flags**: Decouple deploy from release

5. **Monitoring & Alerting**

   **Metrics (USE/RED)**
   - Utilization, Saturation, Errors (infrastructure)
   - Rate, Errors, Duration (services)

   **Alerting Rules**
   - [ ] SLO-based alerts (error budget)
   - [ ] Page only for actionable issues
   - [ ] Runbooks linked to alerts
   - [ ] Escalation path defined

6. **Security**
   - [ ] Secrets rotation automated
   - [ ] Network segmentation
   - [ ] WAF configured
   - [ ] DDoS protection
   - [ ] Backup and disaster recovery tested

7. **Output**
   Generate:
   - Pipeline YAML (GitHub Actions/GitLab CI)
   - Dockerfile
   - Kubernetes manifests or Helm chart
   - Terraform modules
   - Monitoring dashboards (Grafana JSON)

$ARGUMENTS
