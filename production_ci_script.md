```yml

name: 🚀 Production CI/CD Pipeline

on:
  push:
    branches: [main, develop]
    paths-ignore:
      - '**.md'
      - 'docs/**'
  pull_request:
    branches: [main, develop]
    types: [opened, synchronize, reopened]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # Security and Code Quality Checks
  security-scan:
    name: 🔒 Security & Quality Scan
    runs-on: ubuntu-latest
    
    steps:
      - name: ⬇️ Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: 🧰 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: 📦 Install dependencies
        run: npm ci

      - name: 🔍 Run security audit
        run: npm audit --audit-level=moderate

      - name: 🛡️ Run Snyk security scan
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      - name: 📊 SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

  # Testing Jobs
  test:
    name: 🧪 Test Suite
    runs-on: ubuntu-latest
    needs: security-scan
    
    strategy:
      matrix:
        node-version: [16, 18, 20]
        
    steps:
      - name: ⬇️ Checkout repository
        uses: actions/checkout@v4

      - name: 🧰 Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: 📦 Install dependencies
        run: npm ci

      - name: 🧪 Run unit tests
        run: npm run test:ci

      - name: 🧪 Run integration tests
        run: npm run test:integration

      - name: 📊 Generate coverage report
        run: npm run test:coverage

      - name: 📤 Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

  # Code Quality and Linting
  lint-and-format:
    name: 🎨 Lint & Format Check
    runs-on: ubuntu-latest
    needs: security-scan
    
    steps:
      - name: ⬇️ Checkout repository
        uses: actions/checkout@v4

      - name: 🧰 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: 📦 Install dependencies
        run: npm ci

      - name: 🎨 Run ESLint
        run: npm run lint:check

      - name: 💅 Check Prettier formatting
        run: npm run format:check

      - name: 🏷️ Check TypeScript types
        run: npm run type-check

      - name: 📝 Run spell check
        run: npm run spell-check

  # Build and Docker
  build:
    name: 🏗️ Build Application
    runs-on: ubuntu-latest
    needs: [test, lint-and-format]
    
    outputs:
      image-digest: ${{ steps.build.outputs.digest }}
      image-tag: ${{ steps.meta.outputs.tags }}
      
    steps:
      - name: ⬇️ Checkout repository
        uses: actions/checkout@v4

      - name: 🧰 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: 📦 Install dependencies
        run: npm ci

      - name: 🏗️ Build Next.js application
        run: npm run build
        env:
          NODE_ENV: production

      - name: 🧪 Test build artifacts
        run: |
          ls -la .next/
          npm run start &
          sleep 10
          curl -f http://localhost:3000 || exit 1
          pkill -f "npm run start"

      - name: 📤 Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: |
            .next/
            public/
            package.json
          retention-days: 30

      # Docker Build and Push
      - name: 🐳 Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: 🔐 Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: 🏷️ Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: 🏗️ Build and push Docker image
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            NODE_ENV=production
            BUILD_DATE=${{ github.event.head_commit.timestamp }}
            VCS_REF=${{ github.sha }}

  # Performance Testing
  performance-test:
    name: ⚡ Performance Testing
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'pull_request'
    
    steps:
      - name: ⬇️ Checkout repository
        uses: actions/checkout@v4

      - name: 🧰 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: 📦 Install dependencies
        run: npm ci

      - name: 🏗️ Build application
        run: npm run build

      - name: 🚀 Start application
        run: npm start &
        
      - name: ⏳ Wait for application
        run: npx wait-on http://localhost:3000

      - name: 🔍 Run Lighthouse CI
        run: |
          npm install -g @lhci/cli@0.12.x
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

      - name: 📊 Run load testing
        run: |
          npm install -g artillery
          artillery quick --count 10 --num 25 http://localhost:3000

  # Deployment Jobs
  deploy-staging:
    name: 🚀 Deploy to Staging
    runs-on: ubuntu-latest
    needs: [build, performance-test]
    if: github.ref == 'refs/heads/develop' || github.event.inputs.environment == 'staging'
    environment: 
      name: staging
      url: https://staging.yourapp.com
      
    steps:
      - name: 🚀 Deploy to staging
        run: |
          echo "Deploying to staging environment..."
          # Add your deployment commands here
          # kubectl apply -f k8s/staging/
          # or terraform apply -var="environment=staging"

  deploy-production:
    name: 🚀 Deploy to Production
    runs-on: ubuntu-latest
    needs: [build]
    if: github.ref == 'refs/heads/main' || github.event.inputs.environment == 'production'
    environment: 
      name: production
      url: https://yourapp.com
      
    steps:
      - name: 🚀 Deploy to production
        run: |
          echo "Deploying to production environment..."
          # Add your deployment commands here
          # kubectl apply -f k8s/production/
          # or terraform apply -var="environment=production"

      - name: 📧 Notify deployment success
        uses: 8398a7/action-slack@v3
        with:
          status: success
          channel: '#deployments'
          text: '🎉 Production deployment successful!'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

  # Post-deployment validation
  post-deployment-tests:
    name: 🔍 Post-Deployment Validation
    runs-on: ubuntu-latest
    needs: [deploy-production]
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: ⬇️ Checkout repository
        uses: actions/checkout@v4

      - name: 🧪 Run smoke tests
        run: |
          npm ci
          npm run test:smoke
        env:
          TEST_URL: https://yourapp.com

      - name: 📊 Run health checks
        run: |
          curl -f https://yourapp.com/health || exit 1
          curl -f https://yourapp.com/api/health || exit 1

  # Cleanup
  cleanup:
    name: 🧹 Cleanup
    runs-on: ubuntu-latest
    needs: [deploy-production, deploy-staging]
    if: always()
    
    steps:
      - name: 🧹 Clean up old artifacts
        run: |
          echo "Cleaning up old build artifacts and images..."
          # Add cleanup commands here
```