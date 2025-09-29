// Knex.js configuration for INT Smart Triage AI 2.0
// Database migrations system for Supabase PostgreSQL

try {
  require('dotenv').config();
} catch (_err) {
  // dotenv not available, continue with environment variables
}

module.exports = {
  development: {
    client: 'pg',
    connection: {
      connectionString: process.env.SUPABASE_URL ? 
        process.env.SUPABASE_URL.replace('https://', 'postgres://postgres:') + 
        `${process.env.SUPABASE_PASSWORD}@${process.env.SUPABASE_URL.split('//')[1]}/postgres` :
        process.env.DATABASE_URL || 'postgres://localhost:5432/triage_dev',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    }
  },

  staging: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    pool: {
      min: 2,
      max: 10
    }
  },

  production: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    pool: {
      min: 2,
      max: 10
    }
  }
};