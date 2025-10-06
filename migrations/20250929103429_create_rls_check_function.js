/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.raw(`
    CREATE OR REPLACE FUNCTION check_rls_status(table_name TEXT)
    RETURNS JSON AS $$
    DECLARE
        result JSON;
    BEGIN
        SELECT json_build_object(
            'table_name', table_name,
            'rls_enabled', 
            CASE 
                WHEN relrowsecurity THEN true 
                ELSE false 
            END,
            'policies_count', (
                SELECT COUNT(*) 
                FROM pg_policies 
                WHERE tablename = table_name
            )
        ) INTO result
        FROM pg_class 
        WHERE relname = table_name;
        
        RETURN result;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER
  `)
  .then(() => {
    // Grant execute permission to service role
    return knex.raw('GRANT EXECUTE ON FUNCTION check_rls_status(TEXT) TO service_role');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.raw('DROP FUNCTION IF EXISTS check_rls_status(TEXT)');
};
