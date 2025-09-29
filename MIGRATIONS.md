# Database Migrations Guide

## Overview

This project now uses **Knex.js** migrations to manage database schema changes in a controlled, versioned manner. This replaces the manual SQL execution approach and provides better collaboration and deployment safety.

## Why Migrations Matter

### Problems with Manual SQL Changes:
- **Environment Drift**: Different databases may have different schemas
- **No Version Control**: Hard to track what changed when
- **Deployment Risk**: Manual steps are error-prone
- **Collaboration Issues**: Team members may have different database states
- **No Rollback**: Difficult to undo problematic changes

### Benefits of Migration System:
- **Version Control**: All schema changes are tracked in git
- **Reproducible**: Same schema across all environments
- **Rollback Support**: Easy to undo problematic migrations
- **Team Collaboration**: Everyone has the same database state
- **CI/CD Integration**: Automated deployment of schema changes

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database (Supabase)
- Environment variables configured

### Installation
```bash
npm install knex pg dotenv --save
```

## Configuration

The migration system is configured in `knexfile.js` with support for multiple environments:

- **Development**: Local development database
- **Staging**: Staging environment
- **Production**: Production database

Environment variables required:
- `DATABASE_URL`: PostgreSQL connection string
- `SUPABASE_URL`: Supabase project URL  
- `SUPABASE_PASSWORD`: Database password (for development)

## Commands

### Create a New Migration
```bash
npm run migrate:make -- migration_name
```
Example:
```bash
npm run migrate:make -- create_users_table
npm run migrate:make -- add_email_to_users
npm run migrate:make -- create_index_on_reports
```

### Run Migrations (Apply Changes)
```bash
# Run all pending migrations
npm run migrate:latest

# Run a specific migration up
npm run migrate:up -- 001_migration_name.js
```

### Rollback Migrations (Undo Changes)
```bash
# Rollback the last batch of migrations
npm run migrate:rollback

# Rollback to a specific migration
npm run migrate:down -- 001_migration_name.js
```

### Check Migration Status
```bash
npm run migrate:status
```

## Sample Migrations

### 1. Create Ideas Table Migration
**File**: `migrations/YYYYMMDDHHMMSS_create_ideas_table.js`

```javascript
exports.up = function(knex) {
  return knex.schema.createTable('ideas', function(table) {
    table.bigIncrements('id').primary();
    table.string('title', 200).notNullable();
    table.text('description').notNullable();
    table.timestamps(true, true); // created_at, updated_at
    
    // Indexes
    table.index(['created_at']);
    table.index(['title']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('ideas');
};
```

### 2. Add Column Migration
**File**: `migrations/YYYYMMDDHHMMSS_add_status_to_ideas.js`

```javascript
exports.up = function(knex) {
  return knex.schema.alterTable('ideas', function(table) {
    table.enum('status', ['draft', 'published', 'archived']).defaultTo('draft');
    table.index(['status']);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('ideas', function(table) {
    table.dropColumn('status');
  });
};
```

### 3. Create Index Migration
**File**: `migrations/YYYYMMDDHHMMSS_create_compound_index_ideas.js`

```javascript
exports.up = function(knex) {
  return knex.schema.alterTable('ideas', function(table) {
    table.index(['status', 'created_at'], 'idx_ideas_status_created');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('ideas', function(table) {
    table.dropIndex(['status', 'created_at'], 'idx_ideas_status_created');
  });
};
```

## Migration Best Practices

### 1. Always Include Down Migration
Every `up` function must have a corresponding `down` function for rollbacks.

### 2. Use Descriptive Names
```bash
# Good
npm run migrate:make -- create_ideas_table
npm run migrate:make -- add_email_index_to_users
npm run migrate:make -- remove_deprecated_status_column

# Bad
npm run migrate:make -- update_table
npm run migrate:make -- fix_stuff
```

### 3. Test Migrations Both Ways
```bash
# Test up migration
npm run migrate:latest

# Test down migration  
npm run migrate:rollback

# Test up again
npm run migrate:latest
```

### 4. Keep Migrations Atomic
Each migration should handle one logical change:
- Create one table
- Add one column
- Create one index

### 5. Handle Data Safely
```javascript
// Good - handles existing data
exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.string('email').nullable(); // Allow null initially
  })
  .then(() => {
    // Set default values for existing records
    return knex('users').whereNull('email').update({ email: 'unknown@example.com' });
  })
  .then(() => {
    // Now make it required
    return knex.schema.alterTable('users', function(table) {
      table.string('email').notNullable().alter();
    });
  });
};
```

## Deployment Process

### Development
```bash
# Create and run migrations locally
npm run migrate:make -- create_new_feature_table
npm run migrate:latest
```

### Staging/Production
```bash
# Set appropriate environment
export NODE_ENV=production

# Run migrations
npm run migrate:latest

# Verify status
npm run migrate:status
```

### CI/CD Integration
Add to your deployment pipeline:
```yaml
- name: Run Database Migrations  
  run: |
    export NODE_ENV=production
    npm run migrate:latest
```

## Troubleshooting

### Common Issues

1. **"Migration table not found"**
   - First time setup - Knex will create the migrations table automatically
   
2. **"Connection refused"**
   - Check DATABASE_URL environment variable
   - Verify database is accessible
   
3. **"Migration already exists"**
   - Use `npm run migrate:status` to see current state
   - Check if migration was already applied

4. **"RLS Permission denied"**
   - Ensure you're using service_role key, not anon key
   - Check that policies allow service_role access

### Recovery Commands
```bash
# Check what migrations have run
npm run migrate:status

# Force unlock if migrations are stuck
npx knex migrate:unlock

# Rollback and reapply if needed
npm run migrate:rollback
npm run migrate:latest
```

## Security Considerations

### Row Level Security (RLS)
Our migrations automatically enable RLS on sensitive tables like `reports`:

```javascript
.then(() => {
  return knex.raw('ALTER TABLE reports ENABLE ROW LEVEL SECURITY');
})
.then(() => {
  return knex.raw(`
    CREATE POLICY "Deny all public access" ON reports
        FOR ALL TO public USING (false) WITH CHECK (false)
  `);
})
```

### Environment Variables
Never commit database credentials. Use environment variables:
- Production: Set in Vercel dashboard
- Development: Use `.env` file (gitignored)

## Integration with Existing System

The migration system works alongside the existing Supabase setup:

1. **Existing Tables**: The `reports` table is now managed by migrations
2. **Manual Setup**: `supabase-setup.sql` can still be used for initial setup
3. **API Compatibility**: All existing API endpoints continue to work
4. **Health Checks**: The existing health check system remains functional

## Next Steps

1. **Migrate Existing Schema**: Convert remaining manual SQL to migrations
2. **Add Data Seeds**: Use Knex seeds for test data
3. **CI/CD Integration**: Automate migrations in deployment pipeline
4. **Monitoring**: Add logging for migration execution
5. **Backup Strategy**: Ensure backups before major migrations

---

**Remember**: Always backup your database before running migrations in production!