from testcontainers.postgres import PostgresContainer
import sqlmodel

with PostgresContainer("postgres:16") as postgres:
    psql_url = postgres.get_connection_url()
    print(f"Connection URL: {psql_url}")