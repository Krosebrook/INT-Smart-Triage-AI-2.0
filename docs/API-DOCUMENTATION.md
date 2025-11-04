# API Documentation - OpenAPI/Swagger Specification

This document provides comprehensive API documentation for the **INT Smart Triage AI 2.0** system using the OpenAPI 3.0.3 specification.

## 📋 Overview

The OpenAPI specification (`openapi.yaml`) documents all available API endpoints, including:

### Existing Production APIs
- **GET /api/health-check** - System health verification with RLS status
- **POST /api/triage-report** - AI-powered ticket triage processing

### Example APIs (as requested)
- **POST /api/ideas** - Create new feature ideas or enhancement requests
- **GET /api/ideas/{id}** - Retrieve specific idea details
- **GET /api/users/me** - Get current user profile information

## 🚀 Benefits for Development & QA Teams

### For Developers
- **📖 Interactive Documentation**: Use Swagger UI to explore and test APIs directly in the browser
- **🔄 Consistent Contracts**: Standardized request/response schemas prevent integration issues
- **🛠️ Code Generation**: Auto-generate client SDKs in multiple programming languages (JavaScript, Python, Java, etc.)
- **✅ Validation**: Automatic request/response validation against defined schemas
- **🏗️ API Mocking**: Create mock servers for frontend development before backend completion

### For QA Teams
- **🧪 Test Case Generation**: Generate comprehensive test cases from OpenAPI specifications
- **📊 Contract Testing**: Validate that APIs conform to their documented behavior
- **🔍 Edge Case Identification**: Schema definitions help identify boundary conditions and validation requirements
- **📈 Coverage Analysis**: Ensure all documented endpoints and scenarios are tested

### For API Consumers
- **📚 Self-Service Documentation**: Complete reference without needing to contact the development team
- **🎯 Example-Driven Learning**: Rich examples for every endpoint and scenario
- **⚡ Rapid Integration**: Clear schemas and examples accelerate integration development
- **🔧 Troubleshooting**: Detailed error responses help diagnose integration issues

## 🛠️ Using the OpenAPI Specification

### Option 1: Swagger UI (Recommended)

1. **Online Swagger Editor**:
   - Visit [editor.swagger.io](https://editor.swagger.io/)
   - Copy and paste the contents of `openapi.yaml`
   - Explore the interactive documentation

2. **Local Swagger UI Setup**:
   ```bash
   # Install swagger-ui-serve globally
   npm install -g swagger-ui-serve
   
   # Serve the documentation
   swagger-ui-serve openapi.yaml
   
   # Open browser to http://localhost:3000
   ```

3. **Docker-based Swagger UI**:
   ```bash
   docker run -p 8080:8080 -v $(pwd):/usr/share/nginx/html/spec \
     -e SWAGGER_JSON=/usr/share/nginx/html/spec/openapi.yaml \
     swaggerapi/swagger-ui
   ```

### Option 2: Generate Client SDKs

Using OpenAPI Generator to create client libraries:

```bash
# Install OpenAPI Generator
npm install @openapitools/openapi-generator-cli -g

# Generate JavaScript/TypeScript client
openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-fetch \
  -o ./generated-client

# Generate Python client
openapi-generator-cli generate \
  -i openapi.yaml \
  -g python \
  -o ./python-client
```

### Option 3: API Testing with Postman

1. Import the OpenAPI specification into Postman:
   - Open Postman
   - Click "Import" → "Upload Files"
   - Select `openapi.yaml`
   - Generate a collection from the specification

2. Postman will automatically create:
   - Pre-configured requests for all endpoints
   - Environment variables for server URLs
   - Example request bodies from the specification

## 🔍 Key API Endpoints Documented

### 1. Health Check API
- **Endpoint**: `GET /api/health-check`
- **Purpose**: Monitor system health, database connectivity, and RLS enforcement
- **Features**:
  - 10-second response caching
  - 3-second timeout protection
  - Comprehensive status reporting
  - Security compliance verification

### 2. Triage Processing API
- **Endpoint**: `POST /api/triage-report`
- **Purpose**: Process customer support tickets with AI-powered prioritization
- **Features**:
  - Input validation and sanitization
  - AI-driven priority assignment
  - Empathetic response generation
  - Knowledge base article suggestions
  - Secure audit logging with RLS

### 3. Ideas Management API (Examples)
- **Endpoint**: `POST /api/ideas`, `GET /api/ideas/{id}`
- **Purpose**: Demonstrate idea/feature request management patterns
- **Features**:
  - Structured idea submission
  - Categorization and tagging
  - Status tracking and workflow
  - Voting and collaboration features

### 4. User Management API (Examples)
- **Endpoint**: `GET /api/users/me`
- **Purpose**: Show user profile and authentication patterns
- **Features**:
  - Role-based permissions
  - User preferences and customization
  - Performance statistics
  - Department and team information

## 📝 Schema Validation

All endpoints include comprehensive schema definitions with:

- **Data Types**: String, integer, boolean, array, object
- **Validation Rules**: Pattern matching, length limits, enum values
- **Required Fields**: Clearly marked mandatory parameters
- **Example Values**: Realistic sample data for each field
- **Error Responses**: Detailed error schemas with examples

## 🔐 Security Documentation

The specification includes security requirements:
- **API Key Authentication**: X-API-Key header for protected endpoints
- **Row Level Security**: Database-level security enforcement
- **Input Sanitization**: Automatic data cleaning and validation
- **Audit Logging**: Comprehensive request tracking

## 🧪 Testing Integration

### Automated Testing
```javascript
// Example: Validate API response against schema
import { validateResponse } from 'openapi-response-validator';
import spec from './openapi.yaml';

const validator = validateResponse(spec, '/api/health-check', 'get');
const validationResult = validator.validateResponse('200', response.body);
```

### Contract Testing
```bash
# Use Dredd for contract testing
npm install -g dredd
dredd openapi.yaml https://your-api.com --reporter=html
```

## 🚀 Next Steps

1. **Review the Specification**: Open `openapi.yaml` in Swagger UI to explore all endpoints
2. **Integrate with Development**: Use the specification for client generation and testing
3. **Customize for Your Needs**: Extend the example endpoints (ideas/users) as needed
4. **Automate Testing**: Integrate OpenAPI-based testing into your CI/CD pipeline
5. **Keep Updated**: Maintain the specification as APIs evolve

## 📞 Support

For questions about the API documentation or to request additional endpoints:
- Review the main project [README.md](./README.md)
- Check the [DEPLOYMENT.md](./DEPLOYMENT.md) for operational details
- Contact the INT Inc. technical team through the repository issues

---

**Built with ❤️ for INT Inc. Customer Success** | **OpenAPI 3.0.3 Standard** | **Developer-First Documentation**