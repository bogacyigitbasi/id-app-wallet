Design or review database schema for performance, scalability, and data integrity.

## Process

1. **Requirements Gathering**
   - What entities and relationships exist?
   - Read vs write ratio?
   - Expected data volume and growth rate?
   - Query patterns (OLTP vs OLAP)?
   - Consistency requirements (ACID vs BASE)?

2. **Schema Design**

   **Normalization**
   - [ ] 3NF for OLTP (reduce redundancy)
   - [ ] Denormalize strategically for read performance
   - [ ] Document denormalization trade-offs

   **Naming Conventions**
   - Tables: snake_case, plural (users, order_items)
   - Columns: snake_case (created_at, user_id)
   - Indexes: idx_{table}_{columns}
   - Foreign keys: fk_{table}_{ref_table}

   **Data Types**
   - [ ] Use appropriate types (no VARCHAR for dates)
   - [ ] UUID vs auto-increment for PKs
   - [ ] JSONB for semi-structured (PostgreSQL)
   - [ ] ENUM for fixed options
   - [ ] Timestamps with timezone

3. **Indexing Strategy**
   - [ ] Primary key on every table
   - [ ] Index foreign keys
   - [ ] Composite indexes for common query patterns
   - [ ] Partial indexes for filtered queries
   - [ ] Covering indexes for read-heavy queries
   - [ ] Avoid over-indexing (write penalty)

4. **Data Integrity**
   - [ ] NOT NULL where required
   - [ ] CHECK constraints for business rules
   - [ ] Foreign key constraints with appropriate ON DELETE
   - [ ] Unique constraints for business keys
   - [ ] Default values where sensible

5. **Performance Considerations**
   - [ ] Partition large tables (by date, tenant)
   - [ ] Archive/purge strategy for old data
   - [ ] Connection pooling configured
   - [ ] Query timeout limits
   - [ ] Explain analyze for critical queries

6. **Migration Strategy**
   - [ ] Versioned migrations (numbered files)
   - [ ] Backward-compatible changes
   - [ ] Zero-downtime migration plan
   - [ ] Rollback scripts for each migration
   - [ ] Data backfill strategy

7. **Output**
   Generate:
   - ERD diagram (Mermaid)
   - SQL DDL statements
   - Migration files
   - Index recommendations
   - Query examples with EXPLAIN

$ARGUMENTS
