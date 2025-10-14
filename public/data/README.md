# INT Triage Data Files

This directory contains structured data files that support the INT Smart Triage AI system.

## Files Overview

### personas.json
**Purpose**: Defines all personas used in the triage system, including INT team members and client personas.

**Contents**:
- **7 INT Team Members**: Internal specialists who handle different service categories
  - Sarah Johnson (Information Security)
  - Mike Chen (Technology)
  - Emma Williams (Website Design)
  - James Brown (Branding & Identity)
  - Lisa Martinez (Content Creation)
  - David Park (Managed Marketing)
  - Rachel Thompson (Operations)

- **10 Actual Client Personas**: Based on real INT Inc. clients with testimonials
  - Medical Practice Owner (Dr. Renee Marshall)
  - E-Commerce Marketing Director (Jamie Schwartz)
  - Government VP (Selen Warner)
  - HR Manager (Kami Hunt)
  - Fuel Operations Manager
  - Client Success Manager (Katya Yushanova)
  - Marketing & Business Dev Manager (Gregory J. Benson)
  - VP Product & Operations (Marissa Luedy)
  - Chief People Officer (Susan Pils)
  - Non-profit Service Manager (SACPT)

- **4 Fictional Best-Practice Personas**: Cover common scenarios not in testimonials
  - Manufacturing CFO
  - Startup Founder
  - Biotech Compliance Officer
  - Retail Marketing Coordinator

**Total Personas**: 21

**Structure**:
```json
{
  "id": "unique_identifier",
  "name": "Person Name",
  "role": "Job Title",
  "department": "Client or Service Category",
  "experience_level": "junior|intermediate|senior|expert",
  "communication_style": "technical|consultative|creative|etc",
  "specialties": ["specialty1", "specialty2"],
  "tone_preference": "preferred_communication_tone",
  "escalation_threshold": "low|medium|high",
  "testimonial": "Optional client testimonial",
  "needs": ["service1", "service2"]
}
```

### kb.json
**Purpose**: Knowledge base articles covering all INT services.

**Contents**: 33 articles across 7 service categories
- Information Security (4 articles)
- Technology (5 articles)
- Website Design (6 articles)
- Branding & Identity (4 articles)
- Content Creation (4 articles)
- Managed Marketing (5 articles)
- Operations (5 articles)

**Structure**:
```json
{
  "id": "kb001",
  "title": "Article Title",
  "category": "service_category",
  "content": "Article content describing the service",
  "tags": ["keyword1", "keyword2"]
}
```

### query-types.json
**Purpose**: Template queries for each service category to help train and guide the triage AI.

**Contents**: 40 query templates across 7 service categories
- Information Security: 5 templates
- Technology: 7 templates
- Website Design: 7 templates
- Branding & Identity: 6 templates
- Content Creation & Strategy: 5 templates
- Managed Marketing: 6 templates
- Operations: 4 templates

**Structure**:
```json
{
  "service_category": "category_name",
  "category_name": "Display Name",
  "queries": [
    {
      "id": "query_id",
      "title": "Query Title",
      "example": "Example customer query text",
      "keywords": ["keyword1", "keyword2"],
      "priority": "low|medium|high",
      "typical_response_time": "Response time expectation",
      "related_kb_articles": ["kb001", "kb002"]
    }
  ]
}
```

## Usage in the Application

### Demo Interface (demo.html)
- Loads personas from `personas.json` to populate persona selector
- Uses knowledge base from `kb.json` for context (future enhancement)
- Query types inform expected input patterns

### Triage Engine (src/services/triageEngine.js)
- Uses keywords from query-types.json to improve categorization
- Routes tickets based on persona specialties
- Matches customer queries to service categories

### Gemini AI Service (src/services/geminiService.js)
- Enhanced prompts reference INT's 7 service categories
- Uses query patterns to improve understanding
- Generates responses aligned with INT's communication style

### Response Templates
- Team member personas inform tone and approach
- Client personas help understand typical needs
- Query types guide template creation

## Maintenance

When updating these files:

1. **Validate JSON Syntax**: Always validate JSON before committing
   ```bash
   python3 -m json.tool data/personas.json > /dev/null
   ```

2. **Check IDs are Unique**: Ensure all IDs are unique within each file

3. **Update Related Documentation**: Keep INT_PERSONAS_QUERIES_RESOURCES.md in sync

4. **Test Loading**: Verify the application loads data correctly after changes

## Related Documentation

- [INT_PERSONAS_QUERIES_RESOURCES.md](../INT_PERSONAS_QUERIES_RESOURCES.md) - Comprehensive documentation on personas, query types, and use cases
- [INT_INTEGRATION_COMPLETE.md](../INT_INTEGRATION_COMPLETE.md) - Complete integration documentation
- [README.md](../README.md) - Main project documentation

## Data Sources

- **Real Client Data**: Based on actual INT Inc. client testimonials and case studies from intinc.com
- **Service Descriptions**: Aligned with INT Inc.'s actual service offerings
- **Best Practices**: Fictional personas based on common industry patterns and needs

---

**Last Updated**: Based on comprehensive INT Inc. service documentation  
**Total Data Points**: 21 personas + 33 KB articles + 40 query templates
